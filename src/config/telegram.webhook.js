import axios from "axios";
import notificationModel from "../modules/notification/notification.model.js";
import Order from "../modules/order/order.model.js";
import User from "../modules/users/user.model.js";
import Controllers from "../modules/contorlles/contorlles.model.js";

export const telegramWebhook = async (req, res) => {
    let chatId = null;

    try {
        const body = req.body;
        if (!body.message) return res.sendStatus(200);

        chatId = body.message.chat.id;
        const text = body.message.text?.trim().toUpperCase();

        const settings = await notificationModel.findOne();

        const controller = await Controllers.findOne()

        // If no settings or bot token → ignore
        if (!settings || !process.env.BOT_TOKEN) {
            return res.sendStatus(200);
        }



        const TELEGRAM_API = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

        /* ================= Helpers ================= */

        const sendMessage = async (text, options = {}) => {
            return axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: chatId,
                text,
                ...options,
            });
        };

        const editMessage = async (messageId, text, options = {}) => {
            return axios.post(`${TELEGRAM_API}/editMessageText`, {
                chat_id: chatId,
                message_id: messageId,
                text,
                ...options,
            });
        };

        /* ================= GET ID ================= */

        if (text === "GET_ID") {
            await sendMessage(
                `✅ <b>Your Chat ID:</b>\n\n<code>${chatId}</code>`,
                { parse_mode: "HTML" }
            );
            return res.sendStatus(200);
        }

        // If user is NOT admin
        if (String(chatId) !== String(settings.adminChatId)) {

            // If command is NOT GET_ID → tell them to pay
            await sendMessage(
                "🚫 You should pay to use this bot.\n\nUse GET_ID to get your Chat ID."
            );

            return res.sendStatus(200);
        }

        // If telegram bot feature is disabled
        if (!controller?.telegramBot) {
            await axios.post(
                `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
                {
                    chat_id: chatId,
                    text: "🚫 You should pay to use this bot.",
                }
            );

            return res.sendStatus(200);
        }

        /* ================= Full Dashboard ================= */

        if (text === "STATS") {

            const loadingMsg = await sendMessage("⏳ جاري تحميل الإحصائيات...");
            const messageId = loadingMsg.data.result.message_id;

            const usersCount = await User.countDocuments();

            const [
                totalOrders,
                pendingOrders,
                confirmedOrders,
                shippedOrders,
                deliveredOrders,
                cancelledOrders
            ] = await Promise.all([
                Order.countDocuments(),
                Order.countDocuments({ status: "pending" }),
                Order.countDocuments({ status: "confirmed" }),
                Order.countDocuments({ status: "shipped" }),
                Order.countDocuments({ status: "delivered" }),
                Order.countDocuments({ status: "cancelled" })
            ]);

            const revenueAgg = await Order.aggregate([
                { $match: { status: "delivered" } },
                { $group: { _id: null, total: { $sum: "$totalPrice" } } }
            ]);

            const totalRevenue = revenueAgg[0]?.total || 0;

            await editMessage(messageId, `
📊 <b>إحصائيات المتجر (كاملة)</b>
━━━━━━━━━━━━━━━━
👥 المستخدمين: <code>${usersCount}</code>
━━━━━━━━━━━━━━━━
🛒 الطلبات:
📦 الإجمالي: <code>${totalOrders}</code>
⏳ انتظار: <code>${pendingOrders}</code>
✅ مؤكدة: <code>${confirmedOrders}</code>
🚚 شحن: <code>${shippedOrders}</code>
🎉 مكتمل: <code>${deliveredOrders}</code>
❌ ملغي: <code>${cancelledOrders}</code>
━━━━━━━━━━━━━━━━
💰 الأرباح: <code>${totalRevenue.toLocaleString()}</code>
`, { parse_mode: "HTML" });

            return res.sendStatus(200);
        }

        /* ================= Dynamic Period Stats ================= */

        const statsRegex = /^STATS_(DAY|WEEK|MONTH)_(\d+)$/;
        const match = text.match(statsRegex);

        if (match) {

            const loadingMsg = await sendMessage("⏳ جاري تحميل الإحصائيات...");
            const messageId = loadingMsg.data.result.message_id;

            const timeType = match[1];
            const amount = parseInt(match[2]);

            let startDate = new Date();

            if (timeType === "DAY") {
                startDate.setDate(startDate.getDate() - amount);
            }

            if (timeType === "WEEK") {
                startDate.setDate(startDate.getDate() - (amount * 7));
            }

            if (timeType === "MONTH") {
                startDate.setMonth(startDate.getMonth() - amount);
            }

            const totalOrders = await Order.countDocuments({
                createdAt: { $gte: startDate }
            });

            const deliveredOrders = await Order.countDocuments({
                status: "delivered",
                createdAt: { $gte: startDate }
            });

            const revenueAgg = await Order.aggregate([
                {
                    $match: {
                        status: "delivered",
                        createdAt: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$totalPrice" }
                    }
                }
            ]);

            const totalRevenue = revenueAgg[0]?.total || 0;

            await editMessage(messageId, `
📊 <b>إحصائيات آخر ${amount} ${timeType}</b>
━━━━━━━━━━━━━━━━
🛒 الطلبات: <code>${totalOrders}</code>
🎉 المكتملة: <code>${deliveredOrders}</code>
━━━━━━━━━━━━━━━━
💰 الأرباح: <code>${totalRevenue.toLocaleString()}</code>
━━━━━━━━━━━━━━━━
📅 من: ${startDate.toLocaleDateString()}
📅 إلى: اليوم
`, { parse_mode: "HTML" });

            return res.sendStatus(200);
        }

        /* ================= TAGS ================= */

        if (text === "TAGS") {
            await sendMessage(`
        📚 <b>قائمة أوامر البوت</b>
        
        ━━━━━━━━━━━━━━━━
        📊 <b>الإحصائيات العامة</b>
        
        <code>STATS</code>
        عرض جميع إحصائيات المتجر
        
        <code>STATS_DAY_3</code>
        آخر 3 أيام
        
        <code>STATS_WEEK_2</code>
        آخر أسبوعين
        
        <code>STATS_MONTH_1</code>
        آخر شهر
        
        ━━━━━━━━━━━━━━━━
        📦 <b>الطلبات المعلقة</b>
        
        <code>PND_ORD</code>
        عرض كل الطلبات المعلقة
        
        <code>PND_ORD_DAY_3</code>
        آخر 3 أيام (Pending)
        
        <code>PND_ORD_WEEK_1</code>
        آخر أسبوع
        
        <code>PND_ORD_MONTH_2</code>
        آخر شهرين
        
        ━━━━━━━━━━━━━━━━
        🆔 <b>أدوات</b>
        
        <code>GET_ID</code>
        الحصول على Chat ID
        
        <code>TAGS</code>
        عرض جميع الأوامر
        
        ━━━━━━━━━━━━━━━━
        🛠 Telegram Admin Panel
        `,
                { parse_mode: "HTML" }
            );

            return res.sendStatus(200);
        }



        /* ================= Pending Orders ================= */

        if (text === "PND_ORD") {

            const loadingMsg = await sendMessage("⏳ جاري تحميل الطلبات المعلقة...");
            const messageId = loadingMsg.data.result.message_id;

            const pendingOrders = await Order.find({ status: "pending" })
                .sort({ createdAt: -1 })
                .limit(20);

            const totalPending = await Order.countDocuments({ status: "pending" });

            await editMessage(messageId, `
📦 <b>الطلبات المعلقة (الكل)</b>

📊 العدد الإجمالي: <code>${totalPending}</code>

━━━━━━━━━━━━━━━━
`,
                { parse_mode: "HTML" }
            );

            return res.sendStatus(200);
        }

        /* ===== Dynamic Pending Period ===== */

        const pendingRegex = /^PND_ORD_(DAY|WEEK|MONTH)_(\d+)$/;
        const pendingMatch = text.match(pendingRegex);

        if (pendingMatch) {

            const loadingMsg = await sendMessage("⏳ جاري تحميل الطلبات المعلقة...");
            const messageId = loadingMsg.data.result.message_id;

            const timeType = pendingMatch[1];
            const amount = parseInt(pendingMatch[2]);

            let startDate = new Date();

            if (timeType === "DAY") {
                startDate.setDate(startDate.getDate() - amount);
            }

            if (timeType === "WEEK") {
                startDate.setDate(startDate.getDate() - (amount * 7));
            }

            if (timeType === "MONTH") {
                startDate.setMonth(startDate.getMonth() - amount);
            }

            const totalPending = await Order.countDocuments({
                status: "pending",
                createdAt: { $gte: startDate }
            });

            await editMessage(messageId, `
📦 <b>الطلبات المعلقة</b>

📊 العدد: <code>${totalPending}</code>

━━━━━━━━━━━━━━━━
📅 من: ${startDate.toLocaleDateString()}
📅 إلى: اليوم
`,
                { parse_mode: "HTML" }
            );

            return res.sendStatus(200);
        }
        /* ================= UNKNOWN ================= */

        await sendMessage(`
❓ <b>أمر غير معروف</b>

استخدم <code>TAGS</code> لرؤية جميع الأوامر.
`, { parse_mode: "HTML" });

        return res.sendStatus(200);

    } catch (error) {

        console.error("Telegram Webhook Error:", error);

        try {
            if (chatId && process.env.BOT_TOKEN) {

                const TELEGRAM_API = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

                await axios.post(`${TELEGRAM_API}/sendMessage`, {
                    chat_id: chatId,
                    parse_mode: "HTML",
                    text: `
❌ <b>حدث خطأ أثناء تنفيذ الأمر</b>

⚠️ <b>السبب:</b>
<code>${error.message}</code>
`
                });
            }
        } catch (innerError) {
            console.error("Failed to send error message:", innerError);
        }

        return res.sendStatus(200);
    }
};