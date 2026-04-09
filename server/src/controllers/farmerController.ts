import { Request, Response } from 'express';
import { Farmer } from '../models/farmer.js';

// GET all items
export const getFarmers = async (req: Request, res: Response) => {
  try {
    const farmers = await Farmer.find();
    res.json(farmers);
  } catch (err) {
    res.status(500).json({ message: "Error fetching items" });
  }
};

// ADD an item (POST)
export const addFarmer = async (req: Request, res: Response) => {
  try {
    const newFarmer = new Farmer(req.body);
    const saved = await newFarmer.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: "Error adding item" });
  }
};

// GET a single item by ID
export const getFarmerById = async (req: Request, res: Response) => {
  try {
    const farmer = await Farmer.findById(req.params.id);
    if (!farmer) return res.status(404).json({ message: "Not found" });
    res.json(farmer);
  } catch (err) {
    res.status(500).json({ message: "Invalid ID format" });
  }
};

// UPDATE an item (PUT)
export const updateFarmer = async (req: Request, res: Response) => {
  try {
    const updated = await Farmer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Error updating" });
  }
};

// DELETE an item (DELETE)
export const deleteFarmer = async (req: Request, res: Response) => {
  try {
    await Farmer.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting" });
  }
};