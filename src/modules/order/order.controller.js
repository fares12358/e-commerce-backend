import Order from './order.model.js';
import User from '../users/user.model.js';
import Cart from '../cart/cart.model.js';
import Product from '../product/product.model.js';
import mongoose from 'mongoose';
import Config from '../admin/config.model.js';
import sendEmail from '../../utils/sendEmail.js';

/* ================= CREATE ORDER (USER) ================= */
export const createOrder = async (req, res) => {
  try {
    const { locationId } = req.body;
    if (!locationId) {
      return res.status(400).json({
        success: false,
        message: 'العنوان مطلوب'
      });
    }
    const config = await Config.findOne();
    const user = await User.findById(req.user._id);
    const locationExists = user.locations.id(locationId);

    if (!locationExists) {
      return res.status(400).json({
        success: false,
        message: 'العنوان غير صالح'
      });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'السلة فارغة'
      });
    }

    const orderItems = [];
    let totalPrice = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.productId);

      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: 'أحد المنتجات غير متوفر'
        });
      }

      if (item.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: 'الكمية المطلوبة غير متاحة'
        });
      }

      product.stock -= item.quantity;
      await product.save();

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        attributes: product.attributes,
        selections: item.selections,
        quantity: item.quantity
      });

      totalPrice += product.price * item.quantity;
    }

    const order = await Order.create({
      orderNumber: `ORD-${Date.now()}`,
      userId: req.user._id,
      locationId,
      items: orderItems,
      shippingFee: config.shipment,
      totalPrice
    });

    await Cart.findByIdAndDelete(cart._id);

    return res.status(201).json({
      success: true,
      message: 'تم إنشاء الطلب بنجاح',
      data: order
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء الطلب'
    });
  }
};

/* ================= GET MY ORDERS (USER) ================= */

export const getMyOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 5,
      status,
      sort = "new",
      orderNumber
    } = req.query;

    const currentPage = parseInt(page);
    const pageLimit = parseInt(limit);

    // 🔹 Filter
    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    if (orderNumber) {

      // 🧹 تنظيف الإدخال
      let clean = orderNumber.trim();

      // إزالة #
      clean = clean.replace(/^#/, "");

      // إزالة ORD- أو ord-
      clean = clean.replace(/^ord-/i, "");

      // الآن نبحث بأي رقم يحتويه الطلب
      filter.orderNumber = {
        $regex: clean,
        $options: "i"
      };
    }

    // 🔹 Sort
    const sortOption =
      sort === "old"
        ? { createdAt: 1 }
        : { createdAt: -1 };

    // 🔹 Count
    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / pageLimit);

    // 🔹 Get Orders
    const orders = await Order.find(filter)
      .sort(sortOption)
      .skip((currentPage - 1) * pageLimit)
      .limit(pageLimit)
      .lean();

    // 🟢 جلب عناوين المستخدم مرة واحدة فقط
    const user = await User.findById(req.user._id)
      .select("locations")
      .lean();

    const locationsMap = {};
    user?.locations?.forEach(loc => {
      locationsMap[loc._id.toString()] = loc;
    });

    // 🟢 تركيب العنوان داخل كل طلب
    const ordersWithLocation = orders.map(order => ({
      ...order,
      location: locationsMap[order.locationId?.toString()] || null
    }));

    return res.status(200).json({
      success: true,
      message: "تم جلب الطلبات بنجاح",
      data: ordersWithLocation,
      pagination: {
        totalOrders,
        totalPages,
        currentPage,
        limit: pageLimit
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الطلبات"
    });
  }
};

/* ================= GET ORDERS by id (USER) ================= */

export const getOrdersById = async (req, res) => {
  try {
    const { id } = req.params;

    // 🛑 تحقق من صحة الـ id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "معرف الطلب غير صالح"
      });
    }

    // 🟢 ابحث عن الطلب للمستخدم الحالي فقط
    const order = await Order.findOne({
      _id: id,
      userId: req.user._id
    })
      .lean();


    if (!order) {
      return res.status(404).json({
        success: false,
        message: "الطلب غير موجود"
      });
    }

    // 🟢 جلب المستخدم
    const user = await User.findById(req.user._id)
      .select("locations")
      .lean();

    // 🟢 استخراج العنوان من داخل locations
    const location = user?.locations?.find(
      loc => loc._id.toString() === order.locationId.toString()
    );

    // 🟢 إضافة العنوان داخل الطلب
    order.location = location || null;

    return res.status(200).json({
      success: true,
      data: order
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الطلب"
    });
  }
};

/* ================= CANCEL ORDERS (USER) ================= */
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن إلغاء الطلب بعد تأكيده'
      });
    }

    // 🟢 إعادة المخزون
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: item.quantity } }
      );
    }
    // 🟢 تحديث الحالة بدل الحذف
    order.status = 'cancelled';
    order.cancelledAt = new Date();

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'تم إلغاء الطلب بنجاح'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إلغاء الطلب'
    });
  }
};

