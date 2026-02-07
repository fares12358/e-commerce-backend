import mongoose from "mongoose";

const adSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true
        },
        tag: {
            type: String,
            trim: true,
            maxlength: 30,
            default: ""
        },
        image: {
            url: { type: String, required: true },
            public_id: { type: String, required: true }
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

export default mongoose.model("Ad", adSchema);
