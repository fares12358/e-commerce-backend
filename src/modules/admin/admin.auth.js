import jwt from 'jsonwebtoken';
import Admin from './admin.model.js';

export const protectAdmin = async (req, res, next) => {
  // Use the dedicated admin cookie — separate from the user cookie (COOKIE_NAME)
  // so that opening the dashboard and frontend in the same browser doesn't cause
  // the cookies to collide (both apps run on localhost, so the domain is the same).
  const adminCookieName = process.env.ADMIN_COOKIE_NAME || 'ksk_admin';
  const token = req.cookies?.[adminCookieName];

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
