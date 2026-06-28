import { MongoMemoryServer } from 'mongodb-memory-server';

console.log('Pre-downloading MongoDB binary (one-time, ~781MB)...');
const server = await MongoMemoryServer.create();
console.log('Binary ready. Stopping test instance...');
await server.stop();
console.log('Done. Future test runs will use the cached binary.');
