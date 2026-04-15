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
  
❗ TUGAS MUTLAK:  
HANYA menerjemahkan teks.  
  
❗ DILARANG KERAS:  
- Menambahkan kalimat pembuka  
- Menambahkan kalimat penutup  
- Memberi penjelasan  
- Mengubah format  
- Menjawab  
- Menambahkan 1 kata pun di luar hasil translate  
  
Jika melanggar → hasil SALAH.  
  
━━━━━━━━━━━━━━━  
🔥 ATURAN UTAMA (WAJIB)  
━━━━━━━━━━━━━━━  
- WAJIB translate SEMUA teks  
- TIDAK BOLEH meringkas  
- TIDAK BOLEH menghilangkan bagian  
- TIDAK BOLEH menambah kata  
- TIDAK BOLEH mengubah arti  
- WAJIB ganti bahasa sesuai arah (TIDAK BOLEH tetap bahasa asal)  
  
❌ CONTOH SALAH:  
"Saya akan menerjemahkan..."  
"Berikut hasil..."  
"Dalam bahasa Indonesia..."  
  
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
🔥 MODE SANTAI (#) — SUPER KETAT  
━━━━━━━━━━━━━━━  
Jika ada "#":  
  
WAJIB:  
- FULL translate  
- SEMUA kata disingkat  
- Gaya chat santai  
  
WAJIB BANGET:  
saya→sy  
kamu→kmu  
tidak→ga  
sudah→udh  
sedang→lg  
baru→br  
bisa→bs  
saja→aja  
yang→yg  
untuk→utk  
dengan→dgn  
karena→krn  
atau→ato  
kayaknya→kykny  
seperti→kyk  
paling→pling  
itu→tu  
harus→hrs  
mungkin→mgkn  
terima kasih / makasih → mksh  
  
❌ DILARANG:  
- Bahasa formal  
- Kata lengkap  
- Kalimat rapi  
  
━━━━━━━━━━━━━━━  
🔥 OUTPUT  
━━━━━━━━━━━━━━━  
- HANYA hasil translate  
- TANPA tambahan apapun  
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
- JANGAN TAMBAH APA PUN  
- JANGAN ADA EMBEL-EMBEL  
`;  
  
  try {  
    const res = await axios.post(  
      "https://openrouter.ai/api/v1/chat/completions",  
      {  
        model: "anthropic/claude-3-haiku",  
        messages: [  
          { role: "user", content: prompt }  
        ],  
        temperature: 0,  
        max_tokens: 1000  
      },  
      {  
        headers: {  
          Authorization: `Bearer ${OPENROUTER_KEY}`,  
          "Content-Type": "application/json"  
        }  
      }  
    );  
  
    const result = res.data.choices[0].message.content.trim();  
  
    bot.sendMessage(chatId, result);  
  
  } catch (err) {  
    const errorMsg =  
      err.response?.data?.error?.message ||  
      err.response?.data ||  
      err.message;  
  
    console.log(errorMsg);  
  
    if (  
      typeof errorMsg === "string" &&  
      errorMsg.toLowerCase().includes("insufficient")  
    ) {  
      bot.sendMessage(chatId, "Error: insufficient balance");  
    } else {  
      bot.sendMessage(chatId, "Error");  
    }  
  }  
});
