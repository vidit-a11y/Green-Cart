import express from 'express';
import { 
  getFarmers, 
  addFarmer, 
  getFarmerById, 
  updateFarmer, 
  deleteFarmer 
} from '../controllers/farmerController.js';

const router = express.Router();

router.get('/', getFarmers);           // Get all
router.post('/', addFarmer);           // Add new
router.get('/:id', getFarmerById);     // Get one
router.put('/:id', updateFarmer);      // Update
router.delete('/:id', deleteFarmer);   // Delete

export default router;