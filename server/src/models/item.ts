
import mongoose from 'mongoose';


const itemSchema = new mongoose.Schema({

  name: String,
  description: String,
  price: Number,
  quantity: Number,
  category: String,
  unit: String,
  images: [String],    // check the type in db
  farmerId: String,    // int
  farmerName: String,
  location: String,
  isAvailable: Boolean,
  rating: Number,
  reviewsCount: Number

});

export const Item = mongoose.model('Item', itemSchema, 'products');


