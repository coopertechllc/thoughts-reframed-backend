import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const usersDir = process.env.USERS_DIR || './data/users';

// Ensure users directory exists
if (!fs.existsSync(usersDir)) {
  fs.mkdirSync(usersDir, { recursive: true });
}

const getUserPath = (userId) => {
  return path.join(usersDir, `${userId}.json`);
};

const getUserByEmailPath = () => {
  return path.join(usersDir, 'email_index.json');
};

// Load email index (maps email to userId)
const loadEmailIndex = () => {
  const indexPath = getUserByEmailPath();
  if (fs.existsSync(indexPath)) {
    const data = fs.readFileSync(indexPath, 'utf8');
    return JSON.parse(data);
  }
  return {};
};

// Save email index
const saveEmailIndex = (index) => {
  const indexPath = getUserByEmailPath();
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
};

export const createUser = async (email, password, name) => {
  // Check if user already exists
  const emailIndex = loadEmailIndex();
  if (emailIndex[email.toLowerCase()]) {
    throw new Error('User with this email already exists');
  }

  const userId = uuidv4();
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = {
    id: userId,
    email: email.toLowerCase(),
    name: name || null,
    password: hashedPassword,
    voiceId: null, // ElevenLabs voice ID after voice cloning
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Save user
  const userPath = getUserPath(userId);
  fs.writeFileSync(userPath, JSON.stringify(user, null, 2));

  // Update email index
  emailIndex[email.toLowerCase()] = userId;
  saveEmailIndex(emailIndex);

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const getUserByEmail = async (email) => {
  const emailIndex = loadEmailIndex();
  const userId = emailIndex[email.toLowerCase()];
  
  if (!userId) {
    return null;
  }

  const userPath = getUserPath(userId);
  if (!fs.existsSync(userPath)) {
    return null;
  }

  const userData = fs.readFileSync(userPath, 'utf8');
  return JSON.parse(userData);
};

export const getUserById = async (userId) => {
  const userPath = getUserPath(userId);
  
  if (!fs.existsSync(userPath)) {
    return null;
  }

  const userData = fs.readFileSync(userPath, 'utf8');
  const user = JSON.parse(userData);
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const updateUser = async (userId, updates) => {
  const userPath = getUserPath(userId);
  
  if (!fs.existsSync(userPath)) {
    throw new Error('User not found');
  }

  const userData = fs.readFileSync(userPath, 'utf8');
  const user = JSON.parse(userData);

  const updatedUser = {
    ...user,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync(userPath, JSON.stringify(updatedUser, null, 2));

  // Return user without password
  const { password: _, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
};

