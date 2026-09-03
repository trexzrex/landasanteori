import { LegalPage, LegalSection, LegalList } from "@/components/legal-page";

export const metadata = {
  title: "Syarat & Ketentuan",
  description: "Ketentuan penggunaan layanan Landasan Teori Generator.",
  alternates: {
    canonical: "/terms-of-service",
  },
};

export default function TermsOfServicePage() {
  return (
    <LegalPage title="Syarat & Ketentuan" updatedAt="27 Agustus 2026">
      <p>
        Dengan mengakses dan menggunakan Landasan Teori Generator, Anda menyetujui
        ketentuan berikut. Mohon dibaca dengan saksama sebelum menggunakan layanan.
      </p>

      <LegalSection heading="1. Penerimaan Ketentuan">
        <p>
          Menggunakan platform ini berarti Anda terikat pada Syarat & Ketentuan ini.
          Jika Anda tidak menyetujui salah satu bagian, mohon tidak menggunakan
          layanan kami.
        </p>
      </LegalSection>

      <LegalSection heading="2. Sifat Layanan">
        <p>
          Layanan ini adalah asisten AI yang mencari abstrak jurnal Open Access dan
          menyusunnya menjadi teks berformat akademik. Perhatikan hal berikut:
        </p>
        <LegalList
          items={[
            <><strong className="text-foreground">Tanggung jawab akademik:</strong> teks hasil tidak dijamin bebas dari kesalahan teknis atau halusinasi AI. Anda wajib meninjau, memverifikasi, dan menyunting hasil sebelum menggunakannya untuk tugas akademik.</>,
            <><strong className="text-foreground">Penggunaan wajar:</strong> Anda setuju tidak menyalahgunakan platform dengan bot, skrip otomatis, atau cara lain yang melanggar batas penggunaan.</>,
          ]}
        />
      </LegalSection>

      <LegalSection heading="3. Batas Penggunaan">
        <p>
          Untuk menjaga kestabilan server, berlaku batas maksimal{" "}
          <strong className="text-foreground">5 generasi per hari</strong> per
          akun. Kuota direset setiap hari. Batas ini dapat berubah sewaktu-waktu tanpa pemberitahuan.
        </p>
      </LegalSection>

      <LegalSection heading="4. Keamanan Akun">
        <p>
          Anda bertanggung jawab menjaga kerahasiaan kata sandi. Seluruh aktivitas di
          bawah akun Anda menjadi tanggung jawab Anda. Segera atur ulang kata sandi
          bila mendeteksi aktivitas mencurigakan.
        </p>
      </LegalSection>

      <LegalSection heading="5. Kekayaan Intelektual">
        <p>
          Teknologi, logo, dan desain aplikasi dimiliki oleh pengembang Landasan
          Teori Generator. Hak cipta jurnal, artikel, dan abstrak tetap dipegang oleh
          penerbit atau penulis asli di bawah lisensi Open Access masing-masing. Kami
          hanya memfasilitasi pengambilan dan peringkasan untuk tujuan edukasi.
        </p>
      </LegalSection>

      <LegalSection heading="6. Penafian Jaminan">
        <p>
          Layanan disediakan &quot;sebagaimana adanya&quot;. Kami tidak menjamin
          layanan bebas gangguan atau bebas kesalahan, dan tidak bertanggung jawab
          atas konsekuensi akademik dari penggunaan teks mentah tanpa peninjauan
          Anda.
        </p>
      </LegalSection>

      <LegalSection heading="7. Perubahan Layanan">
        <p>
          Kami berhak mengubah, menangguhkan, atau menghentikan layanan kapan saja
          dengan atau tanpa pemberitahuan.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
