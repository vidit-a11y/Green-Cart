import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// 1. Load the environment variables from your .env file
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "";

// 2. The Connection Logic
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ GreenCart Database Connected!"))
  .catch((err) => console.error(" MongoDB Connection Error:", err));

// 3. Simple test route
app.get('/', (req: Request, res: Response) => {
  res.send('GreenCart Backend is Live and Connected to MongoDB!');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});