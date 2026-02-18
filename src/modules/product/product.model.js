import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    /* ===== Basic Info ===== */
    name: {
      type: String,
      required: true,
      trim: true
    },
    productNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },


    description: {
      type: String
    },

    price: {
      type: Number,
      required: true
    },

    comparePrice: {
      type: Number
    },

    sku: {
      type: String
    },

    stock: {
      type: Number,
      default: 0
    },

    /* ===== Category ===== */
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },

    /* ===== Images ===== */
    images: [
      {
        url: String,
        public_id: String
      }
    ],

    attributes: [
      {
        key: {
          type: String,
          required: true,
        },
        value: {
          type: String,
          required: true,
        }
      }
    ],

    selections: [
      {
        name: {
          type: String,
          required: true,
        },
        options: [
          {
            value: {
              type: String,
              required: true,
            }
          }
        ]
      }
    ],

    /* ===== Admin Control ===== */
    isActive: {
      type: Boolean,
      default: true
    },

    isFeatured: {
      type: Boolean,
      default: false
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    }
  },
  { timestamps: true }
);
// 🔍 search index (name only)
productSchema.index({
  name: "text"
});

export default mongoose.model('Product', productSchema);
