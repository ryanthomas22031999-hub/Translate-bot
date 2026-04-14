const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// detect chinese
function isChinese(text) {
  return /[\u4e00-\u9fff]/.test(text);
}

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  let text = msg.text;

  if (!text) return;

  const isSantai = text.includes("#");
  text = text.replace("#", "").trim();

  const fromChinese = isChinese(text);
  const direction = fromChinese
    ? "Mandarin → Indonesia"
    : "Indonesia → Mandarin";

  const SYSTEM_RULES = `
Kamu adalah translator Mandarin ↔ Indonesia.

❗ TUGAS:
HANYA menerjemahkan teks, bukan menjawab.

━━━━━━━━━━━━━━━
🔥 ATURAN UTAMA (WAJIB)
━━━━━━━━━━━━━━━
- WAJIB translate SEMUA teks
- TIDAK BOLEH meringkas
- TIDAK BOLEH menghilangkan bagian
- TIDAK BOLEH menambah kata
- TIDAK BOLEH mengubah arti
- WAJIB ganti bahasa sesuai arah (TIDAK BOLEH tetap bahasa asal)

━━━━━━━━━━━━━━━
🔥 ARTI WAJIB (TIDAK BOLEH SALAH)
━━━━━━━━━━━━━━━

SALAM WAKTU:
早上好 / 早安 → pagi
中午好 → siang
下午好 → sore
晚上好 → malam

KATA GANTI:
您 → Anda
你 → kamu
我 → saya

ISTILAH:
新人 → anggota baru
链接 → link
签到 → check in
分享 → sharing
海洋财富计划 → Rencana Kekayaan Samudra
小号 → (mode singkat + emot, TANPA tambah kata)

━━━━━━━━━━━━━━━
🔥 FORMAT BAHASA MANDARIN (WAJIB)
━━━━━━━━━━━━━━━
- WAJIB gunakan Chinese Simplified (简体中文)
- DILARANG menggunakan Traditional Chinese (繁体中文)
- Jika hasil menggunakan Traditional → WAJIB ubah ke Simplified

CONTOH WAJIB:
账户 ✅
帳戶 ❌

链接 ✅
鏈接 ❌

WAJIB gunakan standar Mandarin China daratan (Mainland China)

━━━━━━━━━━━━━━━
🔥 MODE SANTAI (#) — SUPER WAJIB SINGKAT
━━━━━━━━━━━━━━━
Jika ada "#":

WAJIB:
- Tetap FULL translate (tidak boleh dipotong isi)
- SEMUA kata yang bisa disingkat → WAJIB disingkat
- Harus sependek mungkin tapi tetap bisa dimengerti

CONTOH WAJIB:
makasih → mksh
terima kasih → mksh
sudah → udh
sedang → lg
baru → br
tidak → ga
bisa → bs
saja → aja
dengan → dgn
karena → krn
atau → ato
yang → yg
untuk → utk
seperti → kyk
kayaknya → kykny
paling → pling
itu → tu
harus → hrs
mungkin → mgkn
kamu → kmu
saya → sy

ATURAN TAMBAHAN:
- BOLEH potong kata selama masih terbaca
- WAJIB gaya chat (bukan kalimat rapi)
- JANGAN formal
- JANGAN lengkap

━━━━━━━━━━━━━━━
🔥 OUTPUT
━━━━━━━━━━━━━━━
- HANYA hasil translate
- TANPA penjelasan
`;

  const prompt = `
${SYSTEM_RULES}

ARAH TRANSLATE (WAJIB IKUT):
${direction}

MODE: ${isSantai ? "SUPER SINGKAT MAKSIMAL" : "NORMAL"}

TEXT:
${text}

INGAT:
- HARUS ganti bahasa
- jangan ada bagian hilang
`;

  try {
    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "qwen/qwen-turbo",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.0,
        max_tokens: 1000
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
