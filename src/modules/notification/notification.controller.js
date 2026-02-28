import Notification from "./notification.model.js";
import axios from "axios";

// GET settings
export const getNotificationSettings = async (req, res) => {
    try {
        let settings = await Notification.findOne();

        if (!settings) {
            settings = await Notification.create({
                adminChatId: "",
            });
        }

        res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// UPDATE settings (Admin only)
export const updateNotificationSettings = async (req, res) => {
    try {
        const {
            adminChatId,
            telegramEnabled,
            notifyOnNewOrder,
            notifySound,
            sectionNotify,
        } = req.body;

        let settings = await Notification.findOne();

        if (!settings) {
            settings = await Notification.create({
                adminChatId,
                telegramEnabled,
                notifyOnNewOrder,
                notifySound,
                sectionNotify,
            });
        } else {
            settings.adminChatId = adminChatId;
            settings.telegramEnabled = telegramEnabled;
            settings.notifyOnNewOrder = notifyOnNewOrder;
            settings.notifySound = notifySound;
            settings.sectionNotify = sectionNotify;
            await settings.save();
        }

        if (adminChatId) {
            const WEBHOOK_URL = `${'https://humilis-feyly-nelle.ngrok-free.dev'}/api/admin/notification/telegram/webhook`;

            await axios.post(
                `https://api.telegram.org/bot${process.env.BOT_TOKEN }/setWebhook`,
                { url: WEBHOOK_URL }
            );
        }

        res.status(200).json({
            success: true,
            message: "Notification settings updated successfully",
            data: settings,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};