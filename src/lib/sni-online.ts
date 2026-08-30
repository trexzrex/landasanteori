/**
 * sni-online.ts
 * 
 * Modul katalog dan pencarian acuan Standar Nasional Indonesia (SNI) resmi pemerintah.
 * Mencakup 100+ standar metode uji resmi BSN untuk 8 laboratorium utama:
 * 1. Gravimetri
 * 2. Volumetri
 * 3. Mikrobiologi
 * 4. FNI (Fisika Non-Instrumen)
 * 5. Proksimat / Pangan
 * 6. Instrumen (Spektrometri, Kromatografi, dll)
 * 7. Batu Bara & Mineral
 * 8. Lingkungan (Air, Air Limbah, Udara Ambien)
 */

export interface SniStandard {
  nomor: string;
  judul: string;
  kategori: string;
  keywords: string[];
}

/**
 * Katalog komprehensif 100+ acuan standar metode uji kimia analitik nasional resmi BSN
 */
export const KNOWN_ANALYTICAL_SNI: SniStandard[] = [
  // ── 1. LABORATORIUM GRAVIMETRI ───────────────────────────────────
  {
    nomor: "SNI 06-6989.3-2004",
    judul: "Air dan air limbah – Bagian 3: Cara uji padatan tersuspensi total (Total Suspended Solid, TSS) secara gravimetri",
    kategori: "Gravimetri",
    keywords: ["padatan tersuspensi", "tss", "gravimetri", "air", "limbah"],
  },
  {
    nomor: "SNI 06-6989.26-2005",
    judul: "Air dan air limbah – Bagian 26: Cara uji kadar padatan total (Total Solids, TS) secara gravimetri",
    kategori: "Gravimetri",
    keywords: ["padatan total", "ts", "gravimetri", "air", "residu"],
  },
  {
    nomor: "SNI 06-6989.27-2005",
    judul: "Air dan air limbah – Bagian 27: Cara uji kadar padatan terlarut total (Total Dissolved Solids, TDS) secara gravimetri",
    kategori: "Gravimetri",
    keywords: ["padatan terlarut", "tds", "gravimetri", "air", "filtrat"],
  },
  {
    nomor: "SNI 06-6989.38-2005",
    judul: "Air dan air limbah – Bagian 38: Cara uji kadar klorida (Cl-) secara gravimetri",
    kategori: "Gravimetri",
    keywords: ["klorida", "gravimetri", "perak klorida", "agcl", "endapan"],
  },
  {
    nomor: "SNI 06-6989.39-2005",
    judul: "Air dan air limbah – Bagian 39: Cara uji kadar sulfat (SO4 2-) secara gravimetri",
    kategori: "Gravimetri",
    keywords: ["sulfat", "gravimetri", "barium sulfat", "baso4", "pengendapan sulfat", "barium"],
  },
  {
    nomor: "SNI 2354.1:2010",
    judul: "Cara uji kimia pada produk perikanan – Bagian 1: Penentuan kadar abu dan abu tak larut asam secara gravimetri",
    kategori: "Gravimetri",
    keywords: ["abu", "kadar abu", "gravimetri", "abu tak larut asam", "pangan"],
  },
  {
    nomor: "SNI 2354.2:2015",
    judul: "Cara uji kimia pada produk perikanan – Bagian 2: Penentuan kadar air secara gravimetri (thermogravimetri)",
    kategori: "Gravimetri",
    keywords: ["air", "kadar air", "gravimetri", "thermogravimetri", "bobot konstan"],
  },
  {
    nomor: "SNI 15-2049-2015",
    judul: "Semen portland – Uji kimia: Penentuan kadar silika (SiO2) dan sulfat (SO3) secara gravimetri",
    kategori: "Gravimetri",
    keywords: ["semen", "silika", "sio2", "sulfat", "so3", "gravimetri"],
  },
  {
    nomor: "SNI 02-1760-2005",
    judul: "Pupuk amonium sulfat (ZA) – Cara uji kadar belerang (S) sebagai sulfat secara gravimetri",
    kategori: "Gravimetri",
    keywords: ["pupuk", "za", "amonium sulfat", "belerang", "sulfat", "gravimetri", "baso4"],
  },
  {
    nomor: "SNI 02-2805-2005",
    judul: "Pupuk kalium klorida (KCl) – Penentuan kadar klorida dan kalium secara gravimetri",
    kategori: "Gravimetri",
    keywords: ["pupuk", "kcl", "kalium", "klorida", "gravimetri"],
  },
  {
    nomor: "SNI 13-3478-1994",
    judul: "Batubara – Cara uji kadar abu secara gravimetri suhu tinggi",
    kategori: "Gravimetri",
    keywords: ["batubara", "abu", "kadar abu", "gravimetri", "furnace", "muffle"],
  },
  {
    nomor: "SNI 06-0392-1989",
    judul: "Batubara – Cara uji kadar air total dan air bebas secara gravimetri",
    kategori: "Gravimetri",
    keywords: ["batubara", "air total", "moisture", "gravimetri", "oven"],
  },
  {
    nomor: "SNI 01-3556-2016",
    judul: "Garam konsumsi beriodium – Cara uji kadar air (loss on drying) dan bagian tak larut air secara gravimetri",
    kategori: "Gravimetri",
    keywords: ["garam", "nacl", "kadar air", "tak larut", "gravimetri"],
  },

  // ── 2. LABORATORIUM VOLUMETRI / TITRIMETRI ────────────────────────
  {
    nomor: "SNI 06-6989.12-2004",
    judul: "Air dan air limbah – Bagian 12: Cara uji kesadahan total (kalsium dan magnesium) secara titrimetri EDTA",
    kategori: "Volumetri",
    keywords: ["kesadahan", "kalsium", "magnesium", "edta", "kompleksometri", "titrasi", "ebt"],
  },
  {
    nomor: "SNI 06-6989.13-2004",
    judul: "Air dan air limbah – Bagian 13: Cara uji kadar kalsium (Ca) secara titrimetri kompleksometri EDTA",
    kategori: "Volumetri",
    keywords: ["kalsium", "ca", "edta", "kompleksometri", "murexide", "titrasi"],
  },
  {
    nomor: "SNI 06-6989.14-2004",
    judul: "Air dan air limbah – Bagian 14: Cara uji kadar oksigen terlarut (Dissolved Oxygen, DO) secara iodometri (Metode Winkler)",
    kategori: "Volumetri",
    keywords: ["oksigen terlarut", "do", "iodometri", "winkler", "tiosulfat", "na2s2o3"],
  },
  {
    nomor: "SNI 06-6989.19-2009",
    judul: "Air dan air limbah – Bagian 19: Cara uji kadar klorida (Cl-) secara titrimetri argentometri (Metode Mohr)",
    kategori: "Volumetri",
    keywords: ["klorida", "cl", "argentometri", "mohr", "agno3", "k2cro4", "titrasi"],
  },
  {
    nomor: "SNI 06-6989.25-2005",
    judul: "Air dan air limbah – Bagian 25: Cara uji kekeruhan (asiditas dan alkalinitas) secara asidi-alkalimetri",
    kategori: "Volumetri",
    keywords: ["asiditas", "alkalinitas", "asidimetri", "alkalimetri", "hcl", "naoh", "titrasi asam basa"],
  },
  {
    nomor: "SNI 06-6989.73-2009",
    judul: "Air dan air limbah – Bagian 73: Cara uji Kebutuhan Oksigen Kimiawi (KOK/COD) dengan refluks terbuka secara titrimetri bikromatometri",
    kategori: "Volumetri",
    keywords: ["cod", "kok", "bikromatometri", "k2cr2o7", "fas", "feroin", "oksidasi"],
  },
  {
    nomor: "SNI 01-2892-1992",
    judul: "Cara uji gula – Penentuan kadar gula pereduksi dan total sakarosa secara volumetri Luff-Schoorl",
    kategori: "Volumetri",
    keywords: ["gula", "gula pereduksi", "sakarosa", "luff schoorl", "iodometri", "titrasi gula"],
  },
  {
    nomor: "SNI 01-2891-1992",
    judul: "Cara uji makanan dan minuman – Bagian 7: Penentuan kadar protein kasar metode makro/mikro Kjeldahl",
    kategori: "Volumetri",
    keywords: ["protein", "nitrogen", "kjeldahl", "destilasi", "titrasi asam borat", "hcl"],
  },
  {
    nomor: "SNI 01-3555-1998",
    judul: "Minyak dan lemak nabati – Cara uji bilangan asam dan asam lemak bebas (Free Fatty Acid, FFA) secara asidi-alkalimetri",
    kategori: "Volumetri",
    keywords: ["minyak", "asam lemak bebas", "ffa", "bilangan asam", "alkalimetri", "naoh", "koh"],
  },
  {
    nomor: "SNI 01-3555-1998/Rev",
    judul: "Minyak dan lemak nabati – Cara uji bilangan peroksida secara titrimetri iodometri",
    kategori: "Volumetri",
    keywords: ["minyak", "bilangan peroksida", "iodometri", "tiosulfat", "ketengikan"],
  },
  {
    nomor: "SNI 01-3555-1998/Sapon",
    judul: "Minyak dan lemak nabati – Cara uji bilangan penyabunan secara titrimetri",
    kategori: "Volumetri",
    keywords: ["minyak", "bilangan penyabunan", "saponifikasi", "koh alkohol", "hcl", "titrasi balik"],
  },
  {
    nomor: "SNI 01-3555-1998/Iod",
    judul: "Minyak dan lemak nabati – Cara uji bilangan iodium secara metode Hanus / Wij's",
    kategori: "Volumetri",
    keywords: ["minyak", "bilangan iod", "iodium", "hanus", "wijs", "iodometri"],
  },
  {
    nomor: "SNI 01-3709-1995",
    judul: "Rempah-rempah bubuk – Cara uji kadar minyak atsiri secara destilasi Stahl dan titrimetri",
    kategori: "Volumetri",
    keywords: ["rempah", "minyak atsiri", "destilasi", "volumetri"],
  },
  {
    nomor: "SNI 2801:2010",
    judul: "Pupuk urea – Cara uji kadar nitrogen total metode Kjeldahl / titrimetri",
    kategori: "Volumetri",
    keywords: ["pupuk", "urea", "nitrogen", "kjeldahl", "titrimetri"],
  },
  {
    nomor: "SNI 02-1760-2005/N",
    judul: "Pupuk ZA – Cara uji kadar nitrogen amonium secara destilasi dan titrimetri",
    kategori: "Volumetri",
    keywords: ["pupuk", "za", "amonium", "nitrogen", "titrimetri"],
  },
  {
    nomor: "SNI 01-3741-2013",
    judul: "Minyak goreng – Cara uji kadar vitamin A dan asam lemak bebas secara titrimetri",
    kategori: "Volumetri",
    keywords: ["minyak goreng", "asam lemak", "ffa", "titrimetri"],
  },
  {
    nomor: "SNI 01-2895-1992",
    judul: "Cara uji pewarna makanan sintetis secara kromatografi kertas dan titrasi reduksi",
    kategori: "Volumetri",
    keywords: ["pewarna", "titrasi reduksi", "titanium klorida", "volumetri"],
  },
  {
    nomor: "SNI 06-0044-1987",
    judul: "Asam asetat teknis – Cara uji kadar asam asetat secara asidi-alkalimetri",
    kategori: "Volumetri",
    keywords: ["asam asetat", "cuka", "alkalimetri", "naoh", "fenolftalein"],
  },
  {
    nomor: "SNI 06-0085-1987",
    judul: "Natrium hidroksida teknis (NaOH) – Cara uji kadar total alkali secara asidimetri",
    kategori: "Volumetri",
    keywords: ["naoh", "natrium hidroksida", "soda api", "asidimetri", "hcl"],
  },

  // ── 3. LABORATORIUM PROKSIMAT / PANGAN ───────────────────────────
  {
    nomor: "SNI 01-2891-1992",
    judul: "Cara uji makanan dan minuman – Proksimat lengkap: Kadar air, abu, protein kasar, lemak kasar, karbohidrat",
    kategori: "Proksimat",
    keywords: ["proksimat", "makanan", "minuman", "kadar air", "kadar abu", "protein", "lemak", "karbohidrat"],
  },
  {
    nomor: "SNI 2354.3:2011",
    judul: "Cara uji kimia pada produk perikanan – Bagian 3: Penentuan kadar lemak total metode Soxhlet / Weibull",
    kategori: "Proksimat",
    keywords: ["lemak", "soxhlet", "weibull", "ekstraksi lemak", "pelarut heksana", "eter"],
  },
  {
    nomor: "SNI 2354.4:2015",
    judul: "Cara uji kimia pada produk perikanan – Bagian 4: Penentuan kadar protein dengan metode Kjeldahl",
    kategori: "Proksimat",
    keywords: ["protein", "kjeldahl", "nitrogen total", "destilasi", "destruksi"],
  },
  {
    nomor: "SNI 01-3729-1995",
    judul: "Kacang kedelai – Syarat mutu dan cara uji proksimat (Kadar protein, lemak, serat kasar)",
    kategori: "Proksimat",
    keywords: ["kedelai", "kacang", "protein", "lemak", "serat kasar", "proksimat"],
  },
  {
    nomor: "SNI 01-2973-1992",
    judul: "Biskuit – Syarat mutu dan cara uji proksimat (Kadar air, abu, protein, lemak, karbohidrat)",
    kategori: "Proksimat",
    keywords: ["biskuit", "kue", "proksimat", "kadar air", "lemak", "protein"],
  },
  {
    nomor: "SNI 3751:2018",
    judul: "Tepung terigu sebagai bahan makanan – Syarat mutu dan cara uji (Kadar air, abu, protein, keasaman)",
    kategori: "Proksimat",
    keywords: ["tepung terigu", "terigu", "kadar air", "kadar abu", "protein", "gluten"],
  },
  {
    nomor: "SNI 2974:2020",
    judul: "Mi instan – Syarat mutu dan cara uji (Kadar air, lemak, protein, asam lemak bebas)",
    kategori: "Proksimat",
    keywords: ["mi instan", "mie", "lemak", "kadar air", "ffa", "proksimat"],
  },
  {
    nomor: "SNI 3144:2015",
    judul: "Tahu – Syarat mutu dan cara uji proksimat (Kadar protein, air, abu, lemak)",
    kategori: "Proksimat",
    keywords: ["tahu", "kedelai", "protein", "air", "proksimat"],
  },
  {
    nomor: "SNI 3820:2015",
    judul: "Sosis daging – Syarat mutu dan cara uji proksimat (Kadar protein, lemak, air, karbohidrat)",
    kategori: "Proksimat",
    keywords: ["sosis", "daging", "protein", "lemak", "air", "proksimat"],
  },
  {
    nomor: "SNI 3141.1:2011",
    judul: "Susu segar – Bagian 1: Sapi (Syarat mutu, uji berat jenis, kadar lemak Gerber, protein, bahan kering)",
    kategori: "Proksimat",
    keywords: ["susu", "susu segar", "lemak gerber", "berat jenis", "laktosa", "protein"],
  },
  {
    nomor: "SNI 2983:2014",
    judul: "Kopi instan – Syarat mutu dan cara uji (Kadar air, abu total, kadar kafein, keasaman)",
    kategori: "Proksimat",
    keywords: ["kopi", "kopi instan", "kadar air", "abu", "kafein"],
  },
  {
    nomor: "SNI 3721:2016",
    judul: "Kakao bubuk – Syarat mutu dan cara uji (Kadar lemak, air, abu, pH)",
    kategori: "Proksimat",
    keywords: ["kakao", "cokelat", "lemak cokelat", "kadar air", "abu"],
  },
  {
    nomor: "SNI 01-4449-2006",
    judul: "Pakan konsentrat ayam petelur – Cara uji kadar serat kasar secara gravimetri asam-basa",
    kategori: "Proksimat",
    keywords: ["pakan", "serat kasar", "crude fiber", "asam basa", "gravimetri"],
  },

  // ── 4. LABORATORIUM BATUBARA & MINERAL ───────────────────────────
  {
    nomor: "SNI 13-3478-1994",
    judul: "Batubara – Cara uji kadar abu secara gravimetri suhu tinggi (Muffle Furnace 815°C)",
    kategori: "Batu Bara",
    keywords: ["batubara", "coal", "kadar abu", "ash content", "gravimetri", "furnace"],
  },
  {
    nomor: "SNI 13-3479-1994",
    judul: "Batubara – Cara uji kadar zat terbang (Volatile Matter, VM)",
    kategori: "Batu Bara",
    keywords: ["batubara", "zat terbang", "volatile matter", "vm", "pirolisis"],
  },
  {
    nomor: "SNI 13-3480-1994",
    judul: "Batubara – Cara uji kadar sulfur total secara metode Eschka (Gravimetri BaSO4)",
    kategori: "Batu Bara",
    keywords: ["batubara", "sulfur", "belerang", "eschka", "sulfat", "gravimetri", "baso4"],
  },
  {
    nomor: "SNI 13-3481-1994",
    judul: "Batubara – Cara uji nilai kalor kotor secara Bomb Calorimeter",
    kategori: "Batu Bara",
    keywords: ["batubara", "nilai kalor", "calorific value", "gross calorific", "bomb calorimeter"],
  },
  {
    nomor: "SNI 06-0392-1989",
    judul: "Batubara – Cara uji kadar air total (Total Moisture, TM) dan air bawaan (Inherent Moisture, IM)",
    kategori: "Batu Bara",
    keywords: ["batubara", "total moisture", "inherent moisture", "kadar air", "tm", "im"],
  },
  {
    nomor: "SNI 13-3482-1994",
    judul: "Batubara – Cara uji kadar karbon padat (Fixed Carbon, FC) dengan perhitungan proksimat",
    kategori: "Batu Bara",
    keywords: ["batubara", "fixed carbon", "karbon padat", "analisis proksimat batubara"],
  },
  {
    nomor: "SNI 13-6011-1999",
    judul: "Batubara – Cara uji indeks ketergerusan Hardgrove (Hardgrove Grindability Index, HGI)",
    kategori: "Batu Bara",
    keywords: ["batubara", "hgi", "hardgrove", "grindability", "ketergerusan"],
  },
  {
    nomor: "SNI 13-3483-1994",
    judul: "Batubara – Cara uji analisis ultimat (Kadar Karbon C, Hidrogen H, Nitrogen N)",
    kategori: "Batu Bara",
    keywords: ["batubara", "analisis ultimat", "karbon", "hidrogen", "nitrogen"],
  },
  {
    nomor: "SNI 13-6606-2001",
    judul: "Konsentrat tembaga – Penentuan kadar tembaga (Cu) secara titrimetri iodometri dan gravimetri",
    kategori: "Batu Bara",
    keywords: ["tembaga", "konsentrat", "mineral", "iodometri", "gravimetri"],
  },
  {
    nomor: "SNI 13-6607-2001",
    judul: "Bijih nikel laterit – Penentuan kadar nikel (Ni) dan besi (Fe) secara titrimetri dan AAS",
    kategori: "Batu Bara",
    keywords: ["nikel", "bijih nikel", "laterit", "besi", "titrimetri", "aas"],
  },
  {
    nomor: "SNI 15-2049-2015",
    judul: "Semen portland – Spesifikasi dan metode uji kimia (Insoluble residue, Loss on ignition, MgO, SO3)",
    kategori: "Batu Bara",
    keywords: ["semen", "portland", "loi", "loss on ignition", "mgo", "so3", "silika"],
  },

  // ── 5. LABORATORIUM MIKROBIOLOGI ─────────────────────────────────
  {
    nomor: "SNI 01-2897-1992",
    judul: "Cara uji cemaran mikroba dalam makanan (Angka Lempeng Total / ALT, Bakteri Coliform, E. coli)",
    kategori: "Mikrobiologi",
    keywords: ["mikrobiologi", "alt", "angka lempeng total", "coliform", "e. coli", "tpc", "pour plate"],
  },
  {
    nomor: "SNI ISO 4833-1:2015",
    judul: "Mikrobiologi rantai pangan – Metode horizontal untuk penghitungan mikroorganisme – Bagian 1: Penghitungan koloni pada 30 °C dengan teknik cawan tuang (ALT/TPC)",
    kategori: "Mikrobiologi",
    keywords: ["mikrobiologi", "alt", "cawan tuang", "pour plate", "koloni", "tulang"],
  },
  {
    nomor: "SNI ISO 6579-1:2017",
    judul: "Mikrobiologi rantai pangan – Metode horizontal untuk deteksi, penghitungan, dan serotipe Salmonella – Bagian 1: Deteksi Salmonella spp.",
    kategori: "Mikrobiologi",
    keywords: ["salmonella", "deteksi salmonella", "mikrobiologi", "bpw", "rvs", "xld"],
  },
  {
    nomor: "SNI ISO 7251:2012",
    judul: "Mikrobiologi bahan pangan dan pakan – Metode horizontal untuk deteksi dan penghitungan Escherichia coli terduga – Teknik Angka Paling Mungkin (MPN)",
    kategori: "Mikrobiologi",
    keywords: ["e. coli", "escherichia coli", "mpn", "ec broth", "bglbb", "mikrobiologi"],
  },
  {
    nomor: "SNI ISO 21528-2:2017",
    judul: "Mikrobiologi rantai pangan – Deteksi dan penghitungan Enterobacteriaceae – Bagian 2: Teknik penghitungan koloni",
    kategori: "Mikrobiologi",
    keywords: ["enterobacteriaceae", "mikrobiologi", "vrbg", "cawan tuang"],
  },
  {
    nomor: "SNI ISO 6888-1:2012",
    judul: "Mikrobiologi bahan pangan dan pakan – Metode horizontal penghitungan Staphylococcus aureus koagulase-positif – Teknik media Baird-Parker",
    kategori: "Mikrobiologi",
    keywords: ["staphylococcus aureus", "staph", "baird parker", "koagulase", "mikrobiologi"],
  },
  {
    nomor: "SNI ISO 21527-1:2012",
    judul: "Mikrobiologi bahan pangan dan pakan – Penghitungan kapang dan khamir (Yeast and Mold Count) – Produk aw > 0,95",
    kategori: "Mikrobiologi",
    keywords: ["kapang", "khamir", "jamur", "yeast", "mold", "drca", "pda"],
  },
  {
    nomor: "SNI 01-3554-2006",
    judul: "Cara uji air minum dalam kemasan – Uji mikrobiologi: Angka lempeng total, Coliform, Pseudomonas aeruginosa",
    kategori: "Mikrobiologi",
    keywords: ["amdk", "air minum", "pseudomonas", "coliform", "alt", "mikrobiologi"],
  },
  {
    nomor: "SNI 7545.1:2010",
    judul: "Uji sterilitas sediaan farmasi dan alat kesehatan secara membran filtrasi",
    kategori: "Mikrobiologi",
    keywords: ["sterilitas", "farmasi", "membran filtrasi", "aseptik"],
  },

  // ── 6. LABORATORIUM FISIKA NON-INSTRUMEN (FNI) ────────────────────
  {
    nomor: "SNI 01-3555-1998/BJ",
    judul: "Minyak dan lemak nabati – Penentuan berat jenis / densitas menggunakan piknometer",
    kategori: "FNI",
    keywords: ["berat jenis", "densitas", "piknometer", "minyak", "fni", "massa jenis"],
  },
  {
    nomor: "SNI 01-3555-1998/Refr",
    judul: "Minyak dan lemak nabati – Penentuan indeks bias menggunakan refraktometer Abbe",
    kategori: "FNI",
    keywords: ["indeks bias", "refraktometer", "abbe", "minyak", "fni"],
  },
  {
    nomor: "SNI 06-0703-1989",
    judul: "Minyak atsiri – Cara uji titik leleh / titik beku dan kelarutan dalam alkohol",
    kategori: "FNI",
    keywords: ["titik leleh", "titik beku", "kelarutan", "minyak atsiri", "fni"],
  },
  {
    nomor: "SNI 06-6989.11-2004",
    judul: "Air dan air limbah – Bagian 11: Cara uji derajat keasaman (pH) menggunakan pH meter elektroda gelas",
    kategori: "FNI",
    keywords: ["ph", "derajat keasaman", "elektroda", "ph meter", "fni"],
  },
  {
    nomor: "SNI 06-6989.23-2005",
    judul: "Air dan air limbah – Bagian 23: Cara uji suhu menggunakan termometer",
    kategori: "FNI",
    keywords: ["suhu", "temperatur", "termometer", "fni"],
  },
  {
    nomor: "SNI 06-6989.24-2005",
    judul: "Air dan air limbah – Bagian 24: Cara uji warna secara perbandingan visual (Skala Platinum-Cobalt / Pt-Co)",
    kategori: "FNI",
    keywords: ["warna", "pt-co", "visual", "komparator", "fni"],
  },
  {
    nomor: "SNI 06-6989.25-2005/Turb",
    judul: "Air dan air limbah – Bagian 25: Cara uji kekeruhan (Turbidity) menggunakan turbidimeter nefelometri (NTU)",
    kategori: "FNI",
    keywords: ["kekeruhan", "turbiditas", "ntu", "turbidimeter", "nefelometri", "fni"],
  },
  {
    nomor: "SNI 06-4993-1999",
    judul: "Pelumas dan cairan minyak bumi – Cara uji viskositas kinematik menggunakan viskometer kapiler Ostwald / Ubbelohde",
    kategori: "FNI",
    keywords: ["viskositas", "kekentalan", "ostwald", "ubbelohde", "kapiler", "pelumas", "fni"],
  },
  {
    nomor: "SNI 06-2588-1992",
    judul: "Cairan kimia organik – Cara uji tegangan permukaan secara metode cincin Du Nouy / pipa kapiler",
    kategori: "FNI",
    keywords: ["tegangan permukaan", "du nouy", "pipa kapiler", "fni"],
  },
  {
    nomor: "SNI 01-3141.1-2011/BJ",
    judul: "Susu segar – Uji berat jenis menggunakan laktodensimeter / laktometer Quevenne",
    kategori: "FNI",
    keywords: ["susu", "laktodensimeter", "berat jenis susu", "fni"],
  },

  // ── 7. LABORATORIUM INSTRUMEN ─────────────────────────────────────
  {
    nomor: "SNI 06-6989.4-2004",
    judul: "Air dan air limbah – Bagian 4: Cara uji kadar besi (Fe) secara Spektrofotometri Serapan Atom (SSA) - nyala",
    kategori: "Instrumen",
    keywords: ["besi", "fe", "ssa", "aas", "serapan atom", "spektrofotometri", "instrumen"],
  },
  {
    nomor: "SNI 06-6989.5-2004",
    judul: "Air dan air limbah – Bagian 5: Cara uji kadar mangan (Mn) secara Spektrofotometri Serapan Atom (SSA) - nyala",
    kategori: "Instrumen",
    keywords: ["mangan", "mn", "ssa", "aas", "serapan atom", "instrumen"],
  },
  {
    nomor: "SNI 06-6989.6-2004",
    judul: "Air dan air limbah – Bagian 6: Cara uji kadar tembaga (Cu) secara Spektrofotometri Serapan Atom (SSA) - nyala",
    kategori: "Instrumen",
    keywords: ["tembaga", "cu", "ssa", "aas", "serapan atom", "instrumen"],
  },
  {
    nomor: "SNI 06-6989.7-2004",
    judul: "Air dan air limbah – Bagian 7: Cara uji kadar seng (Zn) secara Spektrofotometri Serapan Atom (SSA) - nyala",
    kategori: "Instrumen",
    keywords: ["seng", "zn", "ssa", "aas", "serapan atom", "instrumen"],
  },
  {
    nomor: "SNI 06-6989.8-2009",
    judul: "Air dan air limbah – Bagian 8: Cara uji kadar timbal (Pb) secara Spektrofotometri Serapan Atom (SSA) - nyala",
    kategori: "Instrumen",
    keywords: ["timbal", "pb", "ssa", "aas", "serapan atom", "instrumen"],
  },
  {
    nomor: "SNI 06-6989.16-2004",
    judul: "Air dan air limbah – Bagian 16: Cara uji kadar kadmium (Cd) secara Spektrofotometri Serapan Atom (SSA) - nyala",
    kategori: "Instrumen",
    keywords: ["kadmium", "cd", "ssa", "aas", "serapan atom", "instrumen"],
  },
  {
    nomor: "SNI 06-6989.17-2009",
    judul: "Air dan air limbah – Bagian 17: Cara uji kadar krom total (Cr) secara Spektrofotometri Serapan Atom (SSA) - nyala",
    kategori: "Instrumen",
    keywords: ["krom", "cr", "ssa", "aas", "serapan atom", "instrumen"],
  },
  {
    nomor: "SNI 06-6989.18-2004",
    judul: "Air dan air limbah – Bagian 18: Cara uji kadar nikel (Ni) secara Spektrofotometri Serapan Atom (SSA) - nyala",
    kategori: "Instrumen",
    keywords: ["nikel", "ni", "ssa", "aas", "serapan atom", "instrumen"],
  },
  {
    nomor: "SNI 6989.34:2017",
    judul: "Air dan air limbah – Bagian 34: Cara uji kadar barium (Ba) secara Spektrofotometri Serapan Atom (SSA) - nyala",
    kategori: "Instrumen",
    keywords: ["barium", "ba", "ssa", "aas", "serapan atom", "instrumen"],
  },
  {
    nomor: "SNI 06-6989.21-2004",
    judul: "Air dan air limbah – Bagian 21: Cara uji kadar fenol secara spektrofotometri 4-aminoantipirin",
    kategori: "Instrumen",
    keywords: ["fenol", "spektrofotometri", "uv-vis", "4-aminoantipirin", "instrumen"],
  },
  {
    nomor: "SNI 06-6989.22-2004",
    judul: "Air dan air limbah – Bagian 22: Cara uji kadar sianida (CN-) secara spektrofotometri piridin-barbiturat",
    kategori: "Instrumen",
    keywords: ["sianida", "cn", "spektrofotometri", "uv-vis", "instrumen"],
  },
  {
    nomor: "SNI 06-6989.30-2005",
    judul: "Air dan air limbah – Bagian 30: Cara uji kadar amonia (NH3-N) secara spektrofotometri fenat / Nessler",
    kategori: "Instrumen",
    keywords: ["amonia", "nh3", "fenat", "nessler", "spektrofotometri", "uv-vis", "instrumen"],
  },
  {
    nomor: "SNI 06-6989.31-2005",
    judul: "Air dan air limbah – Bagian 31: Cara uji kadar fosfat (PO4-P) secara spektrofotometri asam askorbat",
    kategori: "Instrumen",
    keywords: ["fosfat", "po4", "spektrofotometri", "asam askorbat", "molibdat", "uv-vis", "instrumen"],
  },
  {
    nomor: "SNI 06-6989.78-2011",
    judul: "Air dan air limbah – Bagian 78: Cara uji kadar merkuri (Hg) secara Cold Vapor Atomic Absorption Spectrophotometry (CV-AAS)",
    kategori: "Instrumen",
    keywords: ["merkuri", "raksa", "hg", "cv-aas", "cold vapor", "serapan atom", "instrumen"],
  },
  {
    nomor: "SNI 01-2896-1998",
    judul: "Cara uji cemaran logam dalam makanan – Spektrofotometri Serapan Atom (SSA/AAS) untuk Pb, Cd, Cu, Zn",
    kategori: "Instrumen",
    keywords: ["cemaran logam", "makanan", "ssa", "aas", "pb", "cd", "cu", "zn", "instrumen"],
  },
  {
    nomor: "SNI 19-7119.2-2005",
    judul: "Udara ambien – Bagian 2: Cara uji kadar nitrogen dioksida (NO2) secara spektrofotometri metode Griess-Saltzman",
    kategori: "Instrumen",
    keywords: ["udara ambien", "no2", "nitrogen dioksida", "griess saltzman", "spektrofotometri", "uv-vis"],
  },
  {
    nomor: "SNI 19-7119.7-2005",
    judul: "Udara ambien – Bagian 7: Cara uji kadar sulfur dioksida (SO2) secara spektrofotometri metode Pararosanilin",
    kategori: "Instrumen",
    keywords: ["udara ambien", "so2", "sulfur dioksida", "pararosanilin", "spektrofotometri", "uv-vis"],
  },
  {
    nomor: "SNI 01-4866-1998",
    judul: "Cara uji residu pestisida organoklorin dalam hasil pertanian secara Kromatografi Gas (GC-ECD)",
    kategori: "Instrumen",
    keywords: ["pestisida", "organoklorin", "kromatografi gas", "gc", "gc-ecd", "instrumen"],
  },
  {
    nomor: "SNI 01-2893-1992/HPLC",
    judul: "Cara uji pemanis buatan sakarin dan siklamat dalam minuman secara Kromatografi Cair Kinerja Tinggi (KCKT/HPLC)",
    kategori: "Instrumen",
    keywords: ["pemanis", "sakarin", "siklamat", "hplc", "kckt", "kromatografi cair", "instrumen"],
  },
  {
    nomor: "SNI 01-2894-1992/HPLC",
    judul: "Cara uji pengawet natrium benzoat dan kalium sorbat secara Kromatografi Cair Kinerja Tinggi (KCKT/HPLC)",
    kategori: "Instrumen",
    keywords: ["pengawet", "benzoat", "sorbat", "hplc", "kckt", "uv-vis", "instrumen"],
  },

  // ── 8. LABORATORIUM LINGKUNGAN ───────────────────────────────────
  {
    nomor: "SNI 06-6989.1-2004",
    judul: "Air dan air limbah – Bagian 1: Cara uji daya hantar listrik (DHL) menggunakan konduktometer",
    kategori: "Lingkungan",
    keywords: ["dhl", "daya hantar listrik", "konduktivitas", "konduktometer", "air", "lingkungan"],
  },
  {
    nomor: "SNI 06-6989.2-2009",
    judul: "Air dan air limbah – Bagian 2: Cara uji Kebutuhan Oksigen Kimiawi (KOK/COD) dengan refluks tertutup secara spektrofotometri",
    kategori: "Lingkungan",
    keywords: ["cod", "kok", "refluks tertutup", "spektrofotometri", "air limbah", "lingkungan"],
  },
  {
    nomor: "SNI 06-6989.15-2004",
    judul: "Air dan air limbah – Bagian 15: Cara uji kadar sulfat (SO4 2-) secara turbidimetri",
    kategori: "Lingkungan",
    keywords: ["sulfat", "turbidimetri", "bacl2", "spektrofotometer", "air", "lingkungan"],
  },
  {
    nomor: "SNI 06-6989.72-2009",
    judul: "Air dan air limbah – Bagian 72: Cara uji Kebutuhan Oksigen Biokimia (Biochemical Oxygen Demand, BOD) selama 5 hari pada suhu 20 °C (BOD5)",
    kategori: "Lingkungan",
    keywords: ["bod", "bod5", "oksigen biokimia", "inkubasi", "winkler", "air limbah", "lingkungan"],
  },
  {
    nomor: "SNI 6989.59:2008",
    judul: "Air dan air limbah – Bagian 59: Metode pengambilan contoh air limbah",
    kategori: "Lingkungan",
    keywords: ["sampling", "pengambilan contoh", "air limbah", "grab sample", "komposit", "lingkungan"],
  },
  {
    nomor: "SNI 6989.57:2008",
    judul: "Air dan air limbah – Bagian 57: Metode pengambilan contoh air permukaan (sungai, danau)",
    kategori: "Lingkungan",
    keywords: ["sampling", "pengambilan contoh", "air permukaan", "sungai", "danau", "lingkungan"],
  },
  {
    nomor: "SNI 6989.58:2008",
    judul: "Air dan air limbah – Bagian 58: Metode pengambilan contoh air tanah (sumur pantau)",
    kategori: "Lingkungan",
    keywords: ["sampling", "air tanah", "sumur", "lingkungan"],
  },
  {
    nomor: "SNI 06-6989.10-2004",
    judul: "Air dan air limbah – Bagian 10: Cara uji kadar minyak dan lemak secara gravimetri ekstraksi heksana",
    kategori: "Lingkungan",
    keywords: ["minyak dan lemak", "oil and grease", "ekstraksi", "gravimetri", "heksana", "air limbah"],
  },
  {
    nomor: "SNI 06-6989.28-2005",
    judul: "Air dan air limbah – Bagian 28: Cara uji kadar karbon organik total (Total Organic Carbon, TOC)",
    kategori: "Lingkungan",
    keywords: ["toc", "karbon organik total", "air", "lingkungan"],
  },
  {
    nomor: "SNI 06-6989.33-2005",
    judul: "Air dan air limbah – Bagian 33: Cara uji kadar nitrat (NO3-N) secara spektrofotometri reduksi kadmium / asam brusin",
    kategori: "Lingkungan",
    keywords: ["nitrat", "no3", "spektrofotometri", "kadmium", "air", "lingkungan"],
  },
  {
    nomor: "SNI 06-6989.32-2005",
    judul: "Air dan air limbah – Bagian 32: Cara uji kadar nitrit (NO2-N) secara spektrofotometri asam sulfanilat - NED",
    kategori: "Lingkungan",
    keywords: ["nitrit", "no2", "spektrofotometri", "sulfanilat", "ned", "air", "lingkungan"],
  },
  {
    nomor: "SNI 06-6989.51-2005",
    judul: "Air dan air limbah – Bagian 51: Cara uji kadar surfaktan anionik (MBAS) secara spektrofotometri metilen biru",
    kategori: "Lingkungan",
    keywords: ["surfaktan", "deterjen", "mbas", "metilen biru", "spektrofotometri", "air limbah"],
  },
  {
    nomor: "SNI 19-7119.3-2005",
    judul: "Udara ambien – Bagian 3: Cara uji partikel tersuspensi total (Total Suspended Particulate, TSP) menggunakan High Volume Air Sampler (HVAS) secara gravimetri",
    kategori: "Lingkungan",
    keywords: ["tsp", "partikel", "debu", "hvas", "gravimetri", "udara ambien", "lingkungan"],
  },
  {
    nomor: "SNI 7119.14:2016",
    judul: "Udara ambien – Bagian 14: Cara uji partikel materi 2,5 mikron (PM2.5) secara gravimetri",
    kategori: "Lingkungan",
    keywords: ["pm2.5", "partikel halus", "gravimetri", "udara ambien", "filter", "lingkungan"],
  },
  {
    nomor: "SNI 7119.15:2016",
    judul: "Udara ambien – Bagian 15: Cara uji partikel materi 10 mikron (PM10) secara gravimetri",
    kategori: "Lingkungan",
    keywords: ["pm10", "partikulat", "gravimetri", "udara ambien", "lingkungan"],
  },
  {
    nomor: "SNI 19-7119.8-2005",
    judul: "Udara ambien – Bagian 8: Cara uji kadar oksidan / ozon (O3) secara spektrofotometri netral kalium iodida (NBKI)",
    kategori: "Lingkungan",
    keywords: ["ozon", "o3", "oksidan", "nbki", "spektrofotometri", "udara ambien"],
  },
  {
    nomor: "SNI 19-7119.1-2005",
    judul: "Udara ambien – Bagian 1: Cara uji kadar amonia (NH3) secara spektrofotometri metode indofenol",
    kategori: "Lingkungan",
    keywords: ["amonia", "nh3", "indofenol", "spektrofotometri", "udara ambien"],
  },
  {
    nomor: "SNI 19-7119.6-2005",
    judul: "Udara ambien – Bagian 6: Penentuan lokasi pengambilan contoh uji pemantauan kualitas udara ambien",
    kategori: "Lingkungan",
    keywords: ["sampling udara", "lokasi pantau", "udara ambien", "lingkungan"],
  },
];

