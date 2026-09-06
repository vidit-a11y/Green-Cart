/**
 * setFarmerLocations.ts
 *
 * One-time migration: find all farmer accounts that have no location
 * or whose coordinates are still at [0, 0] (the origin default), and
 * set them to the centre of Jaipur so the $near discovery query works.
 *
 * Usage (from the server/ directory):
 *   npx tsx src/scripts/setFarmerLocations.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from '../models/User.js';

// Jaipur city centre [longitude, latitude]
const JAIPUR_COORDS: [number, number] = [75.7873, 26.9124];

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌  MONGO_URI is not set — check your .env file');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('✅  Connected to MongoDB');

  // Match farmers that:
  //   a) have no location field at all, OR
  //   b) have coordinates exactly [0, 0]
  const filter = {
    role: 'farmer',
    $or: [
      { location: { $exists: false } },
      { location: null },
      { 'location.coordinates': { $size: 0 } },
      { 'location.coordinates': [0, 0] },
    ],
  };

  const farmers = await User.find(filter).select('_id name email location');
  console.log(`\n🔍  Found ${farmers.length} farmer(s) with missing / [0,0] location\n`);

  if (farmers.length === 0) {
    console.log('Nothing to update — all farmers already have valid coordinates.');
    await mongoose.disconnect();
    return;
  }

  for (const farmer of farmers) {
    console.log(
      `   → ${farmer.name} (${farmer.email}) — current: ${
        farmer.location
          ? JSON.stringify(farmer.location.coordinates)
          : 'none'
      }`
    );
  }

  const farmerIds = farmers.map((f) => f._id);
  const result = await User.updateMany(
    { _id: { $in: farmerIds } },
    {
      $set: {
        location: {
          type: 'Point',
          coordinates: JAIPUR_COORDS,
        },
      },
    }
  );

  console.log(`\n✅  Updated ${result.modifiedCount} farmer(s) to Jaipur [${JAIPUR_COORDS}]`);
  console.log('\n💡  Remember: farmers should set their real location via the');
  console.log('    Settings → "Set My Farm Location" button in the app.\n');

  await mongoose.disconnect();
  console.log('Disconnected. Done.');
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
