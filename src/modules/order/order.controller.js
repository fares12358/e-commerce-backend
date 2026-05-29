import Order from "./order.model.js";
import User from "../users/user.model.js";
import Cart from "../cart/cart.model.js";
import Product from "../product/product.model.js";
import mongoose from "mongoose";
import Config from "../admin/config.model.js";
import sendEmail from "../../utils/sendEmail.js";
import pusher from "../../utils/pusher.js";
import { sendTelegramMessage } from "../../services/telegram.service.js";
import notificationModel from "../notification/notification.model.js";
import Controllers from "../contorlles/contorlles.model.js";

/* ================= CREATE ORDER (USER) ================= */
export const createOrder = async (req, res) => {
  try {
    const { locationId } = req.body;
    if (!locationId) {
      return res.status(400).json({ success: false, message: "العنوان مطلوب" });
    }
    const config = await Config.findOne();
    const user = await User.findById(req.user._id);
    const locationExists = user.locations.id(locationId);

    if (!locationExists) {
      return res.status(400).json({ success: false, message: "العنوان غير صالح" });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "السلة فارغة" });
    }

    const orderItems = [];
    let totalPrice = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.productId);

      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: "أحد المنتجات غير متوفر" });
      }
      if (item.quantity > product.stock) {
        return res.status(400).json({ success: false, message: "الكمية المطلوبة غير متاحة" });
      }

      product.stock -= item.quantity;
      await product.save();

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        attributes: product.attributes,
        selections: item.selections,
        quantity: item.quantity,
      });

      totalPrice += product.price * item.quantity;
    }

    const order = await Order.create({
      orderNumber: `ORD-${Date.now()}`,
      userId: req.user._id,
      locationId,
      items: orderItems,
      shippingFee: config.shipment,
      totalPrice,
    });

    await Cart.findByIdAndDelete(cart._id);

    const settings = await notificationModel.findOne();
    const controller = await Controllers.findOne();

    if (controller && controller.emailNotify) {
      await sendEmail({
        to: user.email,
        subject: `تم انشاء طلبك رقم ${order.orderNumber}`,
        html: `
        <div style="font-family:Arial,sans-serif;direction:rtl;text-align:right;line-height:1.8;">
          <h2 style="color:#111;">مرحباً ${user.name} 👋</h2>
          <p>تم استلام طلبك بنجاح 🎉</p>
          <div style="background:#f5f5f5;padding:15px;border-radius:8px;margin:15px 0;">
            <p><strong>رقم الطلب:</strong> ${order.orderNumber}</p>
            <p><strong>إجمالي المبلغ:</strong> ${order.totalPrice}</p>
            <p><strong>طريقة الدفع:</strong> ${order.paymentMethod}</p>
            <p><strong>حالة الطلب:</strong> ${order.status}</p>
          </div>
          <p>سيتم معالجة طلبك في أقرب وقت ممكن.</p>
          <br/><p>شكراً لتسوقك معنا ❤️<br/>فريق المتجر</p>
        </div>`,
      });
    }

    if (controller && controller.notification && settings &&
      settings.sectionNotify && settings.notifyOnNewOrder) {
      await pusher.trigger("admin-channel", "new-order", {
        orderNumber: order.orderNumber,
        totalPrice: order.totalPrice,
        orderId: order._id,
      });
    }

    if (
      controller && controller.notification && controller.telegramBot &&
      settings && settings.adminChatId !== "" &&
      settings.telegramEnabled && settings.notifyOnNewOrder
    ) {
      await sendTelegramMessage(
        settings.adminChatId,
        `🛒 <b>NEW ORDER CREATED</b>\n👤 <b>User:</b> ${req.user.email}\n💰 <b>Total:</b> ${order.totalPrice}\n📦 <b>Order #:</b> <code>${order.orderNumber}</code>\n🕒 <b>Date:</b> ${new Date().toLocaleString()}`,
        [[{ text: "📦 View Order Details", callback_data: `ORD-${order.orderNumber}` }]]
      );
    }

    return res.status(201).json({
      success: true,
      message: "تم إنشاء الطلب بنجاح",
      data: order,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء إنشاء الطلب" });
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
      orderNumber,
      refundStatus, // [v1.0.4] filter: 'requested' | 'approved' | 'rejected'
    } = req.query;

    const currentPage = parseInt(page);
    const pageLimit   = parseInt(limit);

    const filter = { userId: req.user._id };
    if (status)       filter.status            = status;
    if (refundStatus) filter["refund.status"]  = refundStatus; // [v1.0.4]

    if (orderNumber) {
      const clean = orderNumber.trim().replace(/^#/, "").replace(/^ord-/i, "");
      filter.orderNumber = { $regex: clean, $options: "i" };
    }

    const sortOption  = sort === "old" ? { createdAt: 1 } : { createdAt: -1 };
    const totalOrders = await Order.countDocuments(filter);
    const totalPages  = Math.ceil(totalOrders / pageLimit);

    const orders = await Order.find(filter)
      .sort(sortOption)
      .skip((currentPage - 1) * pageLimit)
      .limit(pageLimit)
      .lean();

    const user = await User.findById(req.user._id).select("locations").lean();
    const locationsMap = {};
    user?.locations?.forEach(loc => { locationsMap[loc._id.toString()] = loc; });

    const ordersWithLocation = orders.map(order => ({
      ...order,
      location: locationsMap[order.locationId?.toString()] || null,
    }));

    return res.status(200).json({
      success: true,
      message: "تم جلب الطلبات بنجاح",
      data: ordersWithLocation,
      pagination: { totalOrders, totalPages, currentPage, limit: pageLimit },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء جلب الطلبات" });
  }
};

/* ================= GET ORDER BY ID (USER) ================= */
export const getOrdersById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "معرف الطلب غير صالح" });
    }

    const order = await Order.findOne({ _id: id, userId: req.user._id }).lean();

    if (!order) {
      return res.status(404).json({ success: false, message: "الطلب غير موجود" });
    }

    const user = await User.findById(req.user._id).select("locations").lean();
    const location = user?.locations?.find(
      loc => loc._id.toString() === order.locationId.toString()
    );

    order.location = location || null;

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء جلب الطلب" });
  }
};

