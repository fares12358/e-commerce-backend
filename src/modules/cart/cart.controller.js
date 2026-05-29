import Cart from './cart.model.js';
import Product from '../product/product.model.js';

/* ================= GET MY CART ================= */
export const getMyCart = async (req, res) => {
  try {
    // .lean() returns plain JS object — faster serialization, lower memory
    const cart = await Cart.findOne({ userId: req.user._id })
      .populate({
        path: 'items.productId',
        select: 'name price images stock isActive',   // only fetch what we need
      })
      .lean();

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'السلة فارغة',
        data: { items: [] }
      });
    }

    // Filter out any cart items whose product was deleted or deactivated
    const items = cart.items
      .filter(item => item.productId && item.productId.isActive)
      .map(item => {
        const product = item.productId;
        return {
          itemId: item._id,
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
    console.error('getMyCart error:', error);
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

    const product = await Product.findById(productId).lean();

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

    // Sort selections to prevent false duplicate detection due to key order differences
    const sortedSelections = [...selections].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    // findOne without .lean() because we need to call .save()
    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        userId: req.user._id,
        items: []
      });
    }

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
    console.error('addToCart error:', error);
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

    // Use .lean() for the stock check — read-only, no need for full document
    const product = await Product.findById(item.productId).select('stock').lean();

    if (!product) {
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

    item.quantity = quantity;
    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'تم تحديث الكمية'
    });

  } catch (err) {
    console.error('updateCartItem error:', err);
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
    console.error('removeFromCart error:', err);
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
    console.error('clearCart error:', err);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تفريغ السلة'
    });
  }
};
