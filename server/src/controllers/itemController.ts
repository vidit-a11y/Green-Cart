import { Request, Response } from 'express';
import { Item } from '../models/item.js'; // 1. Make sure this is 'Item' not 'Farmer'

// GET all items
export const getItems = async (req: Request, res: Response) => {
  try {
    const items = await Item.find(); // 2. Using Item model
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Error fetching items" });
  }
};

// ADD an item (POST)
export const addItem = async (req: Request, res: Response) => {
  try {
    const newItem = new Item(req.body);
    const saved = await newItem.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: "Error adding item" });
  }
};

// GET a single item by ID
export const getItemById = async (req: Request, res: Response) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Invalid ID format" });
  }
};

// UPDATE an item (PUT)
export const updateItem = async (req: Request, res: Response) => {
  try {
    const updated = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Error updating" });
  }
};

// DELETE an item (DELETE)
export const deleteItem = async (req: Request, res: Response) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting" });
  }
};