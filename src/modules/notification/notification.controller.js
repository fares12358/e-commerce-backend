import Notification from "./notification.model.js";
import axios from "axios";
import dotenv from 'dotenv';
dotenv.config();

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
            SmtpServer,
            email,
            appPassword,
            host,
            port,
            secure,
        } = req.body;

        let settings = await Notification.findOne();

        if (!settings) {
            settings = await Notification.create({
                adminChatId,
                telegramEnabled,
                notifyOnNewOrder,
                notifySound,
                sectionNotify,
                SmtpServer,
                email,
                appPassword,
                host,
                port,
                secure,
            });
        } else {
            settings.adminChatId = adminChatId;
            settings.telegramEnabled = telegramEnabled;
            settings.notifyOnNewOrder = notifyOnNewOrder;
            settings.notifySound = notifySound;
            settings.sectionNotify = sectionNotify;

            settings.SmtpServer = SmtpServer;
            settings.email = email;
            settings.appPassword = appPassword;
            settings.host = host;
            settings.port = port;
            settings.secure = secure;

            await settings.save();
        }

        if (adminChatId) {
            const WEBHOOK_URL = `${process.env.BASE_URL}/admin/notification/telegram/webhook`;
            await axios.post(
                `https://api.telegram.org/bot${process.env.BOT_TOKEN}/setWebhook`,
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