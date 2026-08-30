export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  nama: string | null;
  nis: string | null;
  kelas: string | null;
  username: string | null;
  password_set: boolean;
  onboarded: boolean;
  role: "user" | "admin";
  created_at: string;
}

export interface UserQuota {
  user_id: string;
  daily_used: number;
  daily_limit: number;
  total_used: number;
  reset_date: string;
  created_at: string;
}

export interface Generation {
  id: string;
  user_id: string;
  laboratorium: string;
  judul_analisis: string;
  kata_kunci: string | null;
  kedalaman: "singkat" | "menengah" | "mendalam";
  landasan_teori: string | null;
  daftar_pustaka: string[];
  jumlah_jurnal: number;
  word_count: number;
  model_used: string | null;
  duration_ms: number | null;
  status: "pending" | "success" | "error";
  error_message: string | null;
  created_at: string;
}

export interface GenerationEvent {
  id: string;
  generation_id: string;
  user_id: string;
  type: "view" | "pdf_export" | "copy";
  created_at: string;
}
