import { Request, Response } from 'express';
import { Item } from '../models/item.js';

export const getItems = async (req: Request, res: Response) => {
  try {
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
    } = req.query as Record<string, string>;

    // Build filter query
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

    // Build sort
    const sortField = sortBy === 'date' ? 'createdAt' : sortBy;
    const sort: Record<string, 1 | -1> = {
      [sortField]: sortOrder === 'asc' ? 1 : -1,
    };

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Item.find(query).sort(sort).skip(skip).limit(limitNum),
      Item.countDocuments(query),
    ]);

    res.json({
      data: items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching items' });
  }
};

export const getProductsByFarmer = async (req: Request, res: Response) => {
  try {
    const { farmerId } = req.params;
    const items = await Item.find({ farmerId });
    // Keep it consistent with frontend expecting { success: true, data: [...] } if needed, 
    // or just array since frontend productService does response.data.data
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching farmer products' });
  }
};

export const addItem = async (req: Request, res: Response) => {
  try {
    const newItem = new Item(req.body);
    const saved = await newItem.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: 'Error adding item' });
  }
};

export const getItemById = async (req: Request, res: Response) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Invalid ID format' });
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const updated = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Error updating' });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting' });
  }
};