const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

  try {
    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "qwen/qwen-turbo",
        messages: [
          {
            role: "user",
            content: `Translate Mandarin ↔ Indonesian only:\n${text}`
          }
        ]
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
