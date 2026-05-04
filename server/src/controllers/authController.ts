import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];


const generateToken = (userId: string) => {
  return jwt.sign(
    { id: userId }, 
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};


const safeUser = (user: any) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  address: user.address,
  avatar: user.avatar,
  createdAt: user.createdAt,
});


export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'consumer',
      phone,
      address,
    });

    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      data: { user: safeUser(user), token },
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Error registering user' });
  }
};


export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Missing credentials' });
    }

    // IMPORTANT: include password if you later use select:false
    const user = await User.findOne({ email });

    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      data: { user: safeUser(user), token },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Error logging in' });
  }
};


export const googleCallback = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const token = generateToken(user._id.toString());

    const redirectUrl = `${
      process.env.CLIENT_URL || 'http://localhost:5173'
    }/auth/callback?token=${token}`;

    res.redirect(redirectUrl);

  } catch (error) {
    res.redirect(
      `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=auth_failed`
    );
  }
};


export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ success: true, data: user });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user' });
  }
};


export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const updates = req.body;

    // prevent sensitive updates
    delete updates.password;
    delete updates.googleId;

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ success: true, data: user });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
};