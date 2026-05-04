import { Request, Response } from 'express';

export const getOrdersByFarmer = async (req: Request, res: Response) => {
  try {
    // For now, return an empty paginated response so the UI doesn't crash with 404
    // You can implement the actual Order model and database query later.
    res.json({
      success: true,
      data: {
        data: [],
        total: 0,
        page: 1,
        limit: 5,
        totalPages: 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders' });
  }
};
