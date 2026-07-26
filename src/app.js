import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import classRoutes from './routes/classRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

// Pastikan JWT_SECRET sudah diset
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-super-secret-key-change-this-in-production') {
  console.warn('WARNING: JWT_SECRET belum diatur di .env! Gunakan secret yang kuat untuk production.');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const clientDist = path.join(__dirname, '../dist/client');

// Serve built React (Vite) SPA assets
app.use(express.static(clientDist));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/classes', classRoutes);
app.use('/api/v1/quizzes', quizRoutes);

// SPA fallback: semua GET non-API mengembalikan index.html, routing ditangani react-router-dom
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    return res.sendFile(path.join(clientDist, 'index.html'));
  }
  next();
});

// Centralized error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
