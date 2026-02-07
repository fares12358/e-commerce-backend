import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },

    items: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        selections: [
          {
            name: String,      // "Color"
            value: String     // "Red"
          }
        ]
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model('Cart', cartSchema);
