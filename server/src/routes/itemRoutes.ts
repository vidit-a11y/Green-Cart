import express from 'express';
import { 
  getItems, 
  addItem, 
  getItemById, 
  updateItem,
  deleteItem,
  getProductsByFarmer
} from '../controllers/itemController.js';

const router = express.Router();

router.get('/', getItems);           // Get all items
router.get('/farmer/:farmerId', getProductsByFarmer); // Get products by farmer
router.post('/', addItem);           // Add a new item to the cart
router.get('/:id', getItemById);     // Get a specific item
router.put('/:id', updateItem);      // Update an item (like changing price)
router.delete('/:id', deleteItem);   // Remove an item

export default router;