const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  let text = msg.text;

  if (!text) return;

  const isSantai = text.includes("#");
  text = text.replace("#", "").trim();

  const SYSTEM_RULES = `
Kamu adalah translator Mandarin ↔ Indonesia.

TUGAS:
HANYA menerjemahkan.

ATURAN:
- WAJIB translate sesuai bahasa asal
- Tidak boleh tambah / kurang isi

MODE NORMAL:
- Terjemahan natural biasa

MODE SANTAI (#):
WAJIB SUPER SINGKAT + CHAT BANGET:
- saya → sy
- kamu → kmu
- sedang → lg
- sudah → udh
- baru → br
- tidak → ga
- bisa → bs
- saja → aja
- dengan → dgn
- karena → krn
- atau → ato
- yang → yg
- untuk → utk
- seperti → kyk
- kayaknya → kykny
- paling → pling
- itu → tu
- harus → hrs
- mungkin → mgkn

ATURAN TAMBAHAN:
- WAJIB potong kata selama makna sama
- WAJIB sesingkat mungkin
- JANGAN formal
- Harus kayak chat orang Indo asli

CONTOH:
你好=halo
谢谢=makasih
`;

  const prompt = `
${SYSTEM_RULES}

MODE: ${isSantai ? "SUPER SINGKAT" : "NORMAL"}

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
        temperature: 0.1
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let result = res.data.choices[0].message.content;

    bot.sendMessage(chatId, result);

  } catch (err) {
    console.log(err.response?.data || err.message);
    bot.sendMessage(chatId, "Error");
  }
});
