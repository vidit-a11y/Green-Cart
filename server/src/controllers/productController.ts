import type { Request, Response } from 'express';
import { User } from '../models/User.js';
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
    const imageUrl = req.file?.path;
    const farmerId = String(req.body.farmerId || (req as any).userId || '');
    const farmer = farmerId ? await User.findById(farmerId).select('location') : null;

    // ── 1.5% admin cut: consumer price = ceil(farmerPrice * 1.015) ──
    const ADMIN_CUT_PCT = 1.5;
    const farmerPrice = Number(req.body.price);
    const adminCut = parseFloat(((farmerPrice * ADMIN_CUT_PCT) / 100).toFixed(2));
    const consumerPrice = Math.ceil(farmerPrice + adminCut);

    const product = await productService.createProduct({
      ...req.body,
      farmerPrice,
      adminCut,
      price: consumerPrice,           // consumer sees this
      quantity: Number(req.body.quantity),
      isAvailable: req.body.isAvailable === 'false' ? false : Boolean(req.body.isAvailable ?? true),
      ...(farmer?.location ? { geoLocation: farmer.location } : {}),
      ...(imageUrl ? { imageUrl, images: [imageUrl] } : {}),
    });
    sendSuccess(res, product, 201);
  } catch (error) {
    sendError(res, 'Error creating product', 400);
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const imageUrl = req.file?.path;
    const currentProduct = await productService.getProductById(req.params.id);
    const farmerId = String(req.body.farmerId || currentProduct.farmerId || '');
    const farmer = farmerId ? await User.findById(farmerId).select('location') : null;

    // Re-calculate admin cut whenever price changes
    const priceUpdate: Record<string, number> = {};
    if (req.body.price !== undefined) {
      const ADMIN_CUT_PCT = 1.5;
      const farmerPrice = Number(req.body.price);
      const adminCut = parseFloat(((farmerPrice * ADMIN_CUT_PCT) / 100).toFixed(2));
      priceUpdate.farmerPrice = farmerPrice;
      priceUpdate.adminCut = adminCut;
      priceUpdate.price = Math.ceil(farmerPrice + adminCut);
    }

    const product = await productService.updateProduct(req.params.id, {
      ...req.body,
      ...priceUpdate,
      ...(req.body.quantity !== undefined ? { quantity: Number(req.body.quantity) } : {}),
      ...(req.body.isAvailable !== undefined
        ? { isAvailable: req.body.isAvailable === 'false' ? false : Boolean(req.body.isAvailable) }
        : {}),
      ...(farmer?.location ? { geoLocation: farmer.location } : {}),
      ...(imageUrl ? { imageUrl, images: [imageUrl] } : {}),
    });
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

export const updateFarmerProductLocations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng } = req.body;
    const farmerId = String((req as any).userId || '');

    if (!lat || !lng || !farmerId) {
      sendError(res, 'Missing required fields: lat, lng', 400);
      return;
    }

    // Validate coordinates
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      sendError(res, 'Invalid coordinates', 400);
      return;
    }

    await productService.updateFarmerProductLocations(farmerId, longitude, latitude);
    
    sendSuccess(res, { message: 'Location updated for all farmer products' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error updating product locations';
    sendError(res, message, 500);
  }
};
