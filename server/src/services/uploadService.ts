import cloudinary from '../config/cloudinary.js';

/**
 * Upload Service — Business Logic Layer
 *
 * Handles file upload to Cloudinary.
 * Extracted from the controller so the upload logic
 * can be reused (e.g., for avatar uploads in the future).
 */
export const uploadToCloudinary = async (filePath: string): Promise<string> => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'greencart/products',
    transformation: [
      { width: 800, height: 800, crop: 'limit' }, // resize large images
      { quality: 'auto' },                          // auto-compress
      { fetch_format: 'auto' },                     // serve webp where supported
    ],
  });

  return result.secure_url;
};
