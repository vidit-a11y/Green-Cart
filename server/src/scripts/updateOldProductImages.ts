import dns from 'node:dns';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';

dotenv.config();
dns.setServers(['8.8.8.8', '1.1.1.1']);

const categoryPlaceholders: Record<string, string> = {
  Vegetables: 'vegetable placeholder needed',
  Fruits: 'fruit placeholder needed',
  Dairy: 'dairy placeholder needed',
  'Grains & Pulses': 'grains placeholder needed',
  Spices: 'spices placeholder needed',
  'Dry Fruits': 'dry fruits placeholder needed',
  'Organic Honey': 'honey placeholder needed',
  'Fresh Herbs': 'herbs placeholder needed',
  'Cold Pressed Oils': 'oil bottle placeholder needed',
};

async function reportOldProductImages() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    family: 4,
  });

  const products = await Product.find({
    $or: [
      { imageUrl: { $exists: false } },
      { imageUrl: null },
      { imageUrl: '' },
    ],
  })
    .select('_id name category farmerId farmerName images imageUrl')
    .lean();

  console.log(`Products missing imageUrl: ${products.length}`);

  if (products.length === 0) {
    return;
  }

  for (const product of products) {
    const category = product.category || 'Other';
    const suggestion = categoryPlaceholders[category] || 'generic food placeholder needed';
    console.log(
      [
        `- ${product.name}`,
        `id=${product._id}`,
        `category=${category}`,
        `farmer=${product.farmerName || product.farmerId || 'unknown'}`,
        `suggestion=${suggestion}`,
      ].join(' | '),
    );
  }

  console.log('No database updates were made. Farmers can edit these products and upload real Cloudinary images.');
}

reportOldProductImages()
  .catch((error) => {
    console.error('Old product image report failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
