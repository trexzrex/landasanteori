import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');

function loadTs(relative, imports) {
  const source = readFileSync(new URL(relative, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports, require: (name) => {
      if (name in imports) return imports[name];
      return require(name);
    }, URL, process, console: { error() {}, warn() {} },
  });
  return exports;
}

// Doubles replace the external Supabase transport, not authorization or validation.
function fixture({ role = 'user', signedIn = true, broken = false, enabled = true } = {}) {
  const rows = { settings: { enabled, message: 'Pemeliharaan database', updated_at: '2026-11-20T10:00:00Z' } };
  let updates = 0;
  const db = {
    auth: { getUser: async () => ({ data: { user: signedIn ? { id: 'user-1' } : null }, error: null }) },
    from(table) {
      assert.ok(['profiles', 'maintenance_settings'].includes(table));
      let patch;
      const query = {
        select() { return query; }, eq() { return query; },
        update(value) { updates++; patch = value; return query; },
        async single() {
          if (table === 'profiles') return { data: { role }, error: null };
          if (broken) return { data: null, error: { message: 'Database offline' } };
          if (patch) Object.assign(rows.settings, patch);
          return { data: rows.settings, error: null };
        },
      };
      return query;
    },
  };
  const policy = loadTs('../src/lib/maintenance-policy.ts', {});
  const maintenance = loadTs('../src/lib/maintenance.ts', { '@/lib/maintenance-policy': policy });
  const route = loadTs('../src/app/api/maintenance/route.ts', {
    'next/server': { NextResponse: { json: (data, init) => Response.json(data, init) } },
    '@/lib/supabase/server': { createClient: async () => db },
    '@/lib/maintenance': maintenance,
  });
  return { route, rows, updates: () => updates, db, policy, maintenance };
}
function patch(body, origin = 'http://localhost:3000') {
  return new Request('http://localhost:3000/api/maintenance', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', origin }, body: JSON.stringify(body),
  });
}

test('anonymous status request requires authentication', async () => {
  const f = fixture({ signedIn: false });
  assert.equal((await f.route.GET()).status, 401);
});
test('regular users cannot change maintenance, even with a valid payload', async () => {
  const f = fixture();
  assert.equal((await f.route.PATCH(patch({ enabled: false, message: 'Normal' }))).status, 403);
  assert.equal(f.updates(), 0);
});
test('admin can turn maintenance off and the next read reflects it without caching', async () => {
  const f = fixture({ role: 'admin' });
  const result = await f.route.PATCH(patch({ enabled: false, message: '  Layanan kembali  ' }));
  assert.equal(result.status, 200);
  const get = await f.route.GET();
  const data = await get.json();
  assert.equal(data.enabled, false);
  assert.equal(data.message, 'Layanan kembali');
  assert.equal(data.isAdmin, true);
  assert.match(get.headers.get('Cache-Control'), /no-store/);
});
test('invalid settings never reach database writes', async () => {
  const f = fixture({ role: 'admin' });
  assert.equal((await f.route.PATCH(patch({ enabled: 'true', message: '' }))).status, 400);
  assert.equal(f.updates(), 0);
});
test('failed writes are not reported as saved', async () => {
  const f = fixture({ role: 'admin', broken: true });
  assert.equal((await f.route.PATCH(patch({ enabled: false, message: 'Coba simpan' }))).status, 503);
});
test('failed settings reads block normal users but retain admin recovery', async () => {
  const f = fixture({ broken: true });
  const data = await (await f.route.GET()).json();
  assert.equal(data.available, false);
  assert.equal(f.policy.getMaintenanceAccess(data, 'user'), 'blocked');
  assert.equal(f.policy.getMaintenanceAccess(data, 'admin'), 'admin');
});
test('cross-origin mutations are rejected before writes', async () => {
  const f = fixture({ role: 'admin' });
  assert.equal((await f.route.PATCH(patch({ enabled: true, message: 'Maintenance' }, 'https://other.test'))).status, 403);
  assert.equal(f.updates(), 0);
});
test('generator returns maintenance before reserving quota or invoking AI', async () => {
  const f = fixture();
  const forbidden = () => { throw new Error('Generation must not start'); };
  const route = loadTs('../src/app/api/generate/route.ts', {
    'next/server': { NextResponse: { json: (data, init) => Response.json(data, init) }, after: forbidden },
    '@/lib/schemas': { generateFormSchema: { safeParse: forbidden } },
    '@/lib/journal-api': { fetchAllSources: forbidden, formatAPA: forbidden, searchStandards: forbidden },
    '@/lib/gemini': { generateLandasanTeori: forbidden },
    '@/lib/supabase': { logActivity: forbidden },
    '@/lib/translator': { translateToEnglish: forbidden },
    '@/lib/telegram': { getErrorMessage: forbidden, sendGenerationNotification: forbidden },
    '@/lib/supabase/server': { createClient: async () => f.db },
    '@/lib/supabase/admin': { getAdminSupabase: forbidden },
    '@/lib/quota': { checkUserQuota: forbidden, consumeUserQuota: forbidden },
    '@/lib/maintenance': f.maintenance,
    '@/lib/maintenance-policy': f.policy,
  });
  const response = await route.POST(new Request('http://localhost:3000/api/generate', { method: 'POST' }));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'MAINTENANCE');
});

test('admin generation bypasses maintenance and reaches ordinary input validation', async () => {
  const f = fixture({ role: 'admin' });
  const route = loadTs('../src/app/api/generate/route.ts', {
    'next/server': { NextResponse: { json: (data, init) => Response.json(data, init) }, after() {} },
    '@/lib/schemas': { generateFormSchema: { safeParse: () => ({ success: false }) } },
    '@/lib/journal-api': {}, '@/lib/gemini': {}, '@/lib/supabase': {},
    '@/lib/translator': {}, '@/lib/telegram': {},
    '@/lib/supabase/server': { createClient: async () => f.db },
    '@/lib/supabase/admin': {}, '@/lib/quota': {},
    '@/lib/maintenance': f.maintenance,
    '@/lib/maintenance-policy': f.policy,
  });
  const response = await route.POST(new Request('http://localhost:3000/api/generate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
  }));
  assert.equal(response.status, 400);
  assert.notEqual((await response.json()).code, 'MAINTENANCE');
});
