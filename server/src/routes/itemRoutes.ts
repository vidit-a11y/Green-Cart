import express from 'express';
import { 
  getItems, 
  addItem, 
  getItemById, 
  updateItem, // Added this back in
  deleteItem 
} from '../controllers/itemController.js';

const router = express.Router();

router.get('/', getItems);           // Get all items
router.post('/', addItem);           // Add a new item to the cart
router.get('/:id', getItemById);     // Get a specific item
router.put('/:id', updateItem);      // Update an item (like changing price)
router.delete('/:id', deleteItem);   // Remove an item

export default router;