import crypto from "crypto";

export const verifyOwnerServer = (req, res, next) => {
  const apiKey = req.headers["x-owner-key"];

  if (!apiKey) {
    return res.status(401).json({ message: "Owner key missing" });
  }

  const validKey = process.env.OWNER_SECRET_KEY;

  const isValid =
    apiKey.length === validKey.length &&
    crypto.timingSafeEqual(
      Buffer.from(apiKey),
      Buffer.from(validKey)
    );

  if (!isValid) {
    return res.status(403).json({ message: "Invalid owner key" });
  }

  next();
};