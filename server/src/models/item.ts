
import mongoose from 'mongoose';
import { it } from 'node:test';

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  cropType: [String],
  trustScore: { type: Number, default: 0 }
});

export const Item = mongoose.model('Item', itemSchema);


