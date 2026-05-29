import mongoose from 'mongoose';

const configSchema = new mongoose.Schema(
    {
        vat: { type: Number, default: 0 },
        sendTime: { type: Number, default: 0, min: [0, 'Send time must be positive'] },
        contact: {
            email: { type: String, required: true },
            phone: { type: String, required: true },
            whatsappLink: { type: String, default: '' },
        },
        telegramBotToken: {
            type: String,
            default: null,
        },
        telegramChatId: {
            type: String,
            default: null,
        },
        address: { type: String, default: '' },
        shipment: { type: String, default: '' },
        socialMedia: {
            facebook: { type: String, default: '' },
            twitter: { type: String, default: '' },
            instagram: { type: String, default: '' },
            youtube: { type: String, default: '' },
            telegram: { type: String, default: '' },
            tiktok: { type: String, default: '' },
        },
        simple: { type: String, default: '' },
        term: { type: String, default: '' },

        /* [v1.0.4] Number of days after delivery within which a user
           may submit a refund request. 0 = disabled (no window limit
           beyond the feature flag). Admin sets this in Profile → Store Settings. */
        refundWindowDays: { type: Number, default: 7, min: 0 },
    },
    { timestamps: true }
);

export default mongoose.model('Config', configSchema);
