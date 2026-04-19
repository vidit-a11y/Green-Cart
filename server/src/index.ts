// import cors from 'cors';
// import dotenv from 'dotenv';
// import express from 'express';
// import mongoose from 'mongoose';
// import itemRoutes from './routes/itemRoutes.js';

// // 1. Load config FIRST (so the database URI is ready)
// dotenv.config();

// // 2. Create the app SECOND (Now 'app' is born!)
// const app = express();

// // 3. Setup Middlewares THIRD
// app.use(cors());
// app.use(express.json());

// // 4. Use your Routes FOURTH (Now 'app' exists, so this won't crash)
// app.use('/api/items', itemRoutes);

// const PORT = process.env.PORT || 5001;
// const MONGO_URI = process.env.MONGO_URI || "";

// // 5. Connect to the Database
// mongoose.connect(MONGO_URI)
//   .then(() => console.log("✅ GreenCart Database Connected!"))
//   .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// // 6. Start the server
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import itemRoutes from './routes/itemRoutes.js'; // This likely handles products

// 1. Load config
dotenv.config();

const app = express();

// 2. Setup Middlewares
// Updated CORS to be more specific to your frontend port
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));
app.use(express.json());

// 3. Routes
// Changed this to /api/products so it matches your frontend service
app.use('/api/products', itemRoutes); 

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;

// 4. Connect to the Database
mongoose.connect(MONGO_URI!)
  .then(() => console.log("✅ GreenCart Database Connected!"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// 5. Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

