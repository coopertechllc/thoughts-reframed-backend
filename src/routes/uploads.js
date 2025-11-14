import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

const generatedAudioDir = process.env.GENERATED_AUDIO_DIR || './uploads/generated';

// GET /uploads/:filename - Serve generated audio files
router.get('/:filename', (req, res, next) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(generatedAudioDir, filename);

    // Security: prevent directory traversal
    const resolvedPath = path.resolve(filePath);
    const resolvedDir = path.resolve(generatedAudioDir);
    
    if (!resolvedPath.startsWith(resolvedDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const contentTypeMap = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.m4a': 'audio/mp4',
      '.webm': 'audio/webm'
    };

    res.setHeader('Content-Type', contentTypeMap[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
});

export default router;

