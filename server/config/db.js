import dns from 'node:dns';
import mongoose from 'mongoose';

const ATLAS_PUBLIC_DNS = ['8.8.8.8', '1.1.1.1'];
const CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 10000,
};

function shouldRetryWithPublicDns(mongoUri, error) {
  return (
    mongoUri.startsWith('mongodb+srv://') &&
    error?.code === 'ECONNREFUSED' &&
    typeof error?.hostname === 'string' &&
    error.hostname.startsWith('_mongodb._tcp.')
  );
}

export async function connectToDatabase(mongoUri) {
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(mongoUri, CONNECT_OPTIONS);
  } catch (error) {
    if (!shouldRetryWithPublicDns(mongoUri, error)) {
      throw error;
    }

    dns.setServers(ATLAS_PUBLIC_DNS);
    await mongoose.disconnect().catch(() => {});
    await mongoose.connect(mongoUri, CONNECT_OPTIONS);
  }
}
