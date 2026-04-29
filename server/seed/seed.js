const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'products.json'), 'utf8'));
const categories = JSON.parse(fs.readFileSync(path.join(__dirname, 'categories.json'), 'utf8'));
const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8'));

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/greencart');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    await db.collection('products').deleteMany({});
    await db.collection('categories').deleteMany({});
    await db.collection('users').deleteMany({});

    await db.collection('products').insertMany(products);
    console.log(`Inserted ${products.length} products`);

    await db.collection('categories').insertMany(categories);
    console.log(`Inserted ${categories.length} categories`);

    await db.collection('users').insertMany(users);
    console.log(`Inserted ${users.length} users`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
