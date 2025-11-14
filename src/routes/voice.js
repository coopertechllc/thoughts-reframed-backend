import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';

import { authenticateToken } from '../middleware/auth.js';
import { updateUser, getUserById } from '../services/userService.js';
import { createVoiceClone, getVoiceCloningText } from '../services/voiceCloningService.js';
import { apiRateLimiter, uploadRateLimiter } from '../middleware/rateLimiter.js';
import { uploadTimeout } from '../middleware/requestTimeout.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// All voice routes require authentication
router.use(authenticateToken);

const uploadDir = process.env.UPLOAD_DIR || './uploads';
const voiceSamplesDir = path.join(uploadDir, 'voice-samples');

// Ensure voice samples directory exists
if (!fs.existsSync(voiceSamplesDir)) {
  fs.mkdirSync(voiceSamplesDir, { recursive: true });
}

// Configure multer for voice sample uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user.id;
    const userDir = path.join(voiceSamplesDir, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `voice_sample_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for voice samples
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/m4a', 'audio/x-m4a'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

// GET /voice/cloning-text - Get the text for voice cloning
router.get('/cloning-text', apiRateLimiter, async (req, res) => {
  try {
    const text = getVoiceCloningText();
    res.json({ text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /voice/clone - Upload voice sample and create voice clone
// Note: authenticateToken is already applied via router.use() above
router.post('/clone', uploadRateLimiter, uploadTimeout, upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const userId = req.user.id;
    const audioFilePath = req.file.path;
    const voiceName = req.body.name || `${req.user.email} Voice Clone`;

    console.log(`🎤 [Voice] Creating voice clone for user ${userId}`);

    // Create voice clone with ElevenLabs
    const voiceClone = await createVoiceClone(audioFilePath, voiceName);

    // Update user with voice ID
    const updatedUser = await updateUser(userId, {
      voiceId: voiceClone.voiceId
    });

    // Clean up the uploaded file (optional - could keep for backup)
    // fs.unlinkSync(audioFilePath);

    console.log(`✅ [Voice] Voice clone created and saved for user ${userId}`);
    console.log(`📦 [Voice] Response data:`, {
      message: 'Voice clone created successfully',
      voiceId: voiceClone.voiceId,
      voiceName: voiceClone.name,
      voice_id: voiceClone.voiceId, // Also include snake_case for compatibility
      voice_name: voiceClone.name,   // Also include snake_case for compatibility
      user: updatedUser
    });

    res.json({
      message: 'Voice clone created successfully',
      voiceId: voiceClone.voiceId,
      voice_id: voiceClone.voiceId, // Include both formats
      voiceName: voiceClone.name,
      voice_name: voiceClone.name,  // Include both formats
      user: updatedUser
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error(`❌ [Voice] Error creating voice clone for user ${req.user?.id || 'unknown'}:`, error.message);
    console.error(`❌ [Voice] Error stack:`, error.stack);
    
    // Provide more detailed error information
    const errorResponse = {
      error: error.message || 'Failed to create voice clone',
      details: error.message
    };
    
    // Include additional context in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack;
    }
    
    res.status(500).json(errorResponse);
  }
});

// GET /voice/status - Check if user has a voice clone
router.get('/status', apiRateLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getUserById(userId);
    
    res.json({
      hasVoiceClone: !!user.voiceId,
      voiceId: user.voiceId || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

