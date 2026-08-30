import { NextResponse } from "next/server";
import { z } from "zod";

const feedbackSchema = z.object({
  type: z.enum(["bug", "saran"]),
  message: z.string().trim().min(3).max(1500),
  page: z.string().trim().max(200).regex(/^\//),
});

function escapeTelegramHtml(value: string) {
  return value.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char]!);
}

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json({ message: "Layanan feedback belum dikonfigurasi." }, { status: 503 });
  }

  try {
    const parsed = feedbackSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ message: "Pesan tidak valid. Tulis minimal 3 karakter." }, { status: 400 });
    }

    const { type, message, page } = parsed.data;
    const text = [
      "<b>Feedback Landasan Teori</b>",
      "",
      `<b>Tipe:</b> ${type === "bug" ? "Laporan Bug" : "Kritik & Saran"}`,
      `<b>Halaman:</b> <code>${escapeTelegramHtml(page)}</code>`,
      "",
      `<b>Pesan:</b>\n${escapeTelegramHtml(message)}`,
    ].join("\n");

    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });

    if (!telegramResponse.ok) {
      console.error("Telegram feedback delivery failed:", await telegramResponse.text());
      return NextResponse.json({ message: "Pesan tidak dapat dikirim. Coba lagi." }, { status: 502 });
    }

    return NextResponse.json({ message: "Pesan terkirim." });
  } catch (error) {
    console.error("Feedback request failed:", error);
    return NextResponse.json({ message: "Terjadi gangguan pada server. Coba lagi." }, { status: 500 });
  }
}
