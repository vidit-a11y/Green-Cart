
import mongoose from 'mongoose';

const farmerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  cropType: [String],
  trustScore: { type: Number, default: 0 }
});

export const Farmer = mongoose.model('farmer', farmerSchema);

