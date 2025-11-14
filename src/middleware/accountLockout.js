import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const lockoutDir = process.env.LOCKOUT_DIR || './data/lockouts';
export const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Ensure lockout directory exists
if (!fs.existsSync(lockoutDir)) {
  fs.mkdirSync(lockoutDir, { recursive: true });
}

const getLockoutPath = (email) => {
  // Use a hash of email for filename (basic security)
  const hash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
  return path.join(lockoutDir, `${hash}.json`);
};

export const recordFailedAttempt = (email) => {
  const lockoutPath = getLockoutPath(email);
  let lockoutData = {
    email: email.toLowerCase(),
    failedAttempts: 0,
    lockedUntil: null,
    lastAttempt: null
  };

  if (fs.existsSync(lockoutPath)) {
    const data = fs.readFileSync(lockoutPath, 'utf8');
    lockoutData = JSON.parse(data);
  }

  lockoutData.failedAttempts += 1;
  lockoutData.lastAttempt = new Date().toISOString();

  // Lock account if max attempts reached
  if (lockoutData.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    lockoutData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION).toISOString();
    console.log(`🔒 [AccountLockout] Account locked for ${email} until ${lockoutData.lockedUntil}`);
  }

  fs.writeFileSync(lockoutPath, JSON.stringify(lockoutData, null, 2));
  return lockoutData;
};

export const clearFailedAttempts = (email) => {
  const lockoutPath = getLockoutPath(email);
  if (fs.existsSync(lockoutPath)) {
    fs.unlinkSync(lockoutPath);
  }
};

export const isAccountLocked = (email) => {
  const lockoutPath = getLockoutPath(email);
  
  if (!fs.existsSync(lockoutPath)) {
    return false;
  }

  const data = fs.readFileSync(lockoutPath, 'utf8');
  const lockoutData = JSON.parse(data);

  // Check if lockout has expired
  if (lockoutData.lockedUntil) {
    const lockedUntil = new Date(lockoutData.lockedUntil);
    if (lockedUntil > new Date()) {
      return {
        locked: true,
        lockedUntil: lockoutData.lockedUntil,
        remainingAttempts: 0
      };
    } else {
      // Lockout expired, clear it
      clearFailedAttempts(email);
      return false;
    }
  }

  return {
    locked: false,
    remainingAttempts: MAX_FAILED_ATTEMPTS - lockoutData.failedAttempts
  };
};

// Cleanup expired lockouts (run periodically)
export const cleanupExpiredLockouts = () => {
  if (!fs.existsSync(lockoutDir)) {
    return;
  }

  const files = fs.readdirSync(lockoutDir);
  const now = new Date();

  files.forEach(file => {
    if (file.endsWith('.json')) {
      const filePath = path.join(lockoutDir, file);
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        const lockoutData = JSON.parse(data);
        
        if (lockoutData.lockedUntil) {
          const lockedUntil = new Date(lockoutData.lockedUntil);
          if (lockedUntil <= now) {
            fs.unlinkSync(filePath);
            console.log(`🧹 [AccountLockout] Cleaned up expired lockout for ${lockoutData.email}`);
          }
        }
      } catch (error) {
        console.error(`Error cleaning up lockout file ${file}:`, error);
      }
    }
  });
};

// Run cleanup every hour
setInterval(cleanupExpiredLockouts, 60 * 60 * 1000);

