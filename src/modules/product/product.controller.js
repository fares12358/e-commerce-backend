import Product from './product.model.js';
import {
  uploadImage,
  deleteImage
} from '../../utils/cloudinary.js';

/* ================= CREATE PRODUCT ================= */
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      comparePrice,
      sku,
      stock,
      categoryId,
      isFeatured
    } = req.body;

    let { attributes, selections } = req.body;

    if (!name || !price || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'اسم المنتج والسعر والتصنيف مطلوبة'
      });
    }

    // لو attributes جاية كـ string (FormData)
    if (typeof attributes === 'string') {
      attributes = JSON.parse(attributes);
    }

    // Parse selections
    if (typeof selections === 'string') {
      selections = JSON.parse(selections);
    }

    // Validation بسيط
    if (attributes && !Array.isArray(attributes)) {
      return res.status(400).json({
        success: false,
        message: 'صيغة الخصائص غير صحيحة'
      });
    }
    if (selections && !Array.isArray(selections)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid selections format'
      });
    }

    let formattedSelections = [];

    if (selections?.length) {
      formattedSelections = selections.map(sel => ({
        name: sel.name,
        options: sel.options.map(opt => ({ value: opt }))
      }));
    }


    let images = [];
    if (req.files?.length) {
      for (const file of req.files) {
        images.push(await uploadImage(file, 'products'));
      }
    }

    const product = await Product.create({
      name,
      description,
      price,
      comparePrice,
      sku,
      stock,
      categoryId,
      images,
      attributes,
      selections: formattedSelections,
      isFeatured,
      createdBy: req.admin._id
    });

    return res.status(201).json({
      success: true,
      message: 'تم إنشاء المنتج بنجاح',
      data: product
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء المنتج'
    });
  }
};

/* ================= GET ALL PRODUCTS ================= */
export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
      isActive,
      categoryId,
      name
    } = req.query;

    const query = {};

    // Filters
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    // Sorting
    const sortOptions = {};
    const allowedSortFields = ['createdAt', 'price'];

    if (allowedSortFields.includes(sortBy)) {
      sortOptions[sortBy] = order === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const skip = (Number(page) - 1) * Number(limit);



    const products = await Product.find(query)
      .populate('categoryId', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: 'تم جلب المنتجات بنجاح',
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
    console.log(error);

    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المنتجات'
    });
  }
};

/* ================= GET ALL PRODUCTS ================= */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate('categoryId', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'تم جلب المنتج بنجاح',
      data: product
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المنتج',
      error: error.message
    });
  }
};


/* ================= UPDATE PRODUCT ================= */
export const updateProductBasicData = async (req, res) => {
  try {
    const { id } = req.params;

    // fields المسموح تحديثها فقط
    const allowedFields = [
      'name',
      'description',
      'price',
      'comparePrice',
      'sku',
      'stock',
      'categoryId',
      'isFeatured',
      'isActive',
      'discound'
    ];

    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // لو مفيش حاجة تتحدث
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لا يوجد بيانات للتحديث'
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'تم تحديث بيانات المنتج بنجاح',
      data: product
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث بيانات المنتج'
    });
  }
};

/* ================= DELETE (SOFT) PRODUCT ================= */
export const ProductStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    product.isActive = !product.isActive;
    await product.save();

    return res.status(200).json({
      success: true,
      message: product.isActive
        ? 'تم تفعيل المنتج'
        : 'تم تعطيل المنتج'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تعليق المنتج'
    });
  }
};
/* ================= DELETE (hard) PRODUCT ================= */

export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    // ===== Delete all images from Cloudinary =====
    if (product.images && product.images.length > 0) {
      await Promise.all(
        product.images.map(img => deleteImage(img.public_id))
      );
    }

    // ===== Delete product document =====
    await Product.findByIdAndDelete(productId);

    return res.status(200).json({
      success: true,
      message: 'تم حذف المنتج بالكامل بنجاح'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف المنتج'
    });
  }
};
/* =================  attribute ================= */

