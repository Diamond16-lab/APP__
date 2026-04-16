import { createServerApp } from './app.js';
import { connectToDatabase } from './config/db.js';
import { assertEnv, env } from './config/env.js';
import { seedDefaultUser } from './utils/seedDefaultUser.js';

async function start() {
  assertEnv();
  await connectToDatabase(env.mongoUri);
  await seedDefaultUser();

  const app = createServerApp();
  app.listen(env.port, () => {
    console.log(`API server listening on http://127.0.0.1:${env.port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server');
  console.error(error);
  process.exit(1);
});
