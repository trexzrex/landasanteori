<div align="center">

# 📚 Landasan Teori Generator

**Susun landasan teori analisis kimia secara otomatis — berbasis jurnal _open access_, dengan sitasi APA yang tervalidasi dan ekspor PDF standar akademik.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](#-lisensi)

</div>

---

## 📖 Tentang Proyek

**Landasan Teori Generator** adalah aplikasi web untuk membantu analis, mahasiswa, dan praktikan laboratorium kimia menyusun bab **Landasan Teori** yang dapat dipertanggungjawabkan secara ilmiah.

Alih-alih mengarang teks, sistem menggunakan pendekatan **RAG (Retrieval-Augmented Generation)**: mesin lebih dulu **mencari jurnal ilmiah _open access_** yang relevan, lalu AI **hanya menulis berdasarkan abstrak jurnal yang benar-benar ditemukan**. Jika tidak ada referensi yang cocok, proses dihentikan — bukan diisi dengan halusinasi.

Setiap klaim diberi nomor rujukan `[1]`, `[2]`, terhubung ke **daftar pustaka format APA**, dan hasilnya dapat diunduh sebagai **PDF standar penulisan ilmiah**.

> ⚗️ Dirancang khusus untuk 8 kategori laboratorium: **Gravimetri, Volumetri, Mikrobiologi, FNI, Proksimat, Instrumen, Batu Bara, dan Lingkungan.**

---

## ✨ Fitur Utama

- 🔎 **Pencarian jurnal otomatis** — menelusuri **OpenAlex** (utama), **Semantic Scholar**, dan **Crossref** untuk literatur _open access_, lalu dide-duplikasi & diperingkat berdasarkan relevansi, sitasi, dan kebaruan.
- 🛡️ **Anti-halusinasi** — AI dipaksa menulis hanya dari abstrak yang tersedia. Kualitas output diperiksa otomatis (jumlah kata, paragraf, & validitas sitasi) dengan perluasan iteratif bila belum memenuhi target.
- 🔁 **Rantai multi-provider AI** — Gemini → OpenRouter → AIHubMix → endpoint OpenAI-compatible. Urutan prioritas dapat diatur via env, dengan _cooldown_ otomatis saat kuota provider habis.
- 🌐 **Terjemahan pintar** — judul analisis berbahasa Indonesia diubah menjadi beberapa query ilmiah bahasa Inggris agar hasil pencarian jurnal lebih akurat (dengan _fallback_ kamus deterministik).
- 🇮🇩 **Referensi standar SNI** — katalog 100+ Standar Nasional Indonesia (BSN) turut disisipkan sesuai kategori laboratorium.
- 📝 **Sitasi & daftar pustaka APA** — dirapikan otomatis dari metadata jurnal.
- 📄 **Ekspor PDF akademik** — A4, margin 4-3-3-3 cm, Times-Roman 12pt, spasi 1.5, rata kanan-kiri, nomor halaman.
- 📊 **Dashboard & analytics** — statistik generasi pribadi (grafik aktivitas, distribusi kedalaman, lab terpopuler), riwayat, tingkat keberhasilan, dan sistem peringkat peneliti.
- 🔐 **Autentikasi lengkap** — verifikasi email (OTP), onboarding, login username/email + password, Google OAuth, dan reset password.
- 👤 **Panel admin** — statistik global, manajemen peran pengguna, dan audit generasi lintas pengguna.
- ⏱️ **Kuota & rate limiting** — 5 generasi/hari per akun (reset tengah malam WIB), plus proteksi _brute-force_ pada login via Upstash Redis.
- 🌗 **Dark/Light mode**, animasi hormat `prefers-reduced-motion`, dan aksesibilitas (skip-link, ARIA, navigasi keyboard).
- 💬 **Feedback bot Telegram** — laporan bug/saran dan notifikasi generasi langsung ke Telegram.

---

## 🧱 Tech Stack

| Lapisan | Teknologi |
|---|---|
| **Framework** | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| **Styling** | Tailwind CSS v4, Radix UI, Framer Motion, `next-themes` |
| **Data/Chart** | Recharts |
| **AI** | Google Gemini (`@google/genai`) + OpenRouter / AIHubMix / OpenAI-compatible |
| **Sumber jurnal** | OpenAlex · Semantic Scholar · Crossref |
| **Auth & Database** | Supabase (Auth + PostgreSQL + RLS) via `@supabase/ssr` |
| **Rate limiting** | Upstash Redis (`@upstash/ratelimit`) |
| **PDF** | `@react-pdf/renderer` |
| **Validasi** | Zod + React Hook Form |
| **Notifikasi** | Telegram Bot API |

---

## 🔄 Cara Kerja (Pipeline RAG)

```
Input Form (judul analisis, laboratorium, kedalaman)
        │
        ▼
Autentikasi Supabase (wajib login)  ─────────────►  401 bila belum login
        │
        ▼
Reservasi baris "pending" di tabel generations
        │
        ▼
Cek kuota harian (5/hari, admin unlimited)  ─────►  429 bila habis
        │
        ▼
Terjemahkan judul → query ilmiah (multi-provider + kamus fallback)
        │
        ▼
Cari jurnal: OpenAlex → Semantic Scholar → Crossref
   (dedup DOI/judul + ranking)             ─────►  404 bila tak ada referensi
        │
        ▼
Sisipkan standar SNI relevan
        │
        ▼
Sintesis AI (anti-halusinasi + cek kualitas + perluasan iteratif)  ──►  502 bila gagal
        │
        ▼
Format sitasi & daftar pustaka APA
        │
        ▼
Update generations → "success"
        │
        ├──► (background) log aktivitas · notifikasi Telegram · konsumsi kuota
        ▼
Respons JSON → Preview di klien → Ekspor PDF
```

---

## 🚀 Memulai

### Prasyarat

- **Node.js** 18.17+ atau 20+
- **npm**
- Akun/kredensial layanan berikut:
  - [Google Gemini API Key](https://aistudio.google.com/app/apikey) (dan/atau provider AI lain)
  - [Supabase](https://supabase.com/) (Auth + PostgreSQL)
  - [Upstash Redis](https://upstash.com/) (rate limiting)
  - [Telegram Bot](https://core.telegram.org/bots#how-do-i-create-a-bot) (opsional, untuk feedback & alert)

### Instalasi

```bash
# 1. Clone repository
git clone https://github.com/trexzrex/landasanteori.git
cd landasanteori

# 2. Install dependencies
npm install

# 3. Siapkan environment variables
cp .env.example .env.local        # Windows: Copy-Item .env.example .env.local
# lalu isi .env.local dengan kredensial Anda

# 4. Jalankan development server
npm run dev
```

Buka **http://localhost:3000**.

### Setup Database (Supabase)

Jalankan file migrasi SQL di **Supabase Dashboard → SQL Editor** secara berurutan:

```
supabase/migration.sql                        # skema dasar (profiles, generations, dll.)
supabase/migration-quota-and-rls-fix.sql
supabase/migration-password-login.sql
supabase/migration-auth-ux-complete.sql
supabase/migration-cleanup-stale-pending.sql
```

Migrasi ini membuat tabel (`profiles`, `generations`, `generation_events`, `user_quota`, `user_activities`), _view_ statistik admin, kebijakan **Row Level Security**, serta fungsi & trigger (auto-seed profil saat signup, proteksi eskalasi peran, resolusi username→email, dan pembersihan generasi _pending_ basi).

### Template Email (Supabase Auth)

Desain email siap pakai tersedia di `supabase/templates/`. Salin isi tiap file ke **Supabase Dashboard → Authentication → Email Templates**:

| File | Template Dashboard | Variabel wajib |
|---|---|---|
| `supabase/templates/confirm-signup.html` | **Confirm signup** | `{{ .Token }}` |
| `supabase/templates/magic-link.html` | **Magic Link** | `{{ .Token }}` |
| `supabase/templates/reset-password.html` | **Reset Password** | `{{ .ConfirmationURL }}` |

Subject line yang disarankan:

- Confirm signup — `Kode verifikasi LandasanTeori: {{ .Token }}`
- Magic Link — `Kode masuk LandasanTeori: {{ .Token }}`
- Reset Password — `Atur ulang password LandasanTeori`

> ⚠️ **Jangan hapus `{{ .Token }}`** pada template signup & magic link — halaman `/verify` meminta user mengetik kode OTP 6 digit, bukan mengklik tautan. Untuk reset password, pertahankan `{{ .ConfirmationURL }}` pada tombol.

### Environment Variables

Semua variabel didokumentasikan di [`.env.example`](./.env.example). Ringkasan kelompok utama:

| Grup | Variabel |
|---|---|
| **Gemini** | `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL` |
| **Provider AI lain** | `OPENROUTER_*`, `AIHUBMIX_*`, `TERRA_*`, `FREETOKENFAUCET_*` |
| **Urutan fallback** | `PROVIDER_*_ORDER` (kecil = duluan, `0` = nonaktif) |
| **Parameter generasi** | `GENERATION_BUDGET_SECONDS`, `MAX_EXPANSION_ROUNDS` |
| **Jurnal** | `OPENALEX_EMAIL`, `OPENALEX_API_KEY`, `SEMANTIC_SCHOLAR_API_KEY` |
| **Rate limit** | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| **Telegram** | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` dan token Telegram bersifat **server-only** — jangan pernah diberi prefix `NEXT_PUBLIC_`.

---

## 📡 API Reference

### `POST /api/generate`

Menghasilkan landasan teori. **Wajib autentikasi** (cookie sesi Supabase).

**Request body**

```json
{
  "user_info":     { "nama": "string?", "nis": "string?", "kelas": "string?" },
  "analysis_data": { "judul_analisis": "string (10–200 char)", "kata_kunci": "string | string[]" },
  "settings":      { "laboratorium": "string (2–100 char)", "kedalaman_teori": "singkat | menengah | mendalam" }
}
```

**Response `200`**

```json
{
  "status": "success",
  "message": "Landasan teori berhasil dibuat.",
  "data": {
    "generation_id": "uuid",
    "landasan_teori": "teks dengan sitasi [1], [2] ...",
    "daftar_pustaka": ["Referensi format APA ..."]
  },
  "quota": { "daily_used": 1, "daily_limit": 5, "remaining": 4, "unlimited": false }
}
```

**Kode error**

| Status | Arti |
|---|---|
| `400` | Input tidak valid (gagal validasi Zod) |
| `401` | Belum login |
| `404` | Tidak ditemukan jurnal referensi |
| `429` | Kuota harian habis (header `Retry-After: 86400`) |
| `502` | Model AI gagal menghasilkan output yang memenuhi kriteria |
| `500` | Kesalahan server internal |

### Endpoint lain

| Endpoint | Fungsi |
|---|---|
| `POST /api/feedback` | Kirim bug/saran ke Telegram |
| `POST /api/auth/login` | Login username/email + password (rate-limited) |
| `POST /api/auth/username-email` | Resolusi username → email (rate-limited) |

---

## 📂 Struktur Proyek

```
landasan-teori/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Landing page
│   │   ├── generate/                 # Form generator
│   │   ├── result/                   # Preview & unduh PDF
│   │   ├── dashboard/                # Overview, history, profile, admin
│   │   ├── login, onboarding,        # Alur autentikasi
│   │   │   verify, reset-password/
│   │   ├── auth/                      # OAuth callback & signout
│   │   ├── api/                       # generate, feedback, auth
│   │   ├── privacy-policy,            # Halaman legal
│   │   │   terms-of-service/
│   │   ├── layout.tsx
│   │   └── globals.css               # Design tokens (dark/light)
│   ├── components/
│   │   ├── ui/                        # Primitives (Button, Card, Input, ...)
│   │   ├── sections/                  # Section landing page
│   │   └── pdf-document.tsx           # Template @react-pdf/renderer
│   ├── lib/
│   │   ├── gemini.ts                  # Rantai multi-provider AI + anti-halusinasi
│   │   ├── journal-api.ts             # OpenAlex + Semantic Scholar + Crossref
│   │   ├── sni-online.ts              # Katalog standar SNI
│   │   ├── translator.ts              # Query ilmiah ID→EN
│   │   ├── quota.ts                   # Kuota harian
│   │   ├── ratelimit.ts               # Upstash Redis
│   │   ├── telegram.ts                # Feedback & alert
│   │   ├── schemas.ts                 # Skema Zod
│   │   └── supabase/                  # Client, server, admin, middleware
│   └── middleware.ts                  # Guard rute + refresh sesi
├── supabase/                          # File migrasi SQL
├── public/
├── .env.example
└── README.md
```

---

## 🔒 Keamanan & Batasan

**Rate limiting** (Upstash Redis, _fail-closed_):

- Login per IP: 10 percobaan / 10 menit
- Login per identitas: 5 percobaan / 15 menit
- Lookup username: 20 permintaan / 10 menit

**Kuota generasi:** 5/hari per akun (reset 00:00 WIB); admin tanpa batas.

**Praktik keamanan lain:**

- Sanitasi input & validasi Zod di setiap request
- **Row Level Security** aktif di seluruh tabel; peran diproteksi trigger
- `service_role` key & token Telegram hanya di sisi server
- Pesan error generik untuk mencegah _account enumeration_
- Rahasia disimpan di `.env.local` yang tidak pernah di-commit

**Batasan yang perlu diketahui:**

- Hanya menjangkau jurnal _open access_; topik yang sangat niche mungkin tidak menghasilkan referensi.
- Bergantung pada limit _free tier_ penyedia AI & API jurnal.
- PDF memakai font standar Times-Roman (bold/italic terbatas).

---

## ☁️ Deploy ke Vercel

1. Push repository ini ke GitHub.
2. Di [Vercel](https://vercel.com/new), **Import** repo (framework Next.js terdeteksi otomatis).
3. Tambahkan seluruh **Environment Variables** (lihat [`.env.example`](./.env.example)) di Project Settings.
4. Pastikan migrasi SQL sudah dijalankan di proyek Supabase, dan tambahkan URL produksi Vercel ke daftar _redirect_ Supabase Auth (untuk OAuth/email).
5. **Deploy.**

> Route `POST /api/generate` berjalan hingga `maxDuration = 300s`. Pastikan `GENERATION_BUDGET_SECONDS` ≤ `maxDuration`.

---

## 🧪 Testing

Panduan pengujian end-to-end tersedia di **[TESTING.md](./TESTING.md)** (uji manual via browser, uji API, verifikasi rate limit & logging).

```bash
npm run dev     # development
npm run build   # build produksi
npm run start   # jalankan build produksi
npm run lint    # linting
```

---

## 🤝 Kontribusi

1. Fork repository ini
2. Buat branch fitur: `git checkout -b fitur/nama-fitur`
3. Commit: `git commit -m "feat: tambah fitur X"`
4. Push: `git push origin fitur/nama-fitur`
5. Buka Pull Request

---

## 📝 Lisensi

Dirilis di bawah **[Lisensi MIT](./LICENSE)**.

---

<div align="center">

Dibuat untuk memudahkan penyusunan landasan teori analisis kimia yang valid secara akademis.

**OpenAlex · Semantic Scholar · Crossref · Google Gemini · Supabase · Upstash · Vercel**

</div>
