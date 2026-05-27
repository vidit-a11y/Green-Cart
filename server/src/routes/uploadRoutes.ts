import express from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/uploadController.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', authenticateToken, upload.single('image'), uploadImage);

export default router;
