import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import itemRoutes from './routes/itemRoutes.js';

// 1. Load config FIRST (so the database URI is ready)
dotenv.config();

// 2. Create the app SECOND (Now 'app' is born!)
const app = express();

// 3. Setup Middlewares THIRD
app.use(cors());
app.use(express.json());

// 4. Use your Routes FOURTH (Now 'app' exists, so this won't crash)
app.use('/api/items', itemRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "";

// 5. Connect to the Database
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ GreenCart Database Connected!"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// 6. Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

