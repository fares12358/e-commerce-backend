import mongoose from 'mongoose';
import crypto from 'crypto';

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

adminSchema.methods.getResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 min

  return resetToken;
};

export default mongoose.model('Admin', adminSchema);
