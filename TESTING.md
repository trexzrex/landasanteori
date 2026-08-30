# Panduan Testing End-to-End
# =========================================================

## 1. Start Development Server

Buka terminal baru dan jalankan:

```bash
npm run dev
```

Tunggu hingga muncul pesan:
```
▲ Next.js 16.3.2
- Local:        http://localhost:3000
✓ Ready in [X]s
```

---

## 2. Test Manual via Browser

### A. Test Landing Page
1. Buka browser: http://localhost:3000
2. Periksa:
   - [x] Hero section tampil
   - [x] Toggle dark/light mode berfungsi
   - [x] Tombol "Mulai Buat" mengarah ke `/generate`

### B. Test Form Generator
1. Buka: http://localhost:3000/generate
2. Isi form:
   - **Nama:** Ahmad Fauzi
   - **NIS:** 12345
   - **Kelas:** XII-KA
   - **Laboratorium:** Lab Kimia Analitik SMK
   - **Judul Analisis:** Penentuan Kadar Besi (Fe) dalam Air Minum menggunakan Spektrofotometer UV-Vis
   - **Kata Kunci:** spektrofotometri, besi, fenantrolin
   - **Kedalaman:** Singkat
3. Klik "Generate Landasan Teori"
4. Tunggu loading (15-30 detik)
5. Verifikasi:
   - [x] Redirect ke `/result`
   - [x] Teks landasan teori tampil dengan sitasi [1], [2]
   - [x] Daftar pustaka terformat APA

### C. Test PDF Download
1. Di halaman Result, klik "Unduh PDF"
2. Verifikasi:
   - [x] PDF ter-download dengan nama `landasan-teori-[tanggal].pdf`
   - [x] PDF terbuka dengan:
     - Margin: Kiri 4cm, Atas/Kanan/Bawah 3cm
     - Font: Times-Roman 12pt
     - Spasi: 1.5
     - Struktur: LANDASAN TEORI → paragraf → DAFTAR PUSTAKA

---

## 3. Test API via cURL (Manual)

Buka terminal kedua (server dev tetap berjalan), lalu:

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "user_info": {
      "nama": "Ahmad Fauzi",
      "nis": "12345",
      "kelas": "XII-KA",
      "laboratorium": "Lab Kimia Analitik SMK"
    },
    "analysis_data": {
      "judul_analisis": "Penentuan Kadar Besi (Fe) dalam Air Minum menggunakan Spektrofotometer UV-Vis",
      "kata_kunci": ["spektrofotometri", "besi", "fenantrolin"]
    },
    "settings": {
      "kedalaman_teori": "singkat"
    }
  }'
```

**Expected Response (setelah 15-30 detik):**
```json
{
  "status": "success",
  "message": "Landasan teori berhasil dibuat.",
  "data": {
    "landasan_teori": "Spektrofotometri merupakan metode analisis...[1]...[2]...",
    "daftar_pustaka": [
      "Author, A. (2023). Title. Journal Name, 10(2), 123-456. https://doi.org/...",
      "..."
    ]
  }
}
```

---

## 4. Test Rate Limiting

Jalankan cURL di atas **6 kali berturut-turut** (interval < 1 jam).

**Expected pada request ke-6:**
```json
{
  "status": "error",
  "message": "Batas pemakaian tercapai (maksimal 5 generasi per jam). Silakan coba lagi nanti."
}
```
HTTP Status: `429 Too Many Requests`

---

## 5. Test Supabase Logging

1. Buka: https://supabase.com/dashboard
2. Pilih project `landasan-teori`
3. Klik **Table Editor** → `user_activities`
4. Verifikasi ada row baru dengan:
   - `nama`: Ahmad Fauzi
   - `status`: SUCCESS
   - `created_at`: timestamp sekarang

---

## 6. Test Error Handling

### A. No Context Found (Judul absurd)
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "user_info": {"nama": "Test", "nis": "123", "kelas": "A", "laboratorium": "Lab"},
    "analysis_data": {"judul_analisis": "Analisis xyz nonsense keyword random text", "kata_kunci": []},
    "settings": {"kedalaman_teori": "singkat"}
  }'
```

**Expected:**
```json
{
  "status": "error",
  "message": "Referensi terpercaya untuk judul analisis ini tidak ditemukan..."
}
```

### B. Invalid Input
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "user_info": {"nama": "A", "nis": "", "kelas": "", "laboratorium": ""},
    "analysis_data": {"judul_analisis": "xyz", "kata_kunci": []},
    "settings": {"kedalaman_teori": "singkat"}
  }'
```

**Expected:**
```json
{
  "status": "error",
  "message": "Data formulir tidak valid. Periksa kembali input Anda."
}
```

---

## 7. Checklist Akhir

- [x] Build sukses tanpa error TypeScript
- [ ] Landing page responsive (mobile/tablet/desktop)
- [ ] Dark/Light mode toggle persisten
- [ ] Form validation mencegah submit data kosong
- [ ] API rate limiting bekerja (5/jam per IP)
- [ ] Jurnal dari OpenAlex ter-fetch (atau fallback Semantic Scholar)
- [ ] Gemini menghasilkan teks dengan sitasi [1], [2]
- [ ] Daftar pustaka formatted APA
- [ ] PDF download dengan format akademik benar
- [ ] Supabase logging mencatat aktivitas (SUCCESS/ERROR_*)

---

## 8. Known Issues & Limitations

1. **OpenAlex/Semantic Scholar API Rate Limits:**
   - OpenAlex: 100,000 req/hari (polite pool dengan email)
   - Semantic Scholar: 100 req/5 menit (tanpa API key)
   
2. **Gemini API Free Tier Limits:**
   - 15 requests/menit
   - 1 juta tokens/hari
   - Jika melebihi → HTTP 429, user harus tunggu

3. **PDF Font Rendering:**
   - Times-Roman adalah built-in PDF font (tidak perlu embed)
   - Browser modern render dengan baik, viewer lama mungkin fallback ke serif default

4. **Supabase Free Tier:**
   - 500MB database
   - 2GB bandwidth/bulan
   - Cukup untuk development, scale ke Pro jika production heavy

---

## 9. Deployment ke Vercel (Optional)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables di Vercel Dashboard:
# - GEMINI_API_KEY
# - OPENALEX_API_KEY
# - OPENALEX_EMAIL
# - UPSTASH_REDIS_REST_URL
# - UPSTASH_REDIS_REST_TOKEN
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
```

Setelah deploy, test ulang di production URL.