export const addProductAttribute = async (req, res) => {
  try {
    const { productId } = req.params;
    const { key, value } = req.body;

    if (!key || !value) {
      return res.status(400).json({
        success: false,
        message: 'key و value مطلوبين'
      });
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      {
        $push: {
          attributes: { key, value }
        }
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    res.status(201).json({
      success: true,
      message: 'تمت إضافة الخاصية بنجاح',
      data: product
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ أثناء إضافة الخاصية'
    });
  }
};

export const updateProductAttribute = async (req, res) => {
  try {
    const { productId } = req.params;
    const { attributeId, key, value } = req.body;

    const updateFields = {};
    if (key) updateFields['attributes.$.key'] = key;
    if (value) updateFields['attributes.$.value'] = value;

    const product = await Product.findOneAndUpdate(
      {
        _id: productId,
        'attributes._id': attributeId
      },
      {
        $set: updateFields
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Attribute غير موجود'
      });
    }

    res.status(200).json({
      success: true,
      message: 'تم تحديث الخصائص بنجاح',
      data: product
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ أثناء تحديث الخصائص'
    });
  }
};

export const deleteProductAttribute = async (req, res) => {
  try {
    const { productId, attributeId } = req.params;

    const product = await Product.findByIdAndUpdate(
      productId,
      {
        $pull: {
          attributes: { _id: attributeId }
        }
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'تم حذف الخاصية بنجاح',
      data: product
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ أثناء حذف الخاصية'
    });
  }
};
/* =================  image ================= */
export const addProductImage = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'يجب رفع صورة'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    const newImage = await uploadImage(req.file, 'products');

    product.images.push(newImage);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'تمت إضافة الصورة بنجاح',
      data: product
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ أثناء إضافة الصورة'
    });
  }
};

export const updateProductImage = async (req, res) => {
  try {
    const { productId } = req.params;
    const { imageId } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'يجب رفع صورة جديدة'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }

    const imageIndex = product.images.findIndex(
      img => img._id.toString() === imageId
    );

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'الصورة غير موجودة'
      });
    }

    // حذف الصورة القديمة
    await deleteImage(product.images[imageIndex].public_id);

    // رفع صورة جديدة
    const newImage = await uploadImage(req.file, 'products');

    product.images[imageIndex] = newImage;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'تم تحديث الصورة بنجاح',
      data: product
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ أثناء تحديث الصورة'
    });
  }
};

export const deleteProductImage = async (req, res) => {
  try {
    const { productId, imageId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }

    const image = product.images.find(
      img => img._id.toString() === imageId
    );

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'الصورة غير موجودة'
      });
    }

    // حذف من Cloudinary
    await deleteImage(image.public_id);

    // حذف من DB
    product.images = product.images.filter(
      img => img._id.toString() !== imageId
    );

    await product.save();

    res.status(200).json({
      success: true,
      message: 'تم حذف الصورة بنجاح',
      data: product
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ أثناء حذف الصورة'
    });
  }
};

// seceletions
export const addProductSelection = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, options = [] } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Selection name is required'
      });
    }

    const formattedOptions = options.map(opt => ({ value: opt }));

    const product = await Product.findByIdAndUpdate(
      productId,
      {
        $push: {
          selections: {
            name,
            options: formattedOptions
          }
        }
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Selection added successfully',
      data: product
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding selection'
    });
  }
};

export const updateProductSelection = async (req, res) => {
  try {
    const { productId } = req.params;
    const { selectionId, name } = req.body;

    const product = await Product.findOneAndUpdate(
      {
        _id: productId,
        'selections._id': selectionId
      },
      {
        $set: { 'selections.$.name': name }
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Selection not found'
      });
    }

    res.json({
      success: true,
      message: 'Selection updated',
      data: product
    });

  } catch {
    res.status(500).json({
      success: false,
      message: 'Error updating selection'
    });
  }
};

export const deleteProductSelection = async (req, res) => {
  try {
    const { productId, selectionId } = req.params;

    const product = await Product.findByIdAndUpdate(
      productId,
      {
        $pull: { selections: { _id: selectionId } }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Selection deleted',
      data: product
    });

  } catch {
    res.status(500).json({
      success: false,
      message: 'Error deleting selection'
    });
  }
};

export const addSelectionOption = async (req, res) => {
  try {
    const { productId, selectionId } = req.params;
    const { value } = req.body;

    if (!value) {
      return res.status(400).json({
        success: false,
        message: 'Option value required'
      });
    }

    const product = await Product.findOneAndUpdate(
      {
        _id: productId,
        'selections._id': selectionId
      },
      {
        $push: { 'selections.$.options': { value } }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Option added',
      data: product
    });

  } catch {
    res.status(500).json({
      success: false,
      message: 'Error adding option'
    });
  }
};

export const deleteSelectionOption = async (req, res) => {
  try {
    const { productId, selectionId, optionId } = req.params;

    const product = await Product.findOneAndUpdate(
      {
        _id: productId,
        'selections._id': selectionId
      },
      {
        $pull: {
          'selections.$.options': { _id: optionId }
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Option deleted',
      data: product
    });

  } catch {
    res.status(500).json({
      success: false,
      message: 'Error deleting option'
    });
  }
};

