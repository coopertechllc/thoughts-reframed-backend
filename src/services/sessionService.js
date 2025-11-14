import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sessionsDir = process.env.SESSIONS_DIR || './data/sessions';

// Ensure sessions directory exists
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

const getSessionPath = (sessionId) => {
  return path.join(sessionsDir, `${sessionId}.json`);
};

export const createSession = async (userId) => {
  const sessionId = uuidv4();
  const session = {
    id: sessionId,
    userId: userId,
    createdAt: new Date().toISOString(),
    status: 'created',
    audioFiles: [],
    transcript: null,
    reframedText: null,
    generatedAudioUrl: null,
    error: null
  };

  const sessionPath = getSessionPath(sessionId);
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));

  return session;
};

export const getSession = async (sessionId) => {
  const sessionPath = getSessionPath(sessionId);
  
  if (!fs.existsSync(sessionPath)) {
    return null;
  }

  const sessionData = fs.readFileSync(sessionPath, 'utf8');
  return JSON.parse(sessionData);
};

export const updateSession = async (sessionId, updates) => {
  const session = await getSession(sessionId);
  
  if (!session) {
    throw new Error('Session not found');
  }

  const updatedSession = {
    ...session,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  const sessionPath = getSessionPath(sessionId);
  fs.writeFileSync(sessionPath, JSON.stringify(updatedSession, null, 2));

  return updatedSession;
};

export const getUserSessions = async (userId) => {
  const sessionsDir = process.env.SESSIONS_DIR || './data/sessions';
  
  if (!fs.existsSync(sessionsDir)) {
    return [];
  }

  const files = fs.readdirSync(sessionsDir);
  const sessions = [];

  for (const file of files) {
    if (file.endsWith('.json')) {
      const filePath = path.join(sessionsDir, file);
      const sessionData = fs.readFileSync(filePath, 'utf8');
      const session = JSON.parse(sessionData);
      
      // Only return sessions belonging to this user
      if (session.userId === userId) {
        sessions.push(session);
      }
    }
  }

  // Sort by created date, newest first
  sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return sessions;
};

