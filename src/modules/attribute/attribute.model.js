import mongoose from 'mongoose';

const attributeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    key: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    // مثال: text | number | boolean
    type: {
      type: String,
      enum: ['text', 'number', 'boolean'],
      default: 'text'
    },

    // هل دي خاصية جاهزة ولا الأدمن أضافها
    isDefault: {
      type: Boolean,
      default: false
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('Attribute', attributeSchema);
