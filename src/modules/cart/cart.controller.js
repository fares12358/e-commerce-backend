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


    if (quantity <= 0) {
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

    const itemIndex = cart.items.findIndex(item =>
      item.productId.toString() === productId &&
      JSON.stringify(item.selections) === JSON.stringify(selections)
    );


    if (itemIndex > -1) {
      const newQuantity = cart.items[itemIndex].quantity + quantity;

      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: 'الكمية المطلوبة غير متاحة'
        });
      }

      cart.items[itemIndex].quantity = newQuantity;
    } else {
      cart.items.push({ productId, quantity, selections });
    }
    
    selections.sort((a, b) => a.name.localeCompare(b.name));

    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'تمت إضافة المنتج إلى السلة'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إضافة المنتج'
    });
  }
};

/* ================= UPDATE CART ITEM ================= */
export const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity, selections } = req.body;

    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'الكمية غير صحيحة'
      });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'السلة فارغة'
      });
    }

    const itemIndex = cart.items.findIndex(item =>
      item.productId.toString() === productId &&
      JSON.stringify(item.selections) === JSON.stringify(selections)
    );


    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود في السلة'
      });
    }

    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
      await cart.save();

      return res.status(200).json({
        success: true,
        message: 'تم حذف المنتج من السلة'
      });
    }

    const product = await Product.findById(productId);
    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: 'الكمية المطلوبة غير متاحة'
      });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'تم تحديث السلة'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث السلة'
    });
  }
};

/* ================= REMOVE FROM CART ================= */
export const removeFromCart = async (req, res) => {
  try {
    const { productId, selections } = req.params;

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'السلة فارغة'
      });
    }

    cart.items = cart.items.filter(item =>
      !(
        item.productId.toString() === productId &&
        JSON.stringify(item.selections) === JSON.stringify(selections)
      )
    );

    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'تم حذف المنتج من السلة',
      data: cart
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف المنتج'
    });
  }
};
