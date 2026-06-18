import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../utils/response.utils.js';

/**
 * Upload Controller — HTTP Layer Only
 *
 * Delegates actual upload logic to uploadService.ts
 */
export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      sendError(res, 'No file uploaded', 400);
      return;
    }

    const imageUrl = req.file.path;
    sendSuccess(res, { imageUrl });
  } catch (error) {
    sendError(res, 'Upload failed');
  }
};