/* ================= CANCEL ORDER (USER) ================= */
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, userId: req.user._id });

    if (!order) {
      return res.status(404).json({ success: false, message: "الطلب غير موجود" });
    }
    if (order.status !== "pending") {
      return res.status(400).json({ success: false, message: "لا يمكن إلغاء الطلب بعد تأكيده" });
    }

    for (const item of order.items) {
      await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } });
    }

    order.status     = "cancelled";
    order.cancelledAt = new Date();
    await order.save();

    const controller = await Controllers.findOne();
    if (controller && controller.emailNotify) {
      await sendEmail({
        to: req.user.email,
        subject: "تم إلغاء طلبك",
        html: `<h3>مرحباً ${req.user.name}</h3>
        <p>تم إلغاء طلبك رقم <strong>${order.orderNumber}</strong></p>
        <p>إذا كان لديك أي استفسار يرجى التواصل مع خدمة العملاء.</p>
        <br/><p>نعتذر عن أي إزعاج 🙏</p>`,
      });
    }

    return res.status(200).json({ success: true, message: "تم إلغاء الطلب بنجاح" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء إلغاء الطلب" });
  }
};

/* ================= GET INVOICE (USER) ================= */
export const getInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const controller = await Controllers.findOne();
    if (controller && !controller.invoice) {
      return res.status(404).json({ success: false, message: "خدمة الفواتير غير مفعلة" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "معرف الطلب غير صالح" });
    }

    const order = await Order.findOne({ _id: id, userId: req.user._id }).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: "الطلب غير موجود" });
    }

    const user = await User.findById(req.user._id).select("email name locations").lean();
    const location = user?.locations?.find(
      loc => loc._id.toString() === order.locationId.toString()
    );

    const itemsRows = order.items.map(item => `
      <div style="border:1px solid #e5e5e5;border-radius:6px;padding:12px;margin-bottom:10px;background:#fafafa;">
        <p style="margin:0 0 6px 0;font-weight:bold;">${item.name?.trim()?.split(/\s+/).slice(0, 3).join(" ") || ""}</p>
        <p style="margin:2px 0;font-size:13px;">الكمية: ${item.quantity}</p>
        <p style="margin:2px 0;font-size:13px;">السعر: ${Number(item.price).toFixed(2)}</p>
        <p style="margin:4px 0 0 0;font-weight:bold;">الإجمالي: ${(item.price * item.quantity).toFixed(2)}</p>
      </div>`).join("");

    const html = `<!DOCTYPE html><html lang="ar"><head><meta charset="UTF-8"><title>فاتورة الطلب</title></head>
    <body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,sans-serif;" dir="rtl">
      <table width="100%" cellpadding="8" cellspacing="0" border="0" style="border-collapse:collapse;font-size:13px;">
        <tr><td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden;">
            <tr><td style="background:#000;color:#fff;padding:20px;text-align:center;"><h2 style="margin:0;font-size:20px;">فاتورة الطلب #${order.orderNumber}</h2></td></tr>
            <tr><td style="padding:20px;font-size:14px;color:#333;line-height:1.8;">
              <p style="margin:0;"><strong>العميل:</strong> ${user.name || ""}</p>
              <p style="margin:0;"><strong>العنوان:</strong> ${location?.country || ""} ${location?.city || ""} ${location?.government || ""} ${location?.strName || ""}</p>
              <p style="margin:0;"><strong>التاريخ:</strong> ${new Date(order.createdAt).toLocaleDateString("ar-EG")}</p>
            </td></tr>
            <tr><td style="padding:0 20px 20px 20px;"><h3 style="margin-bottom:10px;font-size:15px;">تفاصيل الطلب</h3>${itemsRows}</td></tr>
            <tr><td style="padding:0 20px 20px 20px;font-size:14px;color:#333;">
              <p style="margin:5px 0;">رسوم الشحن: <strong>${order.shippingFee || "—"}</strong></p>
              <p style="margin:5px 0;font-size:16px;font-weight:bold;">الإجمالي النهائي: ${Number(order.totalPrice).toFixed(2)}</p>
            </td></tr>
            <tr><td style="background:#fafafa;padding:20px;text-align:center;font-size:13px;color:#777;">شكراً لطلبك ❤️</td></tr>
          </table>
        </td></tr>
      </table>
    </body></html>`;

    await sendEmail({ to: user.email, subject: `فاتورة طلب رقم ${order.orderNumber}`, html });

    return res.status(200).json({ success: true, message: "تم ارسال الفاتورة الى بريدك الالكتروني" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء ارسال الفاتورة" });
  }
};

