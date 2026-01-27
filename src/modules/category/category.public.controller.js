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
