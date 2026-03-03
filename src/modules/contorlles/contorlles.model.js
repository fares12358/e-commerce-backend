import mongoose from "mongoose";

const controllersSchema = new mongoose.Schema(
  {
    maxProductNumber: {
      type: Number,
      required: true,
      default: 0,
    },

    backendStats: {
      type: Boolean,
      default: false,
    },

    dashboardLocker: {
      type: Boolean,
      default: false,
    },

    websiteLocker: {
      type: Boolean,
      default: false,
    },

    telegramBot: {
      type: Boolean,
      default: false,
    },

    notification: {
      type: Boolean,
      default: false,
    },

    emailNotify: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // auto createdAt & updatedAt
  }
);

const Controllers = mongoose.model("Controllers", controllersSchema);

export default Controllers;