/* ================= GET ALL ORDERS (ADMIN) ================= */
export const getAllOrders = async (req, res) => {
  try {
    const {
      status, sort = "desc", email, orderId, searchBy,
      page = 1, limit = 20, date,
      refundStatus, // [v1.0.4]
    } = req.query;

    const query = {};
    if (status)       query.status           = status;
    if (refundStatus) query["refund.status"] = refundStatus; // [v1.0.4]

    if (date) {
      const now = new Date();
      let fromDate;
      if (date === "today")       fromDate = new Date(now.setHours(0,0,0,0));
      if (date === "week")        fromDate = new Date(Date.now() - 7  * 86400000);
      if (date === "month")       fromDate = new Date(Date.now() - 30 * 86400000);
      if (date === "threeMonths") fromDate = new Date(Date.now() - 90 * 86400000);
      if (fromDate) query.createdAt = { $gte: fromDate };
    }

    if (searchBy === "email" && email) {
      const users = await User.find({ email: { $regex: email, $options: "i" } }).select("_id");
      query.userId = { $in: users.map(u => u._id) };
    }
    if (searchBy === "orderId" && orderId) {
      query.$or = [
        { orderNumber: { $regex: orderId, $options: "i" } },
        { orderNumber: orderId },
      ];
    }

    const skip      = (page - 1) * limit;
    const sortOrder = sort === "asc" ? 1 : -1;

    const orders = await Order.find(query)
      .populate("userId", "name email")
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          total, page: Number(page), limit: Number(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء جلب الطلبات" });
  }
};

/* ================= GET ORDER BY ID (ADMIN) ================= */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate("userId", "name email locations")
      .populate("items.productId", "name images price stock sku");

    if (!order) {
      return res.status(404).json({ success: false, message: "الطلب غير موجود" });
    }

    let selectedLocation = null;
    if (order.userId && order.userId.locations?.length) {
      selectedLocation = order.userId.locations.find(
        loc => loc._id.toString() === order.locationId?.toString()
      );
    }

    return res.status(200).json({
      success: true,
      message: "تم جلب تفاصيل الطلب",
      data: {
        ...order.toObject(),
        location: selectedLocation || null,
        userDeleted: !order.userId,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء جلب الطلب" });
  }
};

/* ================= ORDER STATS (ADMIN) ================= */
export const getOrderStats = async (req, res) => {
  try {
    const [
      total, pending, confirmed, shipped, delivered, cancelled,
      refundRequested, refundApproved, refundProductReceived, refundMoneyRefunded, refundRejected,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "confirmed" }),
      Order.countDocuments({ status: "shipped" }),
      Order.countDocuments({ status: "delivered" }),
      Order.countDocuments({ status: "cancelled" }),
      Order.countDocuments({ "refund.status": "requested" }),
      Order.countDocuments({ "refund.status": "approved" }),
      Order.countDocuments({ "refund.status": "product_received" }), // [v1.0.5]
      Order.countDocuments({ "refund.status": "money_refunded" }),   // [v1.0.5]
      Order.countDocuments({ "refund.status": "rejected" }),
    ]);

    return res.status(200).json({
      success: true,
      message: "تم جلب إحصائيات الطلبات",
      data: {
        total, pending, confirmed, shipped, delivered, cancelled,
        refundRequested, refundApproved, refundProductReceived, refundMoneyRefunded, refundRejected,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء جلب الإحصائيات" });
  }
};

/* ================= UPDATE ORDER STATUS (ADMIN) ================= */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const allowedStatus = ["pending", "confirmed", "shipped", "delivered"];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ success: false, message: "حالة الطلب غير صالحة" });
    }

    const order = await Order.findById(id).populate("userId");
    if (!order) {
      return res.status(404).json({ success: false, message: "الطلب غير موجود" });
    }
    if (order.status === "delivered") {
      return res.status(400).json({ success: false, message: "لا يمكن تعديل طلب تم تسليمه" });
    }

    order.status = status;
    await order.save();

    const statusMessages = {
      pending:   "طلبك قيد المراجعة حالياً.",
      confirmed: "تم تأكيد طلبك بنجاح ✅",
      shipped:   "تم شحن طلبك 🚚",
      delivered: "تم تسليم طلبك 🎉",
      cancelled: "تم إلغاء طلبك ❌",
    };

    const controller = await Controllers.findOne();
    if (controller && controller.emailNotify) {
      await sendEmail({
        to: order.userId.email,
        subject: "تحديث حالة طلبك",
        html: `<h3>مرحباً ${order.userId.name}</h3>
        <p>تم تحديث حالة طلبك رقم <strong>${order.orderNumber}</strong></p>
        <p>${statusMessages[status]}</p>
        <br/><p>شكراً لتسوقك معنا ❤️</p>`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "تم تحديث حالة الطلب بنجاح",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء تحديث حالة الطلب" });
  }
};

/* ================= CANCEL ORDER (ADMIN) ================= */
export const cancelOrderAdmin = async (req, res) => {
  try {
    const { id }      = req.params;
    const { reset }   = req.body;

    const order = await Order.findById(id).populate("userId");
    if (!order) {
      return res.status(404).json({ success: false, message: "الطلب غير موجود" });
    }
    if (order.status === "delivered") {
      return res.status(400).json({ success: false, message: "لا يمكن إلغاء طلب تم تسليمه" });
    }
    if (order.status === "cancelled") {
      return res.status(400).json({ success: false, message: "الطلب ملغي مسبقاً" });
    }

    if (reset === true) {
      for (const item of order.items) {
        await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } });
      }
    }

    order.status      = "cancelled";
    order.cancelledAt = new Date();
    await order.save();

    const controller = await Controllers.findOne();
    if (controller && controller.emailNotify) {
      await sendEmail({
        to: order.userId.email,
        subject: "تم إلغاء طلبك",
        html: `<h3>مرحباً ${order.userId.name}</h3>
        <p>تم إلغاء طلبك رقم <strong>${order.orderNumber}</strong></p>
        <p>إذا كان لديك أي استفسار يرجى التواصل مع خدمة العملاء.</p>
        <br/><p>نعتذر عن أي إزعاج 🙏</p>`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "تم إلغاء الطلب بنجاح",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء إلغاء الطلب" });
  }
};

/* ══════════════════════════════════════════════════════════════
   REQUEST REFUND  [v1.0.4]
   POST /api/orders/:id/refund
   Body: { reason: String }

   Guards (in order):
   1. Controllers.refund flag must be true           → 403
   2. reason must be non-empty                       → 400
   3. Order must exist and belong to req.user        → 404
   4. order.status must be "delivered"               → 400
   5. refund.status must be "none" (no duplicate)    → 400
   6. now <= order.updatedAt + refundWindowDays days → 400
══════════════════════════════════════════════════════════════ */
export const requestRefund = async (req, res) => {
  try {
    const { id }     = req.params;
    const { reason } = req.body;

    // 1. Feature flag
    const controller = await Controllers.findOne().lean();
    if (!controller?.refund) {
      return res.status(403).json({
        success: false,
        message: "خدمة الاسترداد غير مفعلة حالياً",
      });
    }

    // 2. Validate reason
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "يرجى كتابة سبب طلب الاسترداد",
      });
    }

    // 3. Find order — must belong to this user
    const order = await Order.findOne({ _id: id, userId: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "الطلب غير موجود" });
    }

    // 4. Must be delivered
    if (order.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "يمكن طلب الاسترداد على الطلبات المسلمة فقط",
      });
    }

    // 5. No duplicate request
    if (order.refund?.status !== "none") {
      return res.status(400).json({
        success: false,
        message: "تم تقديم طلب استرداد مسبقاً لهذا الطلب",
      });
    }

    // 6. Refund window check (updatedAt = last save = when delivered was set)
    const config     = await Config.findOne().lean();
    const windowDays = config?.refundWindowDays ?? 7;

    if (windowDays > 0) {
      const deliveredAt  = new Date(order.updatedAt);
      const deadlineDate = new Date(deliveredAt.getTime() + windowDays * 24 * 60 * 60 * 1000);
      if (new Date() > deadlineDate) {
        return res.status(400).json({
          success: false,
          message: `انتهت مدة طلب الاسترداد. يمكن تقديم الطلب خلال ${windowDays} يوم من تاريخ التسليم فقط`,
        });
      }
    }

    // 7. Stamp the refund sub-document
    order.refund.status      = "requested";
    order.refund.reason      = reason.trim();
    order.refund.requestedAt = new Date();
    await order.save();

    // 8. Confirmation email — non-blocking
    if (controller.emailNotify) {
      const user = await User.findById(req.user._id).select("name email").lean();
      sendEmail({
        to: user.email,
        subject: `تم استلام طلب الاسترداد - ${order.orderNumber}`,
        html: `
        <div style="font-family:Arial,sans-serif;direction:rtl;text-align:right;line-height:1.8;">
          <h3>مرحباً ${user.name}</h3>
          <p>تم استلام طلب الاسترداد للطلب رقم <strong>${order.orderNumber}</strong> ✅</p>
          <p><strong>السبب:</strong> ${reason.trim()}</p>
          <p>سيتم مراجعة طلبك والرد عليه في أقرب وقت ممكن.</p>
          <br/><p>شكراً لتواصلك معنا ❤️</p>
        </div>`,
      }).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: "تم إرسال طلب الاسترداد بنجاح. سيتم مراجعته والرد عليك قريباً",
      data: { refundStatus: "requested" },
    });

  } catch (error) {
    console.error("requestRefund error:", error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إرسال طلب الاسترداد",
    });
  }
};

