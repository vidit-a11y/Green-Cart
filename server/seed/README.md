# Green Cart Database Seed Files

This folder contains JSON seed data for the Green Cart e-commerce platform.

## Files

### 1. products.json (19 items)
Contains sample products with the following fields:
- `_id`: MongoDB ObjectId
- `name`: Product name
- `description`: Detailed description
- `price`: Price in INR
- `category`: Category name (Fruits, Vegetables, Dairy, Organic)
- `stockQuantity`: Available quantity
- `imageUrl`: Product image URL
- `unit`: Unit of measurement (kg, dozen, bunch, liter, etc.)
- `farmerId`, `farmerName`, `location`: Farmer details
- `isAvailable`: Boolean for availability
- `rating`, `reviewsCount`: Product ratings
- `createdAt`, `updatedAt`: Timestamps

### 2. categories.json (4 categories)
Contains category definitions:
- Fruits 🥭
- Vegetables 🥬
- Dairy 🥛
- Organic 🌿

### 3. users.json (5 users)
Contains sample users with:
- **Consumer**: Rahul Sharma, Amit Kumar
- **Farmer**: Priya Patel, Vikram Singh
- **Admin**: Sneha Reddy

All passwords are hashed using bcrypt (plaintext: `password123`)

## Import Methods

### Method 1: MongoDB Compass (GUI)
1. Open MongoDB Compass
2. Connect to your database
3. Click on a collection (or create one)
4. Click "Add Data" → "Import JSON or CSV file"
5. Select the appropriate .json file

### Method 2: MongoDB Shell
```bash
# Import products
mongoimport --db greencart --collection products --file products.json --jsonArray

# Import categories
mongoimport --db greencart --collection categories --file categories.json --jsonArray

# Import users
mongoimport --db greencart --collection users --file users.json --jsonArray
```

### Method 3: Node.js Script
```bash
cd server/seed
npm install mongoose
node seed.js
```

## Login Credentials for Testing

| Email | Password | Role |
|-------|----------|------|
| rahul.sharma@example.com | password123 | consumer |
| priya.patel@example.com | password123 | farmer |
| amit.kumar@example.com | password123 | consumer |
| sneha.reddy@example.com | password123 | admin |
| vikram.singh@example.com | password123 | farmer |
