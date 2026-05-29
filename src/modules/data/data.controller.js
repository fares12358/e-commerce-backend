import Config from "../admin/config.model.js";
import Content from "../admin/content.modle.js";
import Ad from "../ads/ads.model.js";
import Category from "../category/category.model.js";
import Product from "../product/product.model.js";
import Controllers from "../contorlles/contorlles.model.js";

/* ─────────────────────────────────────────────
   PHASE 1 — Shell Data  (fast, tiny queries)
   GET /api/data/shell
   Returns: config · content · categories · ads
   Used by: Navbar currency symbol, AdsSlider,
            CategorySlider, Footer social links
───────────────────────────────────────────── */
export const getShellData = async (req, res) => {
    try {
        const [content, config, categories, ads, controllers] = await Promise.all([
            Content.findOne().lean(),
            Config.findOne().lean(),
            Category.find({ isActive: true }).sort({ createdAt: -1 }).lean(),
            Ad.find({ isActive: true }).sort({ createdAt: -1 }).lean(),
            Controllers.findOne().select('refund').lean(),  // [v1.0.4] expose refund flag to frontend
        ]);

        // Merge the refund flag into config so the frontend can read it as setupData.config.refundEnabled
        const configWithFlags = config
            ? { ...config, refundEnabled: controllers?.refund ?? false }
            : { refundEnabled: false };

        return res.status(200).json({
            success: true,
            data: { content, config: configWithFlags, categories, ads },
        });
    } catch (error) {
        console.error("getShellData error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error loading shell data",
        });
    }
};

/* ─────────────────────────────────────────────
   PHASE 2 — Products Data  (heavier aggregations)
   GET /api/data/products
   Returns: featuredProducts · newProducts
   Runs BOTH aggregations in parallel (was sequential before)
   No redundant $lookup — active-category filter is
   applied in the same pipeline but both pipelines
   are fired simultaneously via Promise.all
───────────────────────────────────────────── */
export const getProductsData = async (req, res) => {
    try {
        const productPipeline = (extraMatch = {}) => [
            { $match: { isActive: true, ...extraMatch } },
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "category",
                },
            },
            { $unwind: "$category" },
            { $match: { "category.isActive": true } },
            { $sort: { createdAt: -1 } },
        ];

        // ✅ Both aggregations run in PARALLEL — was sequential before
        const [featuredProducts, newProducts] = await Promise.all([
            Product.aggregate([...productPipeline({ isFeatured: true }), { $limit: 15 }]),
            Product.aggregate([...productPipeline(), { $limit: 20 }]),
        ]);

        return res.status(200).json({
            success: true,
            data: { featuredProducts, newProducts },
        });
    } catch (error) {
        console.error("getProductsData error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error loading products data",
        });
    }
};

/* ─────────────────────────────────────────────
   LEGACY — Full Init Data (kept for compatibility)
   GET /api/data
   Merges both phases in one response.
   Still used by other pages that call getSetupData()
───────────────────────────────────────────── */
export const getWebsiteInitData = async (req, res) => {
    try {
        const [content, config, categories, ads] = await Promise.all([
            Content.findOne().lean(),
            Config.findOne().lean(),
            Category.find({ isActive: true }).sort({ createdAt: -1 }).lean(),
            Ad.find({ isActive: true }).sort({ createdAt: -1 }).lean(),
        ]);

        const productPipeline = (extraMatch = {}) => [
            { $match: { isActive: true, ...extraMatch } },
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "category",
                },
            },
            { $unwind: "$category" },
            { $match: { "category.isActive": true } },
            { $sort: { createdAt: -1 } },
        ];

        // ✅ Also parallelised here
        const [featuredProducts, newProducts] = await Promise.all([
            Product.aggregate([...productPipeline({ isFeatured: true }), { $limit: 15 }]),
            Product.aggregate([...productPipeline(), { $limit: 20 }]),
        ]);

        return res.status(200).json({
            success: true,
            data: { content, config, categories, featuredProducts, newProducts, ads },
        });
    } catch (error) {
        console.error("getWebsiteInitData error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error loading website data",
        });
    }
};
