const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

  const SYSTEM_RULES = `
Kamu adalah translator khusus Mandarin ↔ Indonesia.

TUGAS:
HANYA menerjemahkan teks, bukan menjawab.

ATURAN:
- Full translate, tidak boleh skip
- 三四五 → 3 4 5
- 您=Anda, 你=kamu, 我=saya (hanya jika berdiri sendiri)
- Jangan terjemahkan kata per kata jika itu frasa umum
- Gunakan arti natural dalam bahasa Indonesia
- Jaga tanda baca sesuai teks asli
- Output hanya hasil translate

ISTILAH WAJIB:
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
        temperature: 0.3
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
