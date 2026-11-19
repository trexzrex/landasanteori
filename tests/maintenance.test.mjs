import test from 'node:test';
import assert from 'node:assert/strict';

// Removing the server-side role bypass or allowing unavailable settings must fail these tests.
const mod = await import('../src/lib/maintenance-policy.ts').catch(() => ({}));

test('maintenance blocks normal users but not administrators', () => {
  assert.equal(typeof mod.getMaintenanceAccess, 'function', 'maintenance policy must exist');
  assert.equal(mod.getMaintenanceAccess({ enabled: true, available: true }, 'user'), 'blocked');
  assert.equal(mod.getMaintenanceAccess({ enabled: true, available: true }, 'admin'), 'admin');
});
test('disabled maintenance permits normal access', () => {
  assert.equal(typeof mod.getMaintenanceAccess, 'function', 'maintenance policy must exist');
  assert.equal(mod.getMaintenanceAccess({ enabled: false, available: true }, 'user'), 'allowed');
});
test('unavailable settings fail closed for users while preserving admin recovery', () => {
  assert.equal(typeof mod.getMaintenanceAccess, 'function', 'maintenance policy must exist');
  assert.equal(mod.getMaintenanceAccess({ enabled: false, available: false }, 'user'), 'blocked');
  assert.equal(mod.getMaintenanceAccess({ enabled: false, available: false }, 'admin'), 'admin');
});
test('only protected route segments are gated, including onboarding', () => {
  assert.equal(typeof mod.isMaintenanceProtectedPath, 'function', 'protected-path policy must exist');
  for (const path of ['/dashboard', '/dashboard/history', '/generate', '/result', '/onboarding', '/admin']) {
    assert.equal(mod.isMaintenanceProtectedPath(path), true, path);
  }
  for (const path of ['/', '/login', '/auth/callback', '/auth/signout', '/reset-password', '/maintenance', '/api/maintenance', '/generate-other']) {
    assert.equal(mod.isMaintenanceProtectedPath(path), false, path);
  }
});
