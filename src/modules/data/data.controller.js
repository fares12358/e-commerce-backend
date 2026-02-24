import Config from "../admin/config.model.js";
import Content from "../admin/content.modle.js";
import Ad from "../ads/ads.model.js";
import Category from "../category/category.model.js";
import Product from "../product/product.model.js";
export const getWebsiteInitData = async (req, res) => {
    try {
        const [content, config, categories, ads] = await Promise.all([
            Content.findOne(),
            Config.findOne(),
            Category.find({ isActive: true }).sort({ createdAt: -1 }),
            Ad.find({ isActive: true }).sort({ createdAt: -1 })
        ]);

        const featuredProducts = await Product.aggregate([
            { $match: { isActive: true, isFeatured: true } },
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "category"
                }
            },
            { $unwind: "$category" },
            { $match: { "category.isActive": true } },
            { $sort: { createdAt: -1 } },
            { $limit: 15 }
        ]);

        const newProducts = await Product.aggregate([
            { $match: { isActive: true } },
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "category"
                }
            },
            { $unwind: "$category" },
            { $match: { "category.isActive": true } },
            { $sort: { createdAt: -1 } },
            { $limit: 20 }
        ]);

        return res.status(200).json({
            success: true,
            data: {
                content,
                config,
                categories,
                featuredProducts,
                newProducts,
                ads
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error loading website data"
        });
    }
};