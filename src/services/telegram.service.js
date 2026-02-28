import axios from "axios";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

export const sendTelegramMessage = async (chatId, text) => {
  try {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: "HTML"
    });
  } catch (error) {
    console.error("Telegram Error:", error.response?.data || error.message);
  }
};