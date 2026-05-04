import express from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/uploadController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('image'), uploadImage);

export default router;