import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middlewares/errorHandler.js';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

// Pastikan JWT_SECRET ada
if (!JWT_SECRET || JWT_SECRET === 'your-super-secret-key-change-this-in-production') {
  console.warn('WARNING: JWT_SECRET belum diatur dengan benar di .env!');
}

export const register = asyncHandler(async (req, res) => {
  const { email, password, nim, full_name, program_studi, angkatan, phone } = req.body;

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { nim }] }
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: { message: 'Email atau NIM sudah terdaftar' }
    });
  }

  const password_hash = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      email, password_hash, nim, full_name,
      program_studi,
      angkatan: angkatan ? parseInt(angkatan) : null,
      phone,
      status: 'pending',
      role: 'member'
    }
  });

  res.status(201).json({
    success: true,
    message: 'Akun berhasil dibuat. Menunggu persetujuan admin.',
    data: { id: newUser.id, email: newUser.email, status: newUser.status }
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ success: false, error: { message: 'Email atau password salah' } });
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    return res.status(401).json({ success: false, error: { message: 'Email atau password salah' } });
  }

  if (user.status === 'blocked') {
    return res.status(403).json({ success: false, error: { message: 'Akun Anda telah diblokir' } });
  }

  if (user.status === 'pending') {
    return res.status(403).json({ success: false, error: { message: 'Akun Anda masih menunggu persetujuan admin' } });
  }

  // Gamification: Daily Login Logic
  const now = new Date();
  let newStreak = user.streak_days || 0;
  let newPoints = user.points || 0;

  if (!user.last_active_at) {
    newStreak = 1;
    newPoints += 10;
  } else {
    const lastActive = new Date(user.last_active_at);
    const isToday = lastActive.toDateString() === now.toDateString();

    if (!isToday) {
      const diffTime = Math.abs(now - lastActive);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
      newPoints += 10;
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      last_active_at: now,
      streak_days: newStreak,
      points: newPoints
    }
  });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, status: user.status },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id, email: user.email, full_name: user.full_name,
        role: user.role, status: user.status
      }
    }
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true, email: true, nim: true, full_name: true, role: true,
      status: true, avatar_url: true, bio: true, phone: true,
      program_studi: true, angkatan: true, points: true, streak_days: true,
      created_at: true
    }
  });

  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'User tidak ditemukan' } });
  }

  res.json({ success: true, data: user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { bio, phone, program_studi, avatar_url } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: { bio, phone, program_studi, avatar_url }
  });

  res.json({ success: true, message: 'Profil berhasil diperbarui', data: { id: updatedUser.id } });
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  const topUsers = await prisma.user.findMany({
    where: { status: 'active' },
    orderBy: { points: 'desc' },
    take: 10,
    select: {
      id: true, full_name: true, points: true,
      streak_days: true, avatar_url: true
    }
  });

  res.json({ success: true, data: topUsers });
});

// ─── Admin User Management ──────────────────────────

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { created_at: 'desc' },
    select: {
      id: true, email: true, nim: true, full_name: true,
      role: true, status: true, program_studi: true,
      angkatan: true, points: true, created_at: true
    }
  });

  res.json({ success: true, data: users });
});

export const approveUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'User tidak ditemukan' } });
  }

  await prisma.user.update({
    where: { id },
    data: { status: 'active' }
  });

  res.json({ success: true, message: `User ${user.full_name} telah diaktifkan` });
});

export const rejectUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'User tidak ditemukan' } });
  }

  await prisma.user.update({
    where: { id },
    data: { status: 'blocked' }
  });

  res.json({ success: true, message: `User ${user.full_name} telah diblokir` });
});
