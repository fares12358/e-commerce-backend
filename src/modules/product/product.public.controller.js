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
      limit = 12,
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
