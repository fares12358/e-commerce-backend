import User from './user.model.js';
import Order from '../order/order.model.js';
import sendEmail from '../../utils/sendEmail.js';

/* ================= GET MY PROFILE ================= */
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('orders');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'تم جلب بيانات المستخدم',
      data: user
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب البيانات'
    });
  }
};

/* ================= UPDATE MY PROFILE ================= */

export const updateMyProfile = async (req, res) => {
  try {
    const fields = ['name', 'phone', 'address'];

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'تم تحديث البيانات بنجاح',
      data: user
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث البيانات'
    });
  }
};



/* ================= ADMIN: GET USERS WITH STATS + FILTER ================= */

export const getAllUsers = async (req, res) => {
  try {
    const { email, isActive, sort = "desc", page = 1, limit = 12 } = req.query;

    const userQuery = {};

    if (email) {
      userQuery.email = { $regex: email, $options: "i" };
    }

    if (isActive !== undefined) {
      userQuery.isActive = isActive === "true";
    }

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);

    const totalUsers = await User.countDocuments(userQuery);

    const users = await User.find(userQuery)
      .sort({ createdAt: sort === "asc" ? 1 : -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const userIds = users.map(u => u._id);

    // 📊 Aggregate orders per user
    const orderStats = await Order.aggregate([
      { $match: { userId: { $in: userIds } } },
      {
        $group: {
          _id: { userId: "$userId", status: "$status" },
          count: { $sum: 1 }
        }
      }
    ]);

    // reshape stats
    const statsMap = {};

    orderStats.forEach(({ _id, count }) => {
      const uid = _id.userId.toString();
      const status = _id.status;

      if (!statsMap[uid]) {
        statsMap[uid] = {
          total: 0,
          pending: 0,
          confirmed: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0,
        };
      }

      statsMap[uid][status] = count;
      statsMap[uid].total += count;
    });

    // attach stats to users
    const formatted = users.map(u => ({
      ...u,
      orderStats: statsMap[u._id.toString()] || {
        total: 0,
        pending: 0,
        confirmed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      }
    }));

    return res.json({
      success: true,
      data: {
        users: formatted,
        pagination: {
          total: totalUsers,
          page: pageNumber,
          totalPages: Math.ceil(totalUsers / pageSize),
          limit: pageSize
        }
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to load users"
    });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 8 } = req.query;
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);

    const user = await User.findById(id)
      .select('-password -resetPasswordToken -resetPasswordExpire');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    // 🔥 Get total orders count
    const totalOrders = await Order.countDocuments({ userId: id });

    // 🔥 Get paginated orders
    const orders = await Order.find({ userId: id })
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .populate('items.productId', 'name images price');

    // 🔥 Aggregate stats (efficient)
    const statsAgg = await Order.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      total: orders.length,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };

    statsAgg.forEach(s => {
      stats[s._id] = s.count;
    });

    return res.status(200).json({
      success: true,
      data: {
        user,
        orders,
        stats,
        pagination: {
          total: totalOrders,
          page: pageNumber,
          totalPages: Math.ceil(totalOrders / pageSize),
          limit: pageSize
        }
      }
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Failed to load user details'
    });
  }
};

/* ================= ADMIN: TOGGLE USER STATUS ================= */
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    // ✅ Send Email Notification
    if (user.email) {
      if (!user.isActive) {
        // Account Blocked
        await sendEmail({
          to: user.email,
          subject: "تم إيقاف حسابك مؤقتاً",
          html: `
            <div style="font-family: Arial; direction: rtl; text-align: right; line-height:1.8;">
              <h3>مرحباً ${user.name}</h3>
              <p>
                نأسف لإبلاغك أنه تم إيقاف حسابك مؤقتاً من قبل إدارة الموقع.
              </p>
              <p>
                إذا كنت تعتقد أن هذا الإجراء تم بالخطأ، يرجى التواصل مع فريق الدعم.
              </p>
              <br/>
              <p>فريق المتجر</p>
            </div>
          `
        });
      } else {
        // Account Reactivated
        await sendEmail({
          to: user.email,
          subject: "تم إعادة تفعيل حسابك",
          html: `
            <div style="font-family: Arial; direction: rtl; text-align: right; line-height:1.8;">
              <h3>مرحباً ${user.name}</h3>
              <p>
                يسعدنا إبلاغك بأنه تم إعادة تفعيل حسابك بنجاح 🎉
              </p>
              <p>
                يمكنك الآن تسجيل الدخول واستخدام خدمات الموقع بشكل طبيعي.
              </p>
              <br/>
              <p>نتمنى لك تجربة تسوق ممتعة ❤️</p>
              <p>فريق المتجر</p>
            </div>
          `
        });
      }
    }


    return res.status(200).json({
      success: true,
      message: 'تم تحديث حالة المستخدم',
      data: {
        id: user._id,
        isActive: user.isActive
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الحالة'
    });
  }
};

/* ================= admin: delete use account ================= */

export const deleteuserAccount = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "المستخدم غير موجود."
      });
    }

    // 1️⃣ التحقق من وجود طلبات نشطة
    const activeOrder = await Order.findOne({
      userId,
      status: { $in: ["pending", "confirmed", "shipped"] }
    });

    if (activeOrder) {
      return res.status(400).json({
        success: false,
        message:
          "لا يمكن حذف الحساب لوجود طلبات قيد التنفيذ. يرجى إنهاء الطلبات أولاً."
      });
    }

    // 2️⃣ حذف الحساب
    await User.findByIdAndDelete(userId);

    // 3️⃣ إرسال الإيميل بدون كسر العملية
    sendEmail({
      to: user.email,
      subject: "تم حذف حسابك",
      html: `
        <h3>مرحباً ${user.name}</h3>

        <p>
          نود إعلامك بأنه تم حذف حسابك من منصتنا بنجاح.
        </p>

        <p>
          إذا لم تكن أنت من قام بهذا الإجراء أو لديك أي استفسار،
          يرجى التواصل مع فريق الدعم فوراً.
        </p>

        <br/>
        <p>نشكر ثقتك بنا ونتمنى لك كل التوفيق 🙏</p>
      `,
    }).catch(err => {
      console.error("Email sending failed:", err);
    });

    return res.status(200).json({
      success: true,
      message: "تم حذف الحساب بنجاح."
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message:
        "حدث خطأ أثناء محاولة حذف الحساب. يرجى المحاولة مرة أخرى."
    });
  }
};