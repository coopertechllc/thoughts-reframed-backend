import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

import sessionRoutes from './routes/sessions.js';
import uploadRoutes from './routes/uploads.js';
import authRoutes from './routes/auth.js';
import voiceRoutes from './routes/voice.js';
import { securityHeaders, corsConfig } from './middleware/security.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { validateEnv } from './utils/envValidator.js';

dotenv.config();

// Validate environment variables
try {
  validateEnv();
} catch (error) {
  console.error('❌ [Server] Environment validation failed:', error.message);
  console.error('Please set all required environment variables in .env file');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure upload directories exist
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const generatedAudioDir = process.env.GENERATED_AUDIO_DIR || './uploads/generated';

[uploadDir, generatedAudioDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Security middleware (must be first)
app.use(securityHeaders);

// CORS configuration
if (process.env.NODE_ENV === 'production') {
  app.use(corsConfig);
} else {
  // Allow all origins in development
  app.use(cors());
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/auth', authRoutes);
app.use('/sessions', sessionRoutes);
app.use('/uploads', uploadRoutes);
app.use('/voice', voiceRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Log detailed error server-side
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    user: req.user?.id || 'anonymous'
  });
  
  // Send generic error to client
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Upload directory: ${uploadDir}`);
  console.log(`Generated audio directory: ${generatedAudioDir}`);
});

