import jwt from 'jsonwebtoken';
import User from '../modules/users/user.model.js';

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.[process.env.COOKIE_NAME];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح، يرجى تسجيل الدخول'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // 🔥 التحقق من حالة الحساب
    if (!user.isActive) {
      res.clearCookie(process.env.COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
      });
      return res.status(403).json({
        success: false,
        message: 'تم تعليق هذا الحساب، يرجى التواصل مع الدعم.'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'جلسة غير صالحة'
    });
  }
};
