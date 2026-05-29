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
    },

    /* ── [v1.0.5] Refund sub-document ───────────────────────────
       Full 5-step refund lifecycle:

       'none'             → no refund request (default)
       'requested'        → user submitted a request, awaiting admin review
       'approved'         → admin approved, waiting for user to ship product back
       'product_received' → admin confirmed product was received, will refund money
       'money_refunded'   → admin confirmed money was sent back to user — DONE
       'rejected'         → admin rejected the request

       Flow:
         User:  none → requested
         Admin: requested → approved | rejected
         Admin: approved → product_received   (product returned by user)
         Admin: product_received → money_refunded  (money sent to user)
    ─────────────────────────────────────────────────────────── */
    refund: {
      status: {
        type: String,
        enum: [
          'none',
          'requested',
          'approved',
          'product_received',
          'money_refunded',
          'rejected',
        ],
        default: 'none'
      },
      reason: {
        type: String,
        default: ''
      },
      requestedAt: {
        type: Date,
        default: null
      },
      resolvedAt: {
        type: Date,
        default: null
      },
      adminNote: {
        type: String,
        default: ''
      },
      stockRestored: {
        type: Boolean,
        default: false
      },
      productReceivedAt: {
        type: Date,
        default: null
      },
      moneyRefundedAt: {
        type: Date,
        default: null
      },
      /* [v1.0.7] Actual amount refunded — may be less than totalPrice.
         Admin enters this manually when confirming money was sent. */
      refundedAmount: {
        type: Number,
        default: null
      },
    }
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
