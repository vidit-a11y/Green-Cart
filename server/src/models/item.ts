
import mongoose from 'mongoose';
import { it } from 'node:test';

const itemSchema = new mongoose.Schema({

  name: String,
  description: String,
  price: Number,
  quantity: Number,
  category: String,
  unit: String,
  images: [String],
  farmerId: String,
  farmerName: String,
  location: String,
  isAvailable: Boolean,
  rating: Number,
  reviewsCount: Number

});

export const Item = mongoose.model('Item', itemSchema,'products');


