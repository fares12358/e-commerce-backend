import rateLimit from "express-rate-limit";

/* ================= AUTH LIMIT ================= */

export const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 دقائق
    max: 10, // 10 محاولات فقط
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message:
            "تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة بعد 10 دقائق."
    },
});

/* ================= USERS LIMIT ================= */

export const usersLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 150, // 150 طلب
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message:
            "تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً بعد 15 دقيقة"
    },
});