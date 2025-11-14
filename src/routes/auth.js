import express from 'express';
import { createUser, getUserByEmail, verifyPassword } from '../services/userService.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { authRateLimiter, signupRateLimiter } from '../middleware/rateLimiter.js';
import { validateSignup, validateLogin } from '../middleware/validator.js';
import { isAccountLocked, recordFailedAttempt, clearFailedAttempts, MAX_FAILED_ATTEMPTS } from '../middleware/accountLockout.js';
import { authTimeout } from '../middleware/requestTimeout.js';

const router = express.Router();

// POST /auth/signup - Register a new user
router.post('/signup', signupRateLimiter, authTimeout, validateSignup, async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Check if account is locked
    const lockoutStatus = isAccountLocked(email);
    if (lockoutStatus && lockoutStatus.locked) {
      return res.status(423).json({ 
        error: 'Account is temporarily locked due to too many failed attempts',
        lockedUntil: lockoutStatus.lockedUntil
      });
    }

    // Create user
    const user = await createUser(email, password, name);
    
    // Clear any failed attempts on successful signup
    clearFailedAttempts(email);
    
    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      user,
      token
    });
  } catch (error) {
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({ error: error.message });
    }
    return next(error);
  }
});

// POST /auth/login - Login user
router.post('/login', authRateLimiter, authTimeout, validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if account is locked
    const lockoutStatus = isAccountLocked(email);
    if (lockoutStatus && lockoutStatus.locked) {
      return res.status(423).json({ 
        error: 'Account is temporarily locked due to too many failed login attempts',
        lockedUntil: lockoutStatus.lockedUntil
      });
    }

    // Get user
    const user = await getUserByEmail(email);
    if (!user) {
      // Record failed attempt even if user doesn't exist (prevent user enumeration)
      recordFailedAttempt(email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      // Record failed attempt
      const lockoutInfo = recordFailedAttempt(email);
      
      // Check if account is now locked
      if (lockoutInfo.lockedUntil) {
        return res.status(423).json({ 
          error: 'Account locked due to too many failed attempts',
          lockedUntil: lockoutInfo.lockedUntil
        });
      }
      
      return res.status(401).json({ 
        error: 'Invalid email or password',
        remainingAttempts: MAX_FAILED_ATTEMPTS - lockoutInfo.failedAttempts
      });
    }

    // Clear failed attempts on successful login
    clearFailedAttempts(email);

    // Generate token
    const token = generateToken(user.id);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    next(error);
  }
});

// GET /auth/me - Get current user (protected route)
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
});

export default router;

