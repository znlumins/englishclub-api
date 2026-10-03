import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized: No token provided' } });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'your-super-secret-key-change-this-in-production') {
      return res.status(500).json({ success: false, error: { message: 'Server configuration error: JWT_SECRET not set' } });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (error) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized: Invalid or expired token' } });
    }

    // Token berlaku 30 hari — jangan percaya role/status yang di-bake saat login,
    // ambil ulang dari DB supaya user yang diblokir/diturunkan rolenya langsung ditolak.
    // B-5: ambil juga password_changed_at untuk membatalkan token lama setelah
    // password diganti/direset (token stateless tidak bisa di-revoke tanpa ini).
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, status: true, password_changed_at: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized: User tidak ditemukan' } });
    }
    if (user.status === 'blocked') {
      return res.status(403).json({ success: false, error: { message: 'Akun Anda telah diblokir' } });
    }
    if (user.status === 'pending') {
      return res.status(403).json({ success: false, error: { message: 'Akun Anda masih menunggu persetujuan admin' } });
    }
    // Token diterbitkan SEBELUM password terakhir diubah → token sudah tidak valid.
    if (user.password_changed_at && decoded.iat && user.password_changed_at.getTime() > decoded.iat * 1000) {
      return res.status(401).json({ success: false, error: { message: 'Password telah diubah. Silakan login kembali.' } });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: { message: 'Forbidden' } });
  }
  next();
};
