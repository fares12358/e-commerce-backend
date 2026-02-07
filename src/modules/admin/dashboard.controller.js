import User from '../users/user.model.js';
import Order from '../order/order.model.js';

/* ================= DASHBOARD STATS ================= */
export const getDashboardStats = async (req, res) => {
  try {

    const range = req.query.range || "week";

    const endDate = new Date();
    let startDate = new Date();

    /* ===== DATE RANGE HANDLER ===== */

    if (range === "week") {
      startDate.setDate(endDate.getDate() - 6);
    }

    if (range === "month") {
      startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    }

    if (range === "lastMonth") {
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
      endDate.setMonth(endDate.getMonth());
      endDate.setDate(0); // last day of previous month
    }

    if (range === "threeMonths") {
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 2, 1);
    }

    /* ===== USERS ===== */
    const usersCount = await User.countDocuments();

    /* ===== ORDER COUNTS ===== */
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

    /* ===== TOTAL REVENUE ===== */
    const revenueAgg = await Order.aggregate([
      { $match: { status: "delivered" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" }
        }
      }
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;

    /* ===== ORDERS BY DAY ===== */
    const ordersAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    /* ===== INCOME BY DAY ===== */
    const incomeAgg = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          total: { $sum: "$totalPrice" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    /* ===== FILL EMPTY DAYS ===== */
    const fillDays = (start, end, data, field) => {
      const map = {};
      data.forEach(d => map[d._id] = d[field]);

      const labels = [];
      const values = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        labels.push(key);
        values.push(map[key] || 0);
      }

      return { labels, values };
    };

    const ordersSeries = fillDays(startDate, endDate, ordersAgg, "count");
    const incomeSeries = fillDays(startDate, endDate, incomeAgg, "total");

    /* ===== LATEST ORDERS ===== */
    const latestOrders = await Order.find({ status: "pending" })
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(20);

    /* ===== RESPONSE ===== */
    return res.status(200).json({
      success: true,
      message: "تم جلب إحصائيات لوحة التحكم بنجاح",
      data: {
        users: usersCount,
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          confirmed: confirmedOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders
        },
        revenue: totalRevenue,
        latestOrders,
        chart: {
          orders: {
            labels: ordersSeries.labels,
            orders: ordersSeries.values
          },
          income: {
            labels: incomeSeries.labels,
            income: incomeSeries.values  
          }
        }
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب إحصائيات لوحة التحكم"
    });
  }
};

