import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Generate JWT token
const generateToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Register with email/password
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'consumer',
      phone,
      address,
    });

    await user.save();

    const token = generateToken(user._id!);
    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user' });
  }
};

// Login with email/password
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id!);
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
};

// Google OAuth callback
export const googleCallback = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const token = generateToken(user._id);
    
    // Redirect to frontend with token
    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?token=${token}`;
    res.redirect(redirectUrl);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=auth_failed`);
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user' });
  }
};

// Update profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const updates = req.body;
    
    delete updates.password; // Don't update password through this route
    delete updates.googleId; // Don't update Google ID
    
    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile' });
  }
};
