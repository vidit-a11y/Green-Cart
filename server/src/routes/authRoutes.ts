import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { getCurrentUser, googleCallback, login, register, updateProfile } from '../controllers/authController.js';
import { User } from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Configure Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            // Check if user exists with same email
            user = await User.findOne({ email: profile.emails?.[0].value });

            if (user) {
              // Link Google account to existing user
              user.googleId = profile.id;
              if (!user.avatar && profile.photos?.[0].value) {
                user.avatar = profile.photos[0].value;
              }
              await user.save();
            } else {
              // Create new user
              user = new User({
                name: profile.displayName,
                email: profile.emails?.[0].value,
                googleId: profile.id,
                avatar: profile.photos?.[0].value,
                role: 'consumer',
              });
              await user.save();
            }
          }

          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
}

// Serialize/deserialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Middleware to verify JWT token
export const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    (req as any).userId = decoded.userId;
    next();
  });
};

// Routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getCurrentUser);
router.put('/profile', authenticateToken, updateProfile);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  googleCallback
);

export default router;