/* ══════════════════════════════════════════════════════════════
   APPROVE REFUND  [v1.0.5]
   PATCH /api/orders/:id/refund/approve
   Body: { adminNote?: String }
   → Moves: requested → approved
   → Tells user to send product back
   → Stock NOT restored yet (happens at product_received step)
══════════════════════════════════════════════════════════════ */
export const approveRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote = "" } = req.body;

    const order = await Order.findById(id).populate("userId");
    if (!order) {
      return res.status(404).json({ success: false, message: "الطلب غير موجود" });
    }
    if (order.refund?.status !== "requested") {
      return res.status(400).json({
        success: false,
        message: "لا يوجد طلب استرداد معلق على هذا الطلب",
      });
    }

    // Move to 'approved' — stock NOT restored here, restored at product_received
    order.refund.status    = "approved";
    order.refund.adminNote = adminNote.trim();
    await order.save();

    const controller = await Controllers.findOne().lean();
    if (controller?.emailNotify && order.userId?.email) {
      await sendEmail({
        to: order.userId.email,
        subject: `تمت الموافقة على طلب الاسترداد - ${order.orderNumber}`,
        html: `
        <div style="font-family:Arial,sans-serif;direction:rtl;text-align:right;line-height:1.8;">
          <h3>مرحباً ${order.userId.name}</h3>
          <p>تمت الموافقة على طلب الاسترداد للطلب رقم <strong>${order.orderNumber}</strong> ✅</p>
          ${adminNote ? `<p><strong>ملاحظة:</strong> ${adminNote}</p>` : ""}
          <p>يرجى إعادة المنتج/المنتجات إلينا لاستكمال عملية الاسترداد.</p>
          <p>بمجرد استلام المنتج سيتم إعادة المبلغ إليك.</p>
          <br/><p>شكراً لتسوقك معنا ❤️</p>
        </div>`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "تمت الموافقة على طلب الاسترداد. تم إخطار العميل بإعادة المنتج",
      data: order,
    });
  } catch (error) {
    console.error("approveRefund error:", error);
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء الموافقة على الاسترداد" });
  }
};

