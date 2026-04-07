const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  let text = msg.text;

  if (!text) return;

  // cek mode santai (#)
  const isSantai = text.includes("#");
  text = text.replace("#", "").trim();

  const SYSTEM_RULES = `
Kamu adalah translator Mandarin ↔ Indonesia.

TUGAS:
HANYA menerjemahkan.

ATURAN:
- WAJIB translate sesuai bahasa asal:
  Mandarin → Indonesia
  Indonesia → Mandarin
- Tidak boleh menjawab
- Tidak boleh menambah/mengurangi isi

ATURAN TAMBAHAN:
- 三四五 → 3 4 5
- 您=Anda, 你=kamu, 我=saya (jika berdiri sendiri)
- Gunakan arti natural, bukan kata per kata
- Jaga tanda baca

MODE SANTAI (#):
Jika ada "#" di teks:
WAJIB:
- Pakai bahasa chat sehari-hari
- WAJIB disingkat:
  saya → sy
  kamu → kmu
  sedang → lg
  sudah → udh
  belum → blm
  tidak → ga
  bisa → bs
  saja → aja
  dengan → dgn
  karena → krn
  atau → ato
  yang → yg
  untuk → utk
- Jangan pakai bahasa baku
- Jangan formal
- Harus terasa seperti chat orang biasa

ISTILAH:
新人=anggota baru
链接=link
签到=check in
分享=sharing
海洋财富计划=Rencana Kekayaan Samudra
tangkapan layar=screenshot

CONTOH:
你好=halo
谢谢=terima kasih
再见=sampai jumpa
`;

  const prompt = `
${SYSTEM_RULES}

MODE: ${isSantai ? "SANTAI WAJIB SINGKAT & GAUL" : "NORMAL"}

TEXT:
${text}
`;

  try {
    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "qwen/qwen-turbo",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const result = res.data.choices[0].message.content;

    bot.sendMessage(chatId, result);

  } catch (err) {
    console.log(err.response?.data || err.message);
    bot.sendMessage(chatId, "Error");
  }
});
