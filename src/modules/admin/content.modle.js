import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true }
}, { _id: true });

const contentSchema = new mongoose.Schema(
    {
        aboutUs: {
            title: { type: String, default: 'من نحن' },
            description: { type: String, default: '' },
            secondaryDescription: { type: String, default: '' }
        },
        vision: {
            title: { type: String, default: 'رؤيتنا' },
            description: { type: String, default: '' }
        },
        mission: {
            title: { type: String, default: 'مهمتنا' },
            description: { type: String, default: '' }
        },
        termsOfUse: [sectionSchema],
        privacyPolicy: [sectionSchema]
    },
    { timestamps: true }
);

export default mongoose.model('Content', contentSchema);