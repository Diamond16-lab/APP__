import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

// Deliberate: production seeds the same demo admin as local, so both environments behave
// identically. Safe only because this is a portfolio demo with fictitious data — see the note
// in src/pages/LoginPage.jsx before pointing this at anything real.
export async function seedDefaultUser() {
  const usersCount = await User.countDocuments();
  if (usersCount > 0) return;

  const passwordHash = await bcrypt.hash(env.seedPassword, 10);

  await User.create({
    username: env.seedUsername.toLowerCase(),
    passwordHash,
    displayName: env.seedDisplayName,
    employeeNumber: env.seedEmployeeNumber,
    isActive: true,
  });

  console.log(`Default user created: ${env.seedUsername}`);
}
