export type DeveloperErrorAlert = {
  stage: string;
  provider: string;
  message: string;
  recovered: boolean;
};

export type GenerationNotification = {
  nama: string;
  nis: string;
  kelas: string;
  laboratorium: string;
  judulAnalisis: string;
  kedalamanTeori: string;
  status: "BERHASIL" | "GAGAL";
  model: string;
  errorLog?: string;
};

function escapeTelegramHtml(value: string) {
  return value.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char]!);
}

export async function sendDeveloperErrorAlert(data: DeveloperErrorAlert) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const status = data.recovered ? "TERTANGANI" : "GAGAL";
  const text = [
    "⚠️ <b>Error Pipeline Landasan Teori</b>",
    "",
    `<b>Status:</b> ${status}`,
    `<b>Tahap:</b> ${escapeTelegramHtml(data.stage)}`,
    `<b>Provider:</b> ${escapeTelegramHtml(data.provider)}`,
    `<b>Penyebab:</b> <code>${escapeTelegramHtml(data.message.slice(0, 2500))}</code>`,
  ].join("\n");

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    if (!response.ok) console.error("Telegram developer alert failed:", await response.text());
  } catch (error) {
    console.error("Telegram developer alert exception:", error);
  }
}

export async function sendGenerationNotification(data: GenerationNotification) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const statusIcon = data.status === "BERHASIL" ? "✅" : "❌";
  const lines = [
    `${statusIcon} <b>Generate Landasan Teori</b>`,
    "",
    `<b>Status:</b> ${data.status}`,
    `<b>Model:</b> <code>${escapeTelegramHtml(data.model)}</code>`,
    "",
    "<b>Data pengguna</b>",
    `<b>Nama:</b> ${escapeTelegramHtml(data.nama)}`,
    `<b>Kelas:</b> ${escapeTelegramHtml(data.kelas)}`,
    `<b>NIS/NIP:</b> ${escapeTelegramHtml(data.nis)}`,
    `<b>Lab:</b> ${escapeTelegramHtml(data.laboratorium)}`,
    "",
    "<b>Permintaan</b>",
    `<b>Judul:</b> ${escapeTelegramHtml(data.judulAnalisis)}`,
    `<b>Kedalaman:</b> ${escapeTelegramHtml(data.kedalamanTeori)}`,
  ];

  if (data.errorLog) {
    lines.push("", `<b>Log error:</b>\n<pre>${escapeTelegramHtml(data.errorLog.slice(0, 3000))}</pre>`);
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join("\n"),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      console.error("Telegram generation notification failed:", await response.text());
    }
  } catch (error) {
    console.error("Telegram generation notification exception:", error);
  }
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