/* ══════════════════════════════════════════════════════════════
   REJECT REFUND  [v1.0.5]
   PATCH /api/orders/:id/refund/reject
   Body: { adminNote?: String }
   → Moves: requested → rejected  (terminal)
══════════════════════════════════════════════════════════════ */
export const rejectRefund = async (req, res) => {
  try {
    const { id }            = req.params;
    const { adminNote = "" } = req.body;

    const order = await Order.findById(id).populate("userId");
    if (!order) {
      return res.status(404).json({ success: false, message: "الطلب غير موجود" });
    }
    if (order.refund?.status !== "requested") {
      return res.status(400).json({
        success: false,
        message: "لا يوجد طلب استرداد معلق على هذا الطلب",
      });
    }

    order.refund.status     = "rejected";
    order.refund.resolvedAt = new Date();
    order.refund.adminNote  = adminNote.trim();
    await order.save();

    const controller = await Controllers.findOne().lean();
    if (controller?.emailNotify && order.userId?.email) {
      await sendEmail({
        to: order.userId.email,
        subject: `تم رفض طلب الاسترداد - ${order.orderNumber}`,
        html: `
        <div style="font-family:Arial,sans-serif;direction:rtl;text-align:right;line-height:1.8;">
          <h3>مرحباً ${order.userId.name}</h3>
          <p>نأسف لإبلاغك بأنه تم رفض طلب الاسترداد للطلب رقم <strong>${order.orderNumber}</strong>.</p>
          ${adminNote ? `<p><strong>السبب:</strong> ${adminNote}</p>` : ""}
          <p>إذا كان لديك استفسار يرجى التواصل مع خدمة العملاء.</p>
          <br/><p>نعتذر عن أي إزعاج 🙏</p>
        </div>`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "تم رفض طلب الاسترداد",
      data: order,
    });
  } catch (error) {
    console.error("rejectRefund error:", error);
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء رفض الاسترداد" });
  }
};

/* ══════════════════════════════════════════════════════════════
   MARK PRODUCT RECEIVED  [v1.0.5]
   PATCH /api/orders/:id/refund/product-received
   Body: { restoreStock?: Boolean, adminNote?: String }
   → Moves: approved → product_received
   → Optionally restores stock
   → Notifies user that money will be refunded soon
══════════════════════════════════════════════════════════════ */
export const markProductReceived = async (req, res) => {
  try {
    const { id } = req.params;
    const { restoreStock = false, adminNote = "" } = req.body;

    const order = await Order.findById(id).populate("userId");
    if (!order) {
      return res.status(404).json({ success: false, message: "الطلب غير موجود" });
    }
    if (order.refund?.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "يجب أن يكون طلب الاسترداد بحالة موافق أولاً",
      });
    }

    // Optionally restore stock when product comes back
    if (restoreStock === true) {
      for (const item of order.items) {
        await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } });
      }
      order.refund.stockRestored = true;
    }

    order.refund.status            = "product_received";
    order.refund.productReceivedAt = new Date();
    order.refund.adminNote         = adminNote.trim();
    await order.save();

    const controller = await Controllers.findOne().lean();
    if (controller?.emailNotify && order.userId?.email) {
      await sendEmail({
        to: order.userId.email,
        subject: `تم استلام المنتج - سيتم رد المبلغ قريباً - ${order.orderNumber}`,
        html: `
        <div style="font-family:Arial,sans-serif;direction:rtl;text-align:right;line-height:1.8;">
          <h3>مرحباً ${order.userId.name}</h3>
          <p>تم استلام المنتج العائد للطلب رقم <strong>${order.orderNumber}</strong> ✅</p>
          <p>سيتم رد مبلغ <strong>${order.totalPrice.toLocaleString()}</strong> إليك خلال أقرب وقت ممكن.</p>
          ${adminNote ? `<p><strong>ملاحظة:</strong> ${adminNote}</p>` : ""}
          <br/><p>شكراً لتسوقك معنا ❤️</p>
        </div>`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "تم تسجيل استلام المنتج. سيتم رد المبلغ للعميل",
      data: order,
    });
  } catch (error) {
    console.error("markProductReceived error:", error);
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء تحديث حالة المنتج" });
  }
};

