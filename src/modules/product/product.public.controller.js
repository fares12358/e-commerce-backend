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
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const filter = { isActive: true };

    if (categoryId) filter.categoryId = categoryId;

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const allowedSort = ['createdAt', 'price'];
    const sortOptions = {};

    if (allowedSort.includes(sortBy)) {
      sortOptions[sortBy] = order === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(filter)
      .populate({
        path: 'categoryId',
        match: { isActive: true },
        select: 'name'
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    // ❗ نشيل أي منتجات الكاتيجوري بتاعتها مش فعالة
    const filteredProducts = products.filter(p => p.categoryId);

    const total = await Product.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: 'تم جلب المنتجات بنجاح',
      data: {
        products: filteredProducts,
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
      message: 'حدث خطأ أثناء جلب المنتجات'
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
    const { q } = req.query;

    // حماية السيرفر
    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const products = await Product.find(
      {
        isActive: true,
        $text: { $search: q }
      },
      {
        name: 1,
        price: 1,
        images: { $slice: 1 }
      }
    )
      .limit(5)
      .lean();

    return res.json({
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
    const { q = "", page = 1, limit = 20 } = req.query;

    const currentPage = parseInt(page);
    const perPage = parseInt(limit);

    if (!q.trim()) {
      return res.json({
        success: true,
        data: [],
        pagination: { totalPages: 0 }
      });
    }

    const filter = {
      isActive: true,
      $text: { $search: q }
    };

    const total = await Product.countDocuments(filter);

    const products = await Product.find(
      filter,
      { score: { $meta: "textScore" } } // ترتيب حسب الصلة
    )
      .sort({ score: { $meta: "textScore" } })
      .skip((currentPage - 1) * perPage)
      .limit(perPage)
      .lean();
    
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
