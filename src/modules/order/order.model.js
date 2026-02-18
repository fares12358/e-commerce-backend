import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product'
        },
        name: String,
        price: Number,
        attributes: Array,
        selections: [
          { name: String, value: String }
        ],
        quantity: Number
      }
    ],

    totalPrice: {
      type: Number,
      required: true
    },

    shippingFee: {
      type: String,
      default: ''
    },

    paymentMethod: {
      type: String,
      enum: ['cash'],
      default: 'cash'
    },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    cancelledAt: {
      type: Date,
      default: null
    }

  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
