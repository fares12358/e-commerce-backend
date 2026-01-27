import Category from './category.model.js';
import {
  uploadImage,
  updateImage,
  deleteImage
} from '../../utils/cloudinary.js';
import Product from '../product/product.model.js';

/* ================= CREATE CATEGORY ================= */
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'اسم التصنيف مطلوب'
      });
    }

    const image = req.file
      ? await uploadImage(req.file, 'categories')
      : null;

    const category = await Category.create({
      name,
      image
    });

    return res.status(201).json({
      success: true,
      message: 'تم إنشاء التصنيف بنجاح',
      data: category
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء التصنيف'
    });
  }
};

/* ================= GET ALL CATEGORIES ================= */
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find()
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

/* ================= UPDATE CATEGORY ================= */
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'التصنيف غير موجود'
      });
    }

    if (name) category.name = name;

    if (req.file) {
      const updatedImage = await updateImage(
        category.image?.public_id,
        req.file,
        'categories'
      );
      category.image = updatedImage;
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: 'تم تحديث التصنيف بنجاح',
      data: category
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث التصنيف'
    });
  }
};

/* ================= DELETE (DISABLE) CATEGORY ================= */
export const Categorystatus = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'التصنيف غير موجود'
      });
    }

    category.isActive = !category.isActive;

    await category.save();

    return res.status(200).json({
      success: true,
      message: 'تم حذف التصنيف بنجاح'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف التصنيف'
    });
  }
};

/* ================= DELETE CATEGORY (PERMANENT) ================= */

export const deleteCategoryPermanent = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'التصنيف غير موجود'
      });
    }

    // ✅ Check لو في منتجات مرتبطة
    const productsCount = await Product.countDocuments({
      categoryId: id
    });

    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف التصنيف لوجود منتجات مرتبطة به'
      });
    }

    // Delete image from Cloudinary
    if (category.image?.public_id) {
      await deleteImage(category.image.public_id);
    }

    await category.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'تم حذف التصنيف نهائيًا'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء الحذف النهائي للتصنيف'
    });
  }
};
