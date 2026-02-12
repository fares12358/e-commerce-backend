import Config from "../admin/config.model.js";
import Content from "../admin/content.modle.js";
import Ad from "../ads/ads.model.js";
import Category from "../category/category.model.js";
import Product from "../product/product.model.js";

export const getWebsiteInitData = async (req, res) => {
    try {
        const [
            content,
            config,
            categories,
            featuredProducts,
            newProducts,
            ads
        ] = await Promise.all([
            Content.findOne(),
            Config.findOne(),
            Category.find({ isActive: true }).sort({ createdAt: -1 }),
            Product.find(
                { isActive: true, isFeatured: true }
                ,
              
            )
                .populate("categoryId", "name")
                .sort({ createdAt: -1 })
                .limit(15),
            // ✅ New products (last 20)
            Product.find(
                { isActive: true },
            )
                .populate("categoryId", "name")
                .sort({ createdAt: -1 })
                .limit(20),
            Ad.find({ isActive: true }).sort({ createdAt: -1 })
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