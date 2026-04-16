import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const SESSION_COOKIE = 'rt_session';

export function createSessionToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
    },
    env.jwtSecret,
    { expiresIn: '7d' },
  );
}

export function verifySessionToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}
