import User from '../users/user.model.js';
import Order from '../order/order.model.js';

/* ================= DASHBOARD STATS ================= */
export const getDashboardStats = async (req, res) => {
  try {

    const range = req.query.range || "week";
    // week | month | lastMonth | threeMonths

    const now = new Date();
    let startDate = new Date();

    if (range === "week") {
      startDate.setDate(now.getDate() - 6);
    }

    if (range === "month") {
      startDate.setDate(1);
    }

    if (range === "lastMonth") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      now.setDate(0); // end of last month
    }

    if (range === "threeMonths") {
      startDate.setMonth(now.getMonth() - 2);
      startDate.setDate(1);
    }


    /* ===== Users ===== */
    const usersCount = await User.countDocuments();

    /* ===== Orders ===== */
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const confirmedOrders = await Order.countDocuments({ status: 'confirmed' });
    const shippedOrders = await Order.countDocuments({ status: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

    /* ===== Revenue (Delivered Only) ===== */
    const revenueResult = await Order.aggregate([
      { $match: { status: 'delivered' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' }
        }
      }
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    /* ===== Line Chart Orders by Date ===== */
    const chartData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1
        }
      }
    ]);

    const labels = chartData.map(d =>
      `${d._id.day}/${d._id.month}`
    );

    const orders = chartData.map(d => d.count);

    /* ===== Latest Orders ===== */
    const latestOrders = await Order.find({ status: 'pending' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      message: 'تم جلب إحصائيات لوحة التحكم بنجاح',
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
          labels,
          orders
        }
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب إحصائيات لوحة التحكم'
    });
  }
};
