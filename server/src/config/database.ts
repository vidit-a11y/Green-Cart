import dns from 'node:dns';
import mongoose from 'mongoose';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

dns.setServers(['8.8.8.8', '1.1.1.1']);

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const connectDatabase = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        family: 4,
      });
      console.log('✅ GreenCart Database Connected!');
      return;
    } catch (error) {
      console.error(`❌ MongoDB Connection Error (attempt ${attempt}/${MAX_RETRIES}):`, error);

      if (attempt < MAX_RETRIES) {
        await wait(RETRY_DELAY_MS);
      }
    }
  }

  console.error('❌ MongoDB connection failed after maximum retries. Server will continue running.');
};
