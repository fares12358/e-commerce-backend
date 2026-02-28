import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    adminChatId: {
      type: String,
      default: ''
    },
    telegramEnabled: {
      type: Boolean,
      default: false,
    },
    notifyOnNewOrder: {
      type: Boolean,
      default: false,
    },
    notifySound: {
      type: Boolean,
      default: true,
    },
    sectionNotify: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);