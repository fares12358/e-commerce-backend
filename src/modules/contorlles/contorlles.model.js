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

    invoice: {
      type: Boolean,
      default: false,
    },

    /* [v1.0.4] Master switch for the refund feature.
       When false: POST /orders/:id/refund returns 403.
       Admin toggles this in Profile → Store Settings. */
    refund: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Controllers = mongoose.model("Controllers", controllersSchema);

export default Controllers;
