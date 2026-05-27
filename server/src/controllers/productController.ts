import type { Request, Response } from 'express';
import * as productService from '../services/productService.js';
import { sendError, sendSuccess } from '../utils/response.utils.js';

/**
 * Product Controller — HTTP Layer Only
 *
 * RENAMED from itemController.ts to productController.ts
 * for consistency with the domain language (products, not items).
 *
 * All business logic delegated to services/productService.ts
 */

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await productService.getAllProducts(req.query as any);
    res.json(result); // paginated response — no sendSuccess wrapper to keep shape flat
  } catch (error) {
    sendError(res, 'Error fetching products');
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json(product);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error fetching product';
    sendError(res, message, message === 'Product not found' ? 404 : 500);
  }
};

export const getProductsByFarmer = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await productService.getProductsByFarmer(req.params.farmerId);
    sendSuccess(res, products);
  } catch (error) {
    sendError(res, 'Error fetching farmer products');
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await productService.createProduct(req.body);
    sendSuccess(res, product, 201);
  } catch (error) {
    sendError(res, 'Error creating product', 400);
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    sendSuccess(res, product);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error updating product';
    sendError(res, message, message === 'Product not found' ? 404 : 400);
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    await productService.deleteProduct(req.params.id);
    sendSuccess(res, { message: 'Product deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error deleting product';
    sendError(res, message, message === 'Product not found' ? 404 : 500);
  }
};

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await productService.getDistinctCategories();
    sendSuccess(res, categories);
  } catch {
    sendError(res, 'Error fetching categories');
  }
};

export const getLocations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const locations = await productService.getDistinctLocations();
    sendSuccess(res, locations);
  } catch {
    sendError(res, 'Error fetching locations');
  }
};
