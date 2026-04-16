import { User } from '../models/User.js';
import { SESSION_COOKIE, verifySessionToken } from '../utils/auth.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const payload = verifySessionToken(token);
    const user = await User.findById(payload.sub).lean();

    if (!user || !user.isActive) {
      res.clearCookie(SESSION_COOKIE);
      return res.status(401).json({ message: 'Session is no longer valid.' });
    }

    req.user = {
      id: user._id.toString(),
      username: user.username,
      displayName: user.displayName,
      employeeNumber: user.employeeNumber,
    };

    return next();
  } catch {
    res.clearCookie(SESSION_COOKIE);
    return res.status(401).json({ message: 'Invalid session.' });
  }
}
