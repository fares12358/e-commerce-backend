import mongoose from 'mongoose';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    /* ===== Basic Info ===== */
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },

    password: {
      type: String,
      required: true,
    },

    phone: {
      type: String
    },

    /* ===== Address (Basic – expandable later) ===== */
    address: {
      city: String,
      street: String,
      notes: String
    },

    locations: [
      {
        locationDescription: {
          type: String,
          required: true,
          trim: true
        },
        country: {
          type: String,
          required: true
        },
        city: {
          type: String,
          required: true
        },
        government: {
          type: String,
          required: true
        },
        locationLink: {
          type: String
        },
        strName: {
          type: String
        },
        phone: {
          type: String,
          required: true
        },
        default: {
          type: Boolean,
          default: false
        }
      }
    ],

    /* ===== Orders Reference ===== */
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
      }
    ],

    /* ===== Account Control ===== */
    isActive: {
      type: Boolean,
      default: true
    },

    /* ===== Reset Password ===== */
    resetPasswordToken: String,
    resetPasswordExpire: Date
  },
  { timestamps: true }
);

/* ===== Reset Password Token ===== */
userSchema.methods.getResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

export default mongoose.model('User', userSchema);
