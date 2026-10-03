import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import classRoutes from './routes/classRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
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

// B-2 (HIGH): trust proxy — di balik Render/Railway/Nginx, req.ip adalah IP proxy
// tanpa ini. Bucket rate-limit 20/15 menit terbagi untuk seluruh platform:
// user legit kena "Terlalu banyak percobaan", attacker malah aman.
app.set('trust proxy', 1);

// B-17 (LOW): Batasi CORS ke FRONTEND_URL yang diketahui. Di development izinkan
// origin Vite/Next lokal; di production hanya FRONTEND_URL dari env.
const corsOrigin = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.replace(/\/+$/, '')
  : true;
app.use(cors({ origin: corsOrigin, credentials: true }));

// contentSecurityPolicy dimatikan agar tidak mematahkan asset SPA (Vite/MUI emotion inline styles);
// header lain (X-Frame-Options, X-Content-Type-Options, HSTS, dll) tetap aktif.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting untuk endpoint auth (proteksi brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 20, // maksimal 20 request per window
  message: { success: false, error: { message: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Terapkan rate limiter ke endpoint login, register, & reset password (semua rawan brute force/abuse)
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);
app.use('/api/v1/auth/reset-password', authLimiter);

const clientDist = path.join(__dirname, '../dist/client');

// Serve built React (Vite) SPA assets
app.use(express.static(clientDist));

// Health check endpoint untuk keep-alive service
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime() }));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/classes', classRoutes);
app.use('/api/v1/quizzes', quizRoutes);
app.use('/api/v1/admin', adminRoutes);

// SPA fallback: semua GET non-API mengembalikan index.html, routing ditangani react-router-dom
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    return res.sendFile(path.join(clientDist, 'index.html'));
  }
  next();
});

// Centralized error handler (must be last)
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
