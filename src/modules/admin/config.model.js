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
        address: { type: String, default: '' }, // Added address
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
        term: { type: String, default: '' }
    },
    { timestamps: true }
);

export default mongoose.model('Config', configSchema);