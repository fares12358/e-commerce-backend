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

/* ================= ADMIN: GET ALL USERS ================= */
/* ================= ADMIN: GET USERS WITH STATS + FILTER ================= */

export const getAllUsers = async (req, res) => {
  try {
    const { email, isActive, sort } = req.query;

    const userQuery = {};

    if (email) {
      userQuery.email = { $regex: email, $options: "i" };
    }

    if (isActive !== undefined) {
      userQuery.isActive = isActive === "true";
    }

    const users = await User.find(userQuery)
      .sort({ createdAt: sort === "asc" ? 1 : -1 })
      .lean(); // important for performance

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
      data: formatted
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

    const user = await User.findById(id)
      .select('-password -resetPasswordToken -resetPasswordExpire');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const orders = await Order.find({ userId: id })
      .sort({ createdAt: -1 })
      .populate('items.productId', 'name images price');

    const stats = {
      total: orders.length,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };

    orders.forEach(o => {
      stats[o.status]++;
    });

    return res.status(200).json({
      success: true,
      message: 'User details loaded',
      data: {
        user,
        orders,
        stats
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
