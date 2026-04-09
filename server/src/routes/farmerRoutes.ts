import express from 'express';
// Add .js to the end of the controller path
import { getFarmers } from '../controllers/farmerController.js';

const router = express.Router();

router.get('/', getFarmers);

export default router;