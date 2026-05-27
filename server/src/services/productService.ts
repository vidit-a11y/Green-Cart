import { Product } from '../models/Product.js';

/**
 * Product Service — Business Logic Layer
 *
 * All product-related database operations live here.
 * The controller only calls these functions and formats the HTTP response.
 */

interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  location?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: string;
  limit?: string;
}

export const getAllProducts = async (filters: ProductFilters) => {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    location,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = '1',
    limit = '12',
  } = filters;

  const query: Record<string, any> = {};

  if (category) {
    query.category = { $regex: new RegExp(`^${category}$`, 'i') };
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { farmerName: { $regex: search, $options: 'i' } },
    ];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }

  if (location) {
    query.location = { $regex: location, $options: 'i' };
  }

  const sortField = sortBy === 'date' ? 'createdAt' : sortBy;
  const sort: Record<string, 1 | -1> = {
    [sortField]: sortOrder === 'asc' ? 1 : -1,
  };

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(query).sort(sort).skip(skip).limit(limitNum),
    Product.countDocuments(query),
  ]);

  return {
    data: products,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  };
};

export const getProductById = async (id: string) => {
  const product = await Product.findById(id);
  if (!product) throw new Error('Product not found');
  return product;
};

export const getProductsByFarmer = async (farmerId: string) => {
  return Product.find({ farmerId });
};

export const createProduct = async (data: Record<string, any>) => {
  return Product.create(data);
};

export const updateProduct = async (id: string, data: Record<string, any>) => {
  const product = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!product) throw new Error('Product not found');
  return product;
};

export const deleteProduct = async (id: string) => {
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw new Error('Product not found');
  return product;
};

export const getDistinctCategories = async (): Promise<string[]> => {
  return Product.distinct('category');
};

export const getDistinctLocations = async (): Promise<string[]> => {
  return Product.distinct('location');
};
