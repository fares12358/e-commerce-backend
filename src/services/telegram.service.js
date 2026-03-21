import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

/* ─────────────────────────────────────────────────────────────
   sendTelegramMessage
   Sends a message through your internal bot proxy API.

   @param {string|number} chatId   - Telegram chat ID to send to
   @param {string}        text     - HTML-formatted message body
   @param {Array|null}    buttons  - Optional inline keyboard rows:
     [
       [{ text: "Label", callback_data: "COMMAND" }],
       [{ text: "A", callback_data: "CMD_A" }, { text: "B", callback_data: "CMD_B" }]
     ]
───────────────────────────────────────────────────────────── */
export const sendTelegramMessage = async (chatId, text, buttons = null) => {
  try {

    const payload = {
      chatId,
      message: text,
    };

    if (buttons?.length) {
      payload.reply_markup = { inline_keyboard: buttons };
    }

    await axios.post(`${process.env.BOT_API}/telegram/send`, payload);

  } catch (error) {
    
    console.error("Telegram Error:", error.response?.data || error.message);
  }
};