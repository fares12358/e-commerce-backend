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

    SmtpServer: {
      type: Boolean,
      default: false,
    },
    email: {
      type: String,
      default: '',
    },
    appPassword: {
      type: String,
      default: '',
    },
    host: {
      type: String,
      default: '',
    },
    port: {
      type: String,
      default: '',
    },
    secure: {
      type: Boolean,
      default: false,
    },

  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);