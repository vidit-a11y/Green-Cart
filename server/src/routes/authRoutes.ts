import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import {
  getCurrentUser,
  googleCallback,
  login,
  register,
  updateMyLocation,
  updateProfile,
} from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { validateLogin, validateRegister } from '../middlewares/validate.middleware.js';
import { User } from '../models/User.js';

/**
 * Auth Routes — Routing Only
 *
 * BEFORE: This file contained Passport strategy config, middleware definition,
 *         serialize/deserialize logic, AND route definitions. (4 responsibilities)
 *
 * AFTER:  This file ONLY defines routes and maps them to controllers.
 *         - authenticateToken moved to middlewares/auth.middleware.ts
 *         - Passport strategy config stays here (acceptable for OAuth setup)
 *         - Validation middleware added from middlewares/validate.middleware.ts
 */

const router = express.Router();

// ─── Passport Google OAuth Setup ─────────────────────────────────────────────
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
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            const email = profile.emails?.[0].value;
            user = await User.findOne({ email });

            if (user) {
              user.googleId = profile.id;
              if (!user.avatar && profile.photos?.[0].value) {
                user.avatar = profile.photos[0].value;
              }
              await user.save();
            } else {
              user = await User.create({
                name: profile.displayName,
                email,
                googleId: profile.id,
                avatar: profile.photos?.[0].value,
                role: 'consumer',
              });
            }
          }

          return done(null, user);
        } catch (error) {
          return done(error as any, false);
        }
      }
    )
  );
}

passport.serializeUser((user: any, done) => done(null, user._id));
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// ─── Routes ──────────────────────────────────────────────────────────────────
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', authenticateToken, getCurrentUser);
router.put('/profile', authenticateToken, updateProfile);
router.patch('/me/location', authenticateToken, updateMyLocation);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), googleCallback);

export default router;
