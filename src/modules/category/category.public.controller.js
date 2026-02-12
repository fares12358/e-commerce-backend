import Product from '../product/product.model.js';
import Category from './category.model.js';

export const getPublicCategories = async (req, res) => {
  try {

    const categories = await Category.find({ isActive: true })
      .select('name image')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'تم جلب التصنيفات بنجاح',
      data: categories
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب التصنيفات'
    });
  }
};

export const getProductsByCat = async (req, res) => {
  try {
    const { catId } = req.params
    const { page = 1, limit = 20, sort = "newest" } = req.query

    const category = await Category.findById(catId).lean()
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "التصنيف غير موجود"
      })
    }

    const skip = (page - 1) * limit

    let sortOption = { createdAt: -1 }
    if (sort === "priceAsc") sortOption = { price: 1 }
    if (sort === "priceDesc") sortOption = { price: -1 }

    const [products, total] = await Promise.all([
      Product.find({ categoryId: catId, isActive: true })
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .lean(),

      Product.countDocuments({ categoryId: catId, isActive: true })
    ])

    return res.status(200).json({
      success: true,
      data: {
        category: {
          _id: category._id,
          name: category.name,
          image: category.image
        },
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب المنتجات"
    })
  }
}