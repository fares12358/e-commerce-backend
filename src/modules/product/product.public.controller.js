import Product from './product.model.js';

/* ================= GET PUBLIC PRODUCTS ================= */
export const getPublicProducts = async (req, res) => {
  try {
    const {
      categoryId,
      search,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
      sort = "new"
    } = req.query;

    const matchStage = { isActive: true };

    if (categoryId) matchStage.categoryId = new mongoose.Types.ObjectId(categoryId);

    if (search) {
      matchStage.name = { $regex: search, $options: "i" };
    }

    if (minPrice || maxPrice) {
      matchStage.price = {};
      if (minPrice) matchStage.price.$gte = Number(minPrice);
      if (maxPrice) matchStage.price.$lte = Number(maxPrice);
    }

    /* SORT */
    let sortOptions = {};
    switch (sort) {
      case "new":
        sortOptions = { createdAt: -1 };
        break;
      case "old":
        sortOptions = { createdAt: 1 };
        break;
      case "price_asc":
        sortOptions = { price: 1 };
        break;
      case "price_desc":
        sortOptions = { price: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const pipeline = [
      { $match: matchStage },

      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category"
        }
      },

      { $unwind: "$category" },

      { $match: { "category.isActive": true } },

      { $sort: sortOptions },

      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: Number(limit) }
          ],
          totalCount: [
            { $count: "count" }
          ]
        }
      }
    ];

    const result = await Product.aggregate(pipeline);

    const products = result[0].data;
    const total = result[0].totalCount[0]?.count || 0;

    return res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب المنتجات"
    });
  }
};

/* ================= GET PRODUCT DETAILS ================= */
export const getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      _id: id,
      isActive: true
    }).populate({
      path: 'categoryId',
      match: { isActive: true },
      select: 'name'
    });

    if (!product || !product.categoryId) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'تم جلب بيانات المنتج',
      data: product
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المنتج'
    });
  }
};

export const suggestProducts = async (req, res) => {
  try {
    let { q } = req.query;

    if (!q || q.trim().length < 1) {
      return res.json({ success: true, data: [] });
    }

    q = q.trim().slice(0, 50);

    const products = await Product.aggregate([
      {
        $match: {
          isActive: true,
          name: { $regex: q, $options: "i" } // 🔥 Partial match
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      { $match: { "category.isActive": true } },
      {
        $project: {
          name: 1,
          price: 1,
          images: { $slice: ["$images", 1] }
        }
      },
      { $limit: 8 }
    ]);

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "search error"
    });
  }
};
export const searchProducts = async (req, res) => {
  try {
    let { q = "", page = 1, limit = 20 } = req.query;

    q = q.trim().slice(0, 50);

    if (!q) {
      return res.json({
        success: true,
        data: [],
        pagination: { totalPages: 0 }
      });
    }

    const currentPage = Number(page);
    const perPage = Number(limit);
    const skip = (currentPage - 1) * perPage;

    const matchStage = {
      isActive: true,
      name: { $regex: q, $options: "i" }
    };

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      { $match: { "category.isActive": true } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: perPage }
          ],
          totalCount: [
            { $count: "count" }
          ]
        }
      }
    ];

    const result = await Product.aggregate(pipeline);

    const products = result[0].data;
    const total = result[0].totalCount[0]?.count || 0;

    res.json({
      success: true,
      data: products,
      pagination: {
        totalPages: Math.ceil(total / perPage),
        currentPage
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "search error"
    });
  }
};