/* ================= invoice ORDERS (USER) ================= */
export const getInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "معرف الطلب غير صالح",
      });
    }

    const order = await Order.findOne({
      _id: id,
      userId: req.user._id,
    }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "الطلب غير موجود",
      });
    }

    const user = await User.findById(req.user._id)
      .select("email name locations")
      .lean();

    const location = user?.locations?.find(
      (loc) => loc._id.toString() === order.locationId.toString()
    );

    /* ================= ITEMS ================= */

    const itemsRows = order.items
      .map(
        (item) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>${Number(item.price).toFixed(2)} </td>
          <td>${(item.price * item.quantity).toFixed(2)} </td>
        </tr>
      `
      )
      .join("");

    /* ================= INVOICE HTML ================= */

    const html = `
    <div style="font-family:Arial;padding:20px" dir='rtl'>
      <h2>فاتورة الطلب #${order.orderNumber}</h2>

      <p><strong>العميل:</strong> ${user.name || ""}</p>
      <p><strong>العنوان:</strong> ${location?.country || ""} ${location?.city || ""} ${location?.government || ""} ${location?.strName || ""}</p>
      <p><strong>التاريخ:</strong> ${new Date(order.createdAt).toLocaleDateString("ar-EG")}</p>

      <table border="1" cellspacing="0" cellpadding="8" width="100%" style="border-collapse:collapse;margin-top:20px">
        <thead>
          <tr style="background:#f3f3f3">
            <th>المنتج</th>
            <th>الكمية</th>
            <th>السعر</th>
            <th>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div style="margin-top:20px">
        <p>رسوم الشحن: <strong>${order.shippingFee || "—"} </strong></p>
        <h3>الإجمالي النهائي: ${Number(order.totalPrice).toFixed(2)} </h3>
      </div>

      <p style="margin-top:30px">شكراً لطلبك </p>
    </div>
    `;

    await sendEmail({
      to: user.email,
      subject: `فاتورة طلب رقم ${order.orderNumber}`,
      html,
    });

    return res.status(200).json({
      success: true,
      message: "تم ارسال الفاتورة الى بريدك الالكتروني",
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء ارسال الفاتورة",
    });
  }
};


/* ================= GET ALL ORDERS (ADMIN) ================= */

export const getAllOrders = async (req, res) => {
  try {
    const {
      status,
      sort = 'desc',
      email,
      orderId,
      searchBy,
      page = 1,
      limit = 20,
      date
    } = req.query;

    const query = {};

    // 📦 Status filter
    if (status) query.status = status;

    // 📆 Date filter
    if (date) {
      const now = new Date();
      let fromDate;

      if (date === 'today') fromDate = new Date(now.setHours(0, 0, 0, 0));
      if (date === 'week') fromDate = new Date(Date.now() - 7 * 86400000);
      if (date === 'month') fromDate = new Date(Date.now() - 30 * 86400000);
      if (date === 'threeMonths') fromDate = new Date(Date.now() - 90 * 86400000);

      if (fromDate) query.createdAt = { $gte: fromDate };
    }

    // 📧 Search by email
    if (searchBy === 'email' && email) {
      const users = await User.find({
        email: { $regex: email, $options: 'i' }
      }).select('_id');

      query.userId = { $in: users.map(u => u._id) };
    }

    // 🔍 Search by order ID / order number
    if (searchBy === 'orderId' && orderId) {
      query.$or = [
        { orderNumber: { $regex: orderId, $options: 'i' } },
        { orderNumber: orderId }
      ];
    }

    const skip = (page - 1) * limit;
    const sortOrder = sort === 'asc' ? 1 : -1;

    const orders = await Order.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الطلبات'
    });
  }
};


export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('userId', 'name email locations')
      .populate('items.productId', 'name images price stock sku')

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    // 🎯 Extract selected location
    const selectedLocation = order.userId.locations.find(
      loc => loc._id.toString() === order.locationId.toString()
    );

    return res.status(200).json({
      success: true,
      message: 'تم جلب تفاصيل الطلب',
      data: {
        ...order.toObject(),
        location: selectedLocation || null
      }
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الطلب'
    });
  }
};


/* ================= ORDER STATS (ADMIN) ================= */
export const getOrderStats = async (req, res) => {
  try {
    const pending = await Order.countDocuments({ status: 'pending' });
    const confirmed = await Order.countDocuments({ status: 'confirmed' });
    const shipped = await Order.countDocuments({ status: 'shipped' });
    const delivered = await Order.countDocuments({ status: 'delivered' });
    const cancelled = await Order.countDocuments({ status: 'cancelled' });

    return res.status(200).json({
      success: true,
      message: 'تم جلب إحصائيات الطلبات',
      data: {
        pending,
        confirmed,
        shipped,
        delivered,
        cancelled
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الإحصائيات'
    });
  }
};

/* ================= UPDATE ORDER STATUS (ADMIN) ================= */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatus = [
      'pending',
      'confirmed',
      'shipped',
      'delivered'
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'حالة الطلب غير صالحة'
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    if (order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن تعديل طلب تم تسليمه'
      });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: 'تم تحديث حالة الطلب بنجاح',
      data: order
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث حالة الطلب'
    });
  }
};

/* ================= CANCEL ORDER (ADMIN) ================= */
export const cancelOrderAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    if (order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن إلغاء طلب تم تسليمه'
      });
    }

    order.status = 'cancelled';
    await order.save();

    return res.status(200).json({
      success: true,
      message: 'تم إلغاء الطلب بنجاح',
      data: order
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إلغاء الطلب'
    });
  }
};
