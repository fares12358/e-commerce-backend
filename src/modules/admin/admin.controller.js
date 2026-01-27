import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Admin from './admin.model.js';
import sendEmail from '../../utils/sendEmail.js';

/* ================= UTIL: SEND ADMIN TOKEN ================= */
const sendAdminToken = (admin, res) => {
  const token = jwt.sign(
    { id: admin._id, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES }
  );

  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return res.status(200).json({
    success: true,
    message: 'تم تسجيل دخول الأدمن بنجاح',
    data: {
      id: admin._id,
      name: admin.name,
      email: admin.email
    }
  });
};

/* ================= ADMIN LOGIN ================= */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني وكلمة المرور مطلوبان'
      });
    }

    const admin = await Admin.findOne({ email, isActive: true });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'بيانات الأدمن غير صحيحة'
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'بيانات الأدمن غير صحيحة'
      });
    }

    return sendAdminToken(admin, res);

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تسجيل دخول الأدمن'
    });
  }
};

/* ================= ADMIN LOGOUT ================= */
export const adminLogout = async (req, res) => {
  try {
    res.clearCookie('admin_token');

    return res.status(200).json({
      success: true,
      message: 'تم تسجيل خروج الأدمن بنجاح'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تسجيل الخروج'
    });
  }
};

/* ================= ADMIN AUTO LOGIN (ME) ================= */
export const adminMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'تم جلب بيانات الأدمن بنجاح',
      data: {
        id: req.admin._id,
        name: req.admin.name,
        email: req.admin.email
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب بيانات الأدمن'
    });
  }
};

/* ================= ADMIN FORGOT PASSWORD ================= */
export const adminForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مطلوب'
      });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'لا يوجد أدمن بهذا البريد الإلكتروني'
      });
    }

    const resetToken = admin.getResetToken();
    await admin.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password/${resetToken}`;

    await sendEmail({
      to: admin.email,
      subject: 'إعادة تعيين كلمة مرور الأدمن',
      html: `
        <h3>إعادة تعيين كلمة المرور</h3>
        <p>اضغط على الرابط التالي:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>الرابط صالح لمدة 15 دقيقة</p>
      `
    });

    return res.status(200).json({
      success: true,
      message: 'تم إرسال رابط إعادة تعيين كلمة المرور'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إرسال رابط إعادة التعيين'
    });
  }
};

/* ================= ADMIN RESET PASSWORD ================= */
export const adminResetPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const admin = await Admin.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: 'الرابط غير صالح أو منتهي الصلاحية'
      });
    }

    admin.password = await bcrypt.hash(req.body.password, 10);
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpire = undefined;

    await admin.save();

    return sendAdminToken(admin, res);

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إعادة تعيين كلمة المرور'
    });
  }
};

/* ================= UPDATE ADMIN PROFILE ================= */
export const updateAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'الأدمن غير موجود'
      });
    }

    admin.name = req.body.name || admin.name;
    admin.email = req.body.email || admin.email;

    if (req.body.password) {
      admin.password = await bcrypt.hash(req.body.password, 10);
    }

    await admin.save();

    return res.status(200).json({
      success: true,
      message: 'تم تحديث بيانات الأدمن بنجاح',
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث بيانات الأدمن'
    });
  }
};

/* ================= ADMIN DASHBOARD ================= */
export const adminDashboard = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'مرحباً بك في لوحة تحكم الأدمن',
      data: {
        adminName: req.admin.name
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحميل لوحة التحكم'
    });
  }
};
