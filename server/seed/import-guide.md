# Import Guide for MongoDB Compass & Atlas

## MongoDB Compass (Local Database)

1. **Open MongoDB Compass** and connect to `mongodb://localhost:27017`

2. **Create Database**:
   - Click "Create Database"
   - Database Name: `greencart`
   - Collection Name: `products`
   - Click "Create Database"

3. **Import Products**:
   - Click on `greencart.products` collection
   - Click "Add Data" → "Import JSON or CSV file"
   - Select: `/Users/vidit/Desktop/Green-Cart/server/seed/products.json`
   - Click "Import"

4. **Import Categories**:
   - Click "Create Collection" → Name: `categories`
   - Click "Add Data" → "Import JSON or CSV file"
   - Select: `categories.json`
   - Click "Import"

5. **Import Users**:
   - Click "Create Collection" → Name: `users`
   - Click "Add Data" → "Import JSON or CSV file"
   - Select: `users.json`
   - Click "Import"

## MongoDB Atlas (Cloud)

### Step 1: Get Connection String
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click "Connect" on your cluster
3. Choose "MongoDB Compass"
4. Copy the connection string (looks like):
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/
   ```

### Step 2: Connect in Compass
1. Open MongoDB Compass
2. Paste the Atlas connection string
3. Click "Connect"

### Step 3: Import Data (Same as above)
Follow steps 2-5 from the Compass section above.

## Alternative: MongoDB Shell (Terminal)

```bash
# For local MongoDB
mongoimport --uri "mongodb://localhost:27017/greencart" --collection products --file /Users/vidit/Desktop/Green-Cart/server/seed/products.json --jsonArray

mongoimport --uri "mongodb://localhost:27017/greencart" --collection categories --file /Users/vidit/Desktop/Green-Cart/server/seed/categories.json --jsonArray

mongoimport --uri "mongodb://localhost:27017/greencart" --collection users --file /Users/vidit/Desktop/Green-Cart/server/seed/users.json --jsonArray

# For MongoDB Atlas (replace with your connection string)
mongoimport --uri "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/greencart" --collection products --file /Users/vidit/Desktop/Green-Cart/server/seed/products.json --jsonArray
```

## Check Import Success

In MongoDB Compass, run this query in each collection:
```javascript
// Products
db.products.countDocuments()  // Should show: 19

// Categories  
db.categories.countDocuments()  // Should show: 4

// Users
db.users.countDocuments()  // Should show: 5
```
