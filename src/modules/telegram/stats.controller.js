import Order from "../../modules/order/order.model.js";
import User from "../../modules/users/user.model.js";

export const getStoreStats = async (req, res) => {

  try {


    const { period, amount } = req.query;

    let startDate = null;

    if (period && amount) {

      startDate = new Date();

      if (period === "DAY") {
        startDate.setDate(startDate.getDate() - amount);
      }

      if (period === "WEEK") {
        startDate.setDate(startDate.getDate() - amount * 7);
      }

      if (period === "MONTH") {
        startDate.setMonth(startDate.getMonth() - amount);
      }

    }

    const filter = startDate ? { createdAt: { $gte: startDate } } : {};

    const usersCount = await User.countDocuments();

    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders
    ] = await Promise.all([
      Order.countDocuments(filter),
      Order.countDocuments({ ...filter, status: "pending" }),
      Order.countDocuments({ ...filter, status: "confirmed" }),
      Order.countDocuments({ ...filter, status: "shipped" }),
      Order.countDocuments({ ...filter, status: "delivered" }),
      Order.countDocuments({ ...filter, status: "cancelled" })
    ]);

    const revenueAgg = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          ...(startDate && { createdAt: { $gte: startDate } })
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" }
        }
      }
    ]);

    const totalRevenue = revenueAgg[0]?.total.toFixed(2) || 0;

    res.json({
      users: usersCount,
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        confirmed: confirmedOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders
      },
      revenue: totalRevenue
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};