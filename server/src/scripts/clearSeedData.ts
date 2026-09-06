import dns from 'node:dns';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';

dotenv.config();
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function clearSeedData() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    family: 4,
  });

  const farmers = await User.find({ role: 'farmer' }).select('_id name email').lean();
  const realFarmerIds = farmers.map((farmer) => farmer._id.toString());

  const totalBefore = await Product.countDocuments();
  const realBefore = await Product.countDocuments({ farmerId: { $in: realFarmerIds } });
  const fakeBefore = await Product.countDocuments({ farmerId: { $nin: realFarmerIds } });

  const deleteResult = await Product.deleteMany({ farmerId: { $nin: realFarmerIds } });
  const totalAfter = await Product.countDocuments();

  console.log('Seed data cleanup complete');
  console.log(`Registered farmers found: ${farmers.length}`);
  console.log(`Products before cleanup: ${totalBefore}`);
  console.log(`Real products before cleanup: ${realBefore}`);
  console.log(`Seed/fake products found: ${fakeBefore}`);
  console.log(`Seed/fake products deleted: ${deleteResult.deletedCount ?? 0}`);
  console.log(`Real products remaining: ${totalAfter}`);
}

clearSeedData()
  .catch((error) => {
    console.error('Seed data cleanup failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
