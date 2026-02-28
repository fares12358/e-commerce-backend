import axios from "axios";
import notificationModel from "../modules/notification/notification.model.js";

export const telegramWebhook = async (req, res) => {
    try {
        const body = req.body;
        console.log('bot-msg',req.body.message);

        if (!body.message) return res.sendStatus(200);

        const chatId = body.message.chat.id;
        const text = body.message.text;

        if (text === "getid") {
            const settings = await notificationModel.findOne();

            if (!settings || !process.env.BOT_TOKEN ) {
                return res.sendStatus(200);
            }

            const TELEGRAM_API = `https://api.telegram.org/bot${process.env.BOT_TOKEN }`;

            await axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: chatId,
                text: `✅ Your Chat ID:\n\n${chatId}\n\nCopy this and paste it into the admin dashboard.`,
            });
        }

        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.sendStatus(200);
    }
};