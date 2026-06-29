import { connectToDatabase } from '../server/config/db.js';
import { seedDefaultUser } from '../server/utils/seedDefaultUser.js';
import { createServerApp } from '../server/app.js';
import { assertEnv } from '../server/config/env.js';

let cachedApp;

async function getApp() {
  if (!cachedApp) {
    assertEnv();
    await connectToDatabase(process.env.MONGODB_URI);
    await seedDefaultUser();
    cachedApp = createServerApp();
  }
  return cachedApp;
}

export default async function handler(req, res) {
  const app = await getApp();
  app(req, res);
}
