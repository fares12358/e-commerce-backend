import { deleteImage, uploadImage } from "../../utils/cloudinary.js";
import Ad from "./ads.model.js";

export const createAd = async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ success: false, message: "الصورة مطلوبة" });

        const uploaded = await uploadImage(req.file, "ads");

        const ad = await Ad.create({
            title: req.body.title,
            description: req.body.description,
            tag: req.body.tag,
            image: {
                url: uploaded.url,
                public_id: uploaded.public_id
            },
            link: req.body.link
        });

        res.status(201).json({ success: true, data: ad });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: "فشل إنشاء الإعلان"
        });
    }
};

export const getAds = async (req, res) => {
    try {
        const ads = await Ad.find({ isActive: true }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: ads
        });

    } catch {
        res.status(500).json({
            success: false,
            message: "فشل تحميل الإعلانات"
        });
    }
};

export const getAdById = async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id);

        if (!ad)
            return res.status(404).json({ success: false, message: "غير موجود" });

        res.status(200).json({ success: true, data: ad });

    } catch {
        res.status(500).json({
            success: false,
            message: "فشل تحميل الإعلان"
        });
    }
};

export const updateAd = async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id);

        if (!ad)
            return res.status(404).json({ success: false, message: "غير موجود" });

        // Update image if new one uploaded
        if (req.file) {
            await deleteImage(ad.image.public_id);

            const uploaded = await uploadImage(req.file, "ads");

            ad.image = {
                url: uploaded.url,
                public_id: uploaded.public_id
            };
        }

        ad.title = req.body.title || ad.title;
        ad.description = req.body.description || ad.description;
        ad.tag = req.body.tag || ad.tag;
        ad.link = req.body.link || ad.link;


        await ad.save();

        res.status(200).json({
            success: true,
            data: ad
        });

    } catch {
        res.status(500).json({
            success: false,
            message: "فشل تحديث الإعلان"
        });
    }
};

export const deleteAd = async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id);

        if (!ad)
            return res.status(404).json({ success: false, message: "غير موجود" });

        await deleteImage(ad.image.public_id);
        await ad.deleteOne();

        res.status(200).json({
            success: true,
            message: "تم حذف الإعلان بنجاح"
        });

    } catch {
        res.status(500).json({
            success: false,
            message: "فشل حذف الإعلان"
        });
    }
};

