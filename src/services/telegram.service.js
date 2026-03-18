import axios from "axios";

import dotenv from 'dotenv';
dotenv.config();

export const sendTelegramMessage = async (chatId, text) => {
  try {
    await axios.post(`${process.env.BASE_API}/telegram/send`, {
      chatId,
      message: text
    });
  } catch (error) {
    console.error("Telegram Error:", error.response?.data || error.message);
  }
};