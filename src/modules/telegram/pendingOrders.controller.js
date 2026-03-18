import Order from "../../modules/order/order.model.js";
import sendEmail from "../../utils/sendEmail.js";
import Controllers from "../contorlles/contorlles.model.js";

export const getPendingOrders = async (req, res) => {

  try {

    const { period, amount } = req.query;

    let startDate = null;

    if (period && amount) {

      startDate = new Date();

      if (period === "DAY") {
        startDate.setDate(startDate.getDate() - amount);
      }

      if (period === "WEEK") {
        startDate.setDate(startDate.getDate() - (amount * 7));
      }

      if (period === "MONTH") {
        startDate.setMonth(startDate.getMonth() - amount);
      }

    }

    const filter = {
      status: "pending",
      ...(startDate && { createdAt: { $gte: startDate } })
    };

    const totalPending = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      total: totalPending,
      orders
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

export const getOrderDetails = async (req, res) => {
  try {

    let { id } = req.params;

    // If user sends only number → convert to ORD-xxxx
    if (!id.startsWith("ORD-")) {
      id = `ORD-${id}`;
    }
    console.log(id);

    const order = await Order.findOne({ orderNumber: id })
      .populate("userId", "name email locations")
      .populate("items.productId", "name images price");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    let selectedLocation = null;

    if (order.userId && order.userId.locations?.length) {
      selectedLocation = order.userId.locations.find(
        loc => loc._id.toString() === order.locationId?.toString()
      );
    }

    res.json({
      success: true,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalPrice: order.totalPrice.toFixed(2),
        shippingFee: order.shippingFee,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,

        customer: {
          name: order.userId?.name || "Deleted user",
          email: order.userId?.email || null
        },

        location: selectedLocation || null,

        items: order.items.map(item => ({
          productId: item.productId?._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          selections: item.selections
        }))
      }
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to get order details"
    });

  }
};
export const updateOrderStatusBot = async (req, res) => {
  try {

    let { number, status } = req.params;

    status = status.toUpperCase();

    if (!number.startsWith("ORD-")) {
      number = `ORD-${number}`;
    }

    const statusMap = {
      CONF: "confirmed",
      SHP: "shipped",
      DLV: "delivered",
      CNC: "cancelled"
    };

    const newStatus = statusMap[status];

    if (!newStatus) {
      return res.status(400).json({
        success: false,
        message: "Invalid status code"
      });
    }

    const order = await Order.findOne({ orderNumber: number }).populate("userId");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }


    /* Prevent same status update */

    if (order.status === newStatus) {
      return res.status(400).json({
        success: false,
        message: "Order already has this status"
      });
    }

    /* Prevent invalid updates */

    if (order.status === "delivered") {
      return res.status(400).json({
        success: false,
        message: "Delivered orders cannot be modified"
      });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled orders cannot be modified"
      });
    }


    /* Handle cancellation */

    if (newStatus === "cancelled") {
      order.cancelledAt = new Date();
    }

    order.status = newStatus;

    await order.save();

    /* Email Notification */

    const statusMessages = {
      confirmed: "تم تأكيد طلبك بنجاح ✅",
      shipped: "تم شحن طلبك 🚚",
      delivered: "تم تسليم طلبك 🎉",
      cancelled: "تم إلغاء طلبك ❌"
    };

    const controller = await Controllers.findOne();

    if (controller && controller.emailNotify && order.userId?.email) {

      await sendEmail({
        to: order.userId.email,
        subject: "تحديث حالة طلبك",
        html: `
        <h3>مرحباً ${order.userId.name}</h3>
        <p>تم تحديث حالة طلبك رقم <strong>${order.orderNumber}</strong></p>
        <p>${statusMessages[newStatus]}</p>
        <br/>
        <p>شكراً لتسوقك معنا ❤️</p>
        `
      });

    }

    return res.json({
      success: true,
      message: "Order status updated",
      order
    });

  } catch (error) {

    console.error("Update Order Status Bot Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order status"
    });

  }
};