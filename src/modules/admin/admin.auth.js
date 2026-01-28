import jwt from 'jsonwebtoken';
import Admin from './admin.model.js';

export const protectAdmin = async (req, res, next) => {
  const token = req.cookies?.[process.env.COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ message: 'Admin not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(401).json({ message: 'Admin not found' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid admin token' });
  }
};
