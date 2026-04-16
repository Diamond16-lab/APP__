import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions, verifySessionToken } from '../utils/auth.js';

const router = Router();

function serializeUser(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    displayName: user.displayName,
    employeeNumber: user.employeeNumber,
  };
}

router.post('/login', async (req, res) => {
  const username = String(req.body?.username || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const user = await User.findOne({ username });

  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const token = createSessionToken({
    id: user._id.toString(),
    username: user.username,
  });

  res.cookie(SESSION_COOKIE, token, sessionCookieOptions());

  return res.json({ user: serializeUser(user) });
});

router.post('/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE);
  return res.status(204).send();
});

router.get('/session', async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) {
    return res.status(200).json({ user: null });
  }

  try {
    const payload = verifySessionToken(token);
    const user = await User.findById(payload.sub);

    if (!user || !user.isActive) {
      res.clearCookie(SESSION_COOKIE);
      return res.status(200).json({ user: null });
    }

    return res.json({ user: serializeUser(user) });
  } catch {
    res.clearCookie(SESSION_COOKIE);
    return res.status(200).json({ user: null });
  }
});

export default router;
