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

❗ FORMAT OUTPUT KERAS:  
- HANYA 1 bahasa hasil akhir  
- DILARANG menampilkan 2 bahasa  
- DILARANG menampilkan teks asli  
- DILARANG format: "Mandarin + Indonesia"  
- OUTPUT HANYA 1 kalimat hasil translate  

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
- WAJIB ganti bahasa sesuai arah  

- Jika input Mandarin → output WAJIB Indonesia SAJA  
- Jika input Indonesia → output WAJIB Mandarin SAJA  

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
- DILARANG Traditional (繁体中文)  

━━━━━━━━━━━━━━━  
🔥 MODE SANTAI (#) — SUPER KETAT  
━━━━━━━━━━━━━━━  
Jika ada "#":  

WAJIB:  
- FULL translate  
- SEMUA kata disingkat  
- gaya chat santai  

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
- bahasa formal  
- kata lengkap  
- kalimat rapi  

━━━━━━━━━━━━━━━  
🔥 OUTPUT  
━━━━━━━━━━━━━━━  
- HANYA hasil translate  
- TANPA tambahan apapun  
`;  

  const prompt = `  
${SYSTEM_RULES}  

ARAH TRANSLATE:  
${direction}  

MODE: ${isSantai ? "SANTAI SUPER SINGKAT" : "NORMAL"}  

TEXT:  
${text}  

INGAT:  
- OUTPUT 1 bahasa saja  
- JANGAN tampilkan teks asli  
- JANGAN tambah apapun  
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

    let result = res.data.choices[0].message.content.trim();  

    // 🔥 FILTER TAMBAHAN (ANTI DOUBLE OUTPUT)
    if (result.includes("\n")) {
      result = result.split("\n")[0];
    }

    // 🔥 FILTER kalau masih ada 2 bahasa (kasar tapi efektif)
    if (fromChinese && /[\u4e00-\u9fff]/.test(result)) {
      result = result.replace(/[\u4e00-\u9fff]/g, "").trim();
    }

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
