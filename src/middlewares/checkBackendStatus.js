import Controllers from "../modules/contorlles/contorlles.model.js";

export const checkBackendStatus = async (req, res, next) => {
  try {
    // Assuming you have only ONE controller document
    const controller = await Controllers.findOne().lean();
    if (!controller) {
      return res.status(500).json({
        success: false,
        message: "System configuration not found",
      });
    }
    if (!controller.backendStats) {
      return res.status(500).json({
        success: false,
        message: "Server is offline",
      });
    }
    // If backendStats === true
    next();
  } catch (error) {
    console.error("Backend status middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Server status check failed",
    });
  }
};