/* ══════════════════════════════════════════════════════════════
   MARK MONEY REFUNDED  [v1.0.5 / v1.0.7]
   PATCH /api/orders/:id/refund/money-refunded
   Body: { refundedAmount: Number, adminNote?: String }
   → Moves: product_received → money_refunded  (terminal)
   → refundedAmount is the ACTUAL amount sent — may be < totalPrice
   → Sets order.status = "cancelled" (product returned, revenue deducted)
══════════════════════════════════════════════════════════════ */
export const markMoneyRefunded = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote = "", refundedAmount } = req.body;

    // Validate refundedAmount
    const amount = Number(refundedAmount);
    if (!refundedAmount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "يرجى إدخال المبلغ الفعلي الذي تم رده للعميل (يجب أن يكون أكبر من صفر)",
      });
    }

    const order = await Order.findById(id).populate("userId");
    if (!order) {
      return res.status(404).json({ success: false, message: "الطلب غير موجود" });
    }
    if (order.refund?.status !== "product_received") {
      return res.status(400).json({
        success: false,
        message: "يجب تسجيل استلام المنتج أولاً قبل تسجيل رد المبلغ",
      });
    }

    // Guard: refunded amount must not exceed order total
    if (amount > order.totalPrice) {
      return res.status(400).json({
        success: false,
        message: `المبلغ المدخل (${amount}) أكبر من إجمالي الطلب (${order.totalPrice}). تأكد من المبلغ.`,
      });
    }

    order.refund.status          = "money_refunded";
    order.refund.resolvedAt      = new Date();
    order.refund.moneyRefundedAt = new Date();
    order.refund.adminNote       = adminNote.trim();
    order.refund.refundedAmount  = amount; // [v1.0.7] store actual amount paid back

    // Mark order cancelled — product returned, deduct from revenue [v1.0.6]
    order.status      = "cancelled";
    order.cancelledAt = new Date();

    await order.save();

    const controller = await Controllers.findOne().lean();
    if (controller?.emailNotify && order.userId?.email) {
      await sendEmail({
        to: order.userId.email,
        subject: `تم رد المبلغ - اكتملت عملية الاسترداد - ${order.orderNumber}`,
        html: `
        <div style="font-family:Arial,sans-serif;direction:rtl;text-align:right;line-height:1.8;">
          <h3>مرحباً ${order.userId.name}</h3>
          <p>تم رد مبلغ <strong>${amount.toLocaleString()}</strong> للطلب رقم <strong>${order.orderNumber}</strong> ✅</p>
          ${amount < order.totalPrice
            ? `<p>ملاحظة: تم رد جزء من المبلغ الإجمالي ${order.totalPrice.toLocaleString()}.</p>`
            : ""
          }
          ${adminNote ? `<p><strong>ملاحظة:</strong> ${adminNote}</p>` : ""}
          <p>لقد اكتملت عملية الاسترداد بنجاح. شكراً لتعاملك معنا 🙏</p>
          <br/><p>نتمنى إخدمتك في قادم الأيام ❤️</p>
        </div>`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `تم تسجيل رد مبلغ ${amount.toLocaleString()}. اكتملت عملية الاسترداد`,
      data: order,
    });
  } catch (error) {
    console.error("markMoneyRefunded error:", error);
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء تحديث حالة الاسترداد" });
  }
};