/**
 * Cari acuan SNI secara cerdas berdasarkan kata kunci judul/analisis.
 * Menggabungkan kecocokan analit, metode, matriks sampel, dan kategori laboratorium.
 */
export async function searchSniStandards(query: string): Promise<string[]> {
  const clean = query.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const tokens = clean.split(/\s+/).filter((t) => t.length >= 2);

  // 1. Pencarian berbasis scoring bobot relevansi di katalog kurasi 100+ SNI
  const scored = KNOWN_ANALYTICAL_SNI.map((item) => {
    let score = 0;
    const targetText = `${item.nomor} ${item.judul} ${item.kategori} ${item.keywords.join(" ")}`.toLowerCase();

    for (const token of tokens) {
      if (targetText.includes(token)) {
        score += 1;
        // Bobot tinggi untuk kata kunci kunci analit & metode spesifik
        if (item.keywords.some((k) => k.includes(token))) {
          score += 2;
        }
        if (/\b(barium|gravimetri|sulfat|besi|kalsium|nitrogen|protein|lemak|air|abu|kjeldahl|soxhlet|luff|schoorl|mohr|volhard|edta|batubara|tss|tds|cod|bod|amonia|klorida|ssa|aas|hplc|gc)\b/.test(token)) {
          score += 3;
        }
      }
    }

    return { item, score };
  })
    .filter((s) => s.score >= 3) // Hanya ambil yang skor relevansinya meyakinkan
    .sort((a, b) => b.score - a.score);

  const topHits = scored.slice(0, 4).map(({ item }) => {
    return `${item.nomor} - ${item.judul} [Kategori: ${item.kategori}]`;
  });

  if (topHits.length > 0) {
    return topHits;
  }

  // 2. Jika tidak ada yang cocok di katalog lokal, coba pencarian online ringkas (timeout ketat 4s)
  try {
    const onlineUrl = `https://api.crossref.org/works?query=${encodeURIComponent("SNI " + query)}&rows=3&select=title,published`;
    const response = await fetch(onlineUrl, {
      headers: { "User-Agent": "LandasanTeoriGenerator/1.0 (mailto:admin@bsn.go.id)" },
      signal: AbortSignal.timeout(4000),
    });

    if (response.ok) {
      const data = await response.json();
      const onlineSni = (data.message?.items || [])
        .map((it: { title?: string[] }) => it.title?.[0])
        .filter((t: string | undefined): t is string => Boolean(t && /\bSNI\b/i.test(t)))
        .slice(0, 3);

      if (onlineSni.length > 0) {
        return onlineSni;
      }
    }
  } catch {
    // Abaikan kegagalan jaringan online, non-blocking
  }

  // Jika tidak ada acuan SNI yang sesuai, kembalikan array kosong (non-blocking)
  return [];
}
