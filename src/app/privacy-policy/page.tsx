import { LegalPage, LegalSection, LegalList } from "@/components/legal-page";

export const metadata = {
  title: "Kebijakan Privasi | Landasan Teori",
  description: "Bagaimana Landasan Teori Generator mengumpulkan, menggunakan, dan melindungi data Anda.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Kebijakan Privasi" updatedAt="27 Agustus 2026">
      <p>
        Landasan Teori Generator menghargai privasi Anda. Halaman ini menjelaskan
        data apa yang kami kumpulkan, untuk apa digunakan, dan bagaimana kami
        melindunginya saat Anda memakai layanan kami.
      </p>

      <LegalSection heading="1. Informasi yang Kami Kumpulkan">
        <LegalList
          items={[
            <><strong className="text-foreground">Informasi akun:</strong> nama, email, username, NIS, dan kelas. Jika mendaftar via Google, kami menerima nama dan email dari profil publik Google Anda.</>,
            <><strong className="text-foreground">Data analisis:</strong> judul analisis, laboratorium, kata kunci, dan tingkat kedalaman teori yang Anda masukkan untuk membuat dokumen.</>,
            <><strong className="text-foreground">Data penggunaan:</strong> log aktivitas seperti waktu pembuatan, model AI yang dipakai, dan interaksi dasar (mis. unduh PDF) untuk pemantauan dan perbaikan sistem.</>,
          ]}
        />
      </LegalSection>

      <LegalSection heading="2. Bagaimana Kami Menggunakan Data">
        <LegalList
          items={[
            "Menyediakan dan mengoperasikan layanan pembuatan Landasan Teori.",
            "Menampilkan riwayat dan statistik penggunaan di dashboard Anda.",
            "Menegakkan batas penggunaan (maksimal 5 generasi per hari per akun).",
            "Melacak dan memperbaiki kegagalan sistem, termasuk saat AI tidak menemukan konteks jurnal.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="3. Penyimpanan dan Keamanan">
        <p>
          Kata sandi Anda diamankan menggunakan infrastruktur autentikasi standar
          industri (Supabase Auth) dan tidak pernah kami simpan dalam bentuk teks
          biasa. Kami tidak menggunakan data masukan Anda untuk melatih model AI.
          Masukan hanya diproses sementara oleh API penyedia AI untuk menghasilkan
          teks.
        </p>
      </LegalSection>

      <LegalSection heading="4. Berbagi dengan Pihak Ketiga">
        <p>
          Kueri pencarian (judul dan kata kunci) dikirim ke penyedia jurnal seperti
          OpenAlex dan Semantic Scholar untuk mengambil referensi. Kami{" "}
          <strong className="text-foreground">tidak</strong> membagikan nama, NIS,
          email, atau kelas Anda kepada layanan tersebut.
        </p>
      </LegalSection>

      <LegalSection heading="5. Hak Anda">
        <p>
          Anda dapat memperbarui data profil kapan saja melalui halaman profil, atau
          meminta penghapusan akun dengan menghubungi kami. Penghapusan akun akan
          menghapus profil dan riwayat generasi yang terkait.
        </p>
      </LegalSection>

      <LegalSection heading="6. Perubahan Kebijakan">
        <p>
          Kami dapat memperbarui kebijakan ini dari waktu ke waktu. Perubahan
          signifikan akan diumumkan melalui layanan atau email Anda.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
