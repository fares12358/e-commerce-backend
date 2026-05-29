import User from '../users/user.model.js';
import Order from '../order/order.model.js';

/* ===============================================================
   DASHBOARD STATS  [v1.0.6]
   GET /api/admin/dashboard/stats?range=week|month|lastMonth|threeMonths

   Revenue logic:
   - grossRevenue  = sum of all delivered orders (includes any that later got refunded)
   - refundedAmount = sum of money_refunded orders (product returned, order cancelled)
   - netRevenue    = grossRevenue - refundedAmount
     → This is the real money that stayed with the store.
================================================================ */
export const getDashboardStats = async (req, res) => {
  try {
    const range   = req.query.range || "week";
    const endDate = new Date();
    let startDate = new Date();

    /* ── Date range ── */
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

    /* ── Users ── */
    const usersCount = await User.countDocuments();

    /* ── Order counts ── */
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "confirmed" }),
      Order.countDocuments({ status: "shipped" }),
      Order.countDocuments({ status: "delivered" }),
      Order.countDocuments({ status: "cancelled" }),
    ]);

    /* ── Refund counts (all-time) ── */
    const [
      refundRequested,
      refundApproved,
      refundProductReceived,
      refundMoneyRefunded,
      refundRejected,
    ] = await Promise.all([
      Order.countDocuments({ "refund.status": "requested" }),
      Order.countDocuments({ "refund.status": "approved" }),
      Order.countDocuments({ "refund.status": "product_received" }),
      Order.countDocuments({ "refund.status": "money_refunded" }),
      Order.countDocuments({ "refund.status": "rejected" }),
    ]);

    /* ── Gross revenue: sum of all delivered orders (never changes retroactively) ── */
    const grossRevenueAgg = await Order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const grossRevenue = grossRevenueAgg[0]?.total || 0;

    /* ── Refunded amount: sum of ACTUAL amounts paid back [v1.0.7] ──
       Uses refund.refundedAmount — the amount the admin manually entered.
       Falls back to totalPrice for any old records that pre-date v1.0.7
       where refundedAmount was not yet stored.
    ── */
    const refundedAmountAgg = await Order.aggregate([
      { $match: { "refund.status": "money_refunded" } },
      {
        $group: {
          _id: null,
          // Use refund.refundedAmount when present; fall back to totalPrice
          total: {
            $sum: {
              $ifNull: ["$refund.refundedAmount", "$totalPrice"]
            }
          }
        }
      },
    ]);
    const refundedAmount = refundedAmountAgg[0]?.total || 0;

    /* ── Net revenue: what actually stayed with the store ── */
    const netRevenue = Math.max(0, grossRevenue - refundedAmount);

    /* ── Orders by day (in range) ── */
    const ordersAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    /* ── Gross income by day (delivered orders in range) ── */
    const incomeAgg = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    /* ── Refunded amount by day [v1.0.7] ── */
    const refundAmountAgg = await Order.aggregate([
      {
        $match: {
          "refund.status": "money_refunded",
          "refund.moneyRefundedAt": { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$refund.moneyRefundedAt" },
          },
          total: {
            $sum: { $ifNull: ["$refund.refundedAmount", "$totalPrice"] }
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    /* ── Refund requests by day (keyed by refund.requestedAt) ── */
    const refundRequestAgg = await Order.aggregate([
      {
        $match: {
          "refund.status": { $in: ["requested", "approved", "product_received", "money_refunded", "rejected"] },
          "refund.requestedAt": { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$refund.requestedAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    /* ── Fill empty days ── */
    const fillDays = (start, end, data, field) => {
      const map = {};
      data.forEach(d => { map[d._id] = d[field]; });
      const labels = [];
      const values = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        labels.push(key);
        values.push(map[key] || 0);
      }
      return { labels, values };
    };

    const ordersSeries      = fillDays(startDate, endDate, ordersAgg,       "count");
    const incomeSeries      = fillDays(startDate, endDate, incomeAgg,       "total");
    const refundAmtSeries   = fillDays(startDate, endDate, refundAmountAgg, "total");
    const refundCountSeries = fillDays(startDate, endDate, refundRequestAgg,"count");

    /* ── Latest orders (pending + orders with active refund requests) ── */
    const latestOrders = await Order.find({
      $or: [
        { status: "pending" },
        { "refund.status": "requested" },        // new refund requests need attention
        { "refund.status": "approved" },          // waiting for product return
        { "refund.status": "product_received" },  // waiting for money send
      ],
    })
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(20);

    /* ── Response ── */
    return res.status(200).json({
      success: true,
      message: "تم جلب إحصائيات لوحة التحكم بنجاح",
      data: {
        users: usersCount,

        orders: {
          total:     totalOrders,
          pending:   pendingOrders,
          confirmed: confirmedOrders,
          shipped:   shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },

        /* Revenue breakdown [v1.0.6] */
        revenue: netRevenue,         // backward-compat: existing UI shows this as "Revenue"
        grossRevenue,                // total of all delivered orders
        refundedAmount,              // total that was physically returned to customers
        netRevenue,                  // = grossRevenue - refundedAmount

        /* Refund overview counts [v1.0.6] */
        refunds: {
          requested:       refundRequested,
          approved:        refundApproved,
          productReceived: refundProductReceived,
          moneyRefunded:   refundMoneyRefunded,
          rejected:        refundRejected,
          total:           refundRequested + refundApproved + refundProductReceived + refundMoneyRefunded + refundRejected,
          active:          refundRequested + refundApproved + refundProductReceived, // needs admin attention
        },

        latestOrders,

        chart: {
          orders: {
            labels: ordersSeries.labels,
            orders: ordersSeries.values,
          },
          income: {
            labels: incomeSeries.labels,
            income: incomeSeries.values,
          },
          /* [v1.0.6] Refund charts */
          refundAmount: {
            labels: refundAmtSeries.labels,
            amounts: refundAmtSeries.values,
          },
          refundCount: {
            labels: refundCountSeries.labels,
            counts: refundCountSeries.values,
          },
        },
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب إحصائيات لوحة التحكم",
    });
  }
};
