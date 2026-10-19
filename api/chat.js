const SYSTEM_INSTRUCTIONS =
  "Kamu adalah MySchool AI Tutor, asisten belajar yang ramah dan sabar untuk siswa sekolah. " +
  "Jawab dalam Bahasa Indonesia kecuali diminta bahasa lain. Jelaskan konsep dengan sederhana " +
  "dan bertahap, berikan contoh jika membantu, serta tuntun siswa memahami proses. Untuk soal " +
  "hitungan, tunjukkan langkah yang relevan. Jika tidak yakin, katakan dengan jujur.";

async function readRequestBody(req) {
  // Vercel biasanya sudah mem-parse JSON ke req.body. Penanganan tambahan ini
  // membuat endpoint tetap kompatibel jika body datang sebagai string/Buffer.
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  const raw = req.body;
  if (typeof raw === "string" || Buffer.isBuffer(raw)) {
    const text = Buffer.isBuffer(raw) ? raw.toString("utf8") : raw;
    if (!text.trim()) return {};
    try { return JSON.parse(text); } catch (_) { return {}; }
  }

  // Fallback untuk runtime yang belum menyediakan req.body.
  let text = "";
  for await (const chunk of req) text += chunk;
  if (!text.trim()) return {};
  try { return JSON.parse(text); } catch (_) { return {}; }
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Metode tidak diizinkan." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Backend belum dikonfigurasi. Tambahkan OPENAI_API_KEY di Vercel lalu redeploy."
    });
  }

  try {
    const body = await readRequestBody(req);
    // Format utama frontend: { messages: [{ role, content }, ...] }.
    // Format message/prompt juga diterima untuk kompatibilitas dengan versi lama.
    let incomingMessages = body.messages;
    if (!Array.isArray(incomingMessages)) {
      const singleMessage = typeof body.message === "string" ? body.message
        : (typeof body.prompt === "string" ? body.prompt : "");
      incomingMessages = singleMessage.trim()
        ? [{ role: "user", content: singleMessage }]
        : [];
    }
    if (incomingMessages.length === 0) {
      return res.status(400).json({ error: "Pesan kosong diterima server. Muat ulang halaman dan coba lagi." });
    }

    // Limit payload and accept only ordinary text messages.
    const messages = incomingMessages.slice(-16).map((m) => {
      if (!m || !["user", "assistant"].includes(m.role) || typeof m.content !== "string") {
        throw new Error("Format pesan tidak valid.");
      }
      const content = m.content.trim();
      if (!content || content.length > 5000) {
        throw new Error("Pesan harus berisi 1–5000 karakter.");
      }
      return { role: m.role, content };
    });

    if (messages[messages.length - 1].role !== "user") {
      return res.status(400).json({ error: "Pesan terakhir harus berasal dari pengguna." });
    }

    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        instructions: SYSTEM_INSTRUCTIONS,
        input: messages,
        max_output_tokens: 900,
        store: false
      })
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      // Avoid returning provider internals or the secret to the browser.
      console.error("OpenAI API request failed:", upstream.status, data?.error?.type || "");
      if (upstream.status === 401) {
        return res.status(502).json({ error: "API key OpenAI tidak valid. Periksa OPENAI_API_KEY di Vercel." });
      }
      if (upstream.status === 429) {
        return res.status(502).json({ error: "Batas penggunaan atau saldo API tercapai. Periksa pengaturan penggunaan OpenAI API." });
      }
      return res.status(502).json({ error: "Layanan AI sedang gagal memproses permintaan. Coba lagi nanti." });
    }

    const answer = typeof data.output_text === "string"
      ? data.output_text.trim()
      : (data.output || [])
          .flatMap((item) => item.content || [])
          .filter((part) => part.type === "output_text" && typeof part.text === "string")
          .map((part) => part.text)
          .join("\n")
          .trim();

    if (!answer) {
      return res.status(502).json({ error: "AI tidak mengembalikan jawaban. Coba lagi." });
    }

    return res.status(200).json({ answer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "Format pesan tidak valid." || message.startsWith("Pesan harus")) {
      return res.status(400).json({ error: message });
    }
    console.error("Chat endpoint error:", message);
    return res.status(500).json({ error: "Terjadi kesalahan pada server Chat AI." });
  }
};
