import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import { upload } from '../config/cloudinary.config.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', authenticateToken, upload.single('image'), uploadImage);

export default router;
