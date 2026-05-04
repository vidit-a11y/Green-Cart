import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary.js';

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const result = await cloudinary.uploader.upload(req.file.path);

    res.json({
      imageUrl: result.secure_url
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed' });
  }
};