import { Request, Response } from 'express';
import { Farmer } from '../models/farmer.js';

export const getFarmers = async (req: Request, res: Response) => {
  try {
    const farmers = await Farmer.find(); // Get everyone from MongoDB
    res.json(farmers);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};