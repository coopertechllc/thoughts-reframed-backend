import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { createSession, getSession, updateSession, getUserSessions } from '../services/sessionService.js';
import { processAudioPipeline } from '../services/processingService.js';
import { authenticateToken } from '../middleware/auth.js';
import { apiRateLimiter, uploadRateLimiter } from '../middleware/rateLimiter.js';
import { uploadTimeout, processingTimeout } from '../middleware/requestTimeout.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sessionId = req.params.id;
    const sessionDir = path.join(uploadDir, sessionId);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    cb(null, sessionDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `audio_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
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

// GET /sessions - Get all sessions for the authenticated user
router.get('/', authenticateToken, apiRateLimiter, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sessions = await getUserSessions(userId);
    res.json({ sessions });
  } catch (error) {
    next(error);
  }
});

// POST /sessions - Create a new session
router.post('/', authenticateToken, apiRateLimiter, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const session = await createSession(userId);
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

// POST /sessions/:id/upload - Upload audio file
router.post('/:id/upload', authenticateToken, uploadRateLimiter, uploadTimeout, upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const sessionId = req.params.id;
    const userId = req.user.id;
    const session = await getSession(sessionId);
    
    if (!session) {
      // Clean up uploaded file if session doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Session not found' });
    }

    // Verify session belongs to user
    if (session.userId !== userId) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update session with audio file info
    const audioFiles = session.audioFiles || [];
    audioFiles.push({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date().toISOString()
    });

    await updateSession(sessionId, {
      audioFiles,
      status: 'audio_uploaded'
    });

    res.json({
      message: 'Audio file uploaded successfully',
      file: {
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /sessions/:id/process - Trigger processing pipeline
router.post('/:id/process', authenticateToken, apiRateLimiter, processingTimeout, async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id;
    const session = await getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Verify session belongs to user
    if (session.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!session.audioFiles || session.audioFiles.length === 0) {
      return res.status(400).json({ error: 'No audio files uploaded for this session' });
    }

    // Update status to processing
    await updateSession(sessionId, { status: 'processing' });

    // Start processing pipeline asynchronously
    processAudioPipeline(sessionId).catch(error => {
      console.error(`Error processing session ${sessionId}:`, error);
      updateSession(sessionId, {
        status: 'error',
        error: error.message
      });
    });

    res.json({
      message: 'Processing started',
      sessionId: sessionId,
      status: 'processing'
    });
  } catch (error) {
    next(error);
  }
});

// GET /sessions/:id - Get session status and results
router.get('/:id', authenticateToken, apiRateLimiter, async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id;
    const session = await getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Verify session belongs to user
    if (session.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(session);
  } catch (error) {
    next(error);
  }
});

export default router;

