import Cart from './cart.model.js';
import Product from '../product/product.model.js';

/* ================= GET MY CART ================= */
export const getMyCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id })
      .populate('items.productId');

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'السلة فارغة',
        data: { items: [] }
      });
    }

    const items = cart.items.map(item => {
      const product = item.productId;

      return {
        itemId: item._id, // ✅ ID الحقيقي للسلة
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.images?.[0]?.url || null,
        stock: product.stock,
        quantity: item.quantity,
        selections: item.selections
      };
    });

    return res.status(200).json({
      success: true,
      message: 'تم جلب السلة',
      data: { items }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب السلة'
    });
  }
};



/* ================= ADD TO CART ================= */
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, selections = [] } = req.body;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'الكمية غير صحيحة'
      });
    }

    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: 'الكمية المطلوبة غير متاحة'
      });
    }

    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        userId: req.user._id,
        items: []
      });
    }

    // ترتيب selections لمنع اختلاف الترتيب
    const sortedSelections = [...selections].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    const existingItem = cart.items.find(item =>
      item.productId.toString() === productId &&
      JSON.stringify(item.selections) === JSON.stringify(sortedSelections)
    );

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;

      if (newQty > product.stock) {
        return res.status(400).json({
          success: false,
          message: 'الكمية المطلوبة غير متاحة'
        });
      }

      existingItem.quantity = newQty;
    } else {
      cart.items.push({
        productId,
        quantity,
        selections: sortedSelections
      });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'تمت إضافة المنتج إلى السلة'
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إضافة المنتج'
    });
  }
};



/* ================= UPDATE CART ITEM ================= */
export const updateCartItem = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;

    if (!itemId || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة'
      });
    }

    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'السلة فارغة'
      });
    }

    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'العنصر غير موجود في السلة'
      });
    }

    const product = await Product.findById(item.productId);

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: 'الكمية المطلوبة غير متاحة'
      });
    }

    item.quantity = quantity;

    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'تم تحديث الكمية'
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء التحديث'
    });
  }
};



/* ================= REMOVE FROM CART ================= */
export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'السلة فارغة'
      });
    }


    const exists = cart.items.id(itemId);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: 'العنصر غير موجود'
      });
    }

    cart.items = cart.items.filter(
      item => item._id.toString() !== itemId
    );

    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'تم حذف العنصر من السلة'
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء الحذف'
    });
  }
};



/* ================= CLEAR CART ================= */
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'السلة فارغة بالفعل'
      });
    }

    cart.items = [];
    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'تم تفريغ السلة بالكامل'
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تفريغ السلة'
    });
  }
};
