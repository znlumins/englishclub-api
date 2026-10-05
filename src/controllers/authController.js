import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { sendMail } from '../utils/mailer.js';
import { createNotification } from '../utils/notifications.js';
import { BADGE_CATALOG, checkStreakBadges, checkTop10Badge } from '../utils/badges.js';

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

  // B-12: cek existing + create adalah race — dua register paralel bisa lolos
  // cek lalu keduanya create → P2002 → 500 dengan pesan Prisma mentah (bocor
  // nama tabel). Tangkap P2002 & ubah jadi pesan 400 yang ramah pengguna.
  try {
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
  } catch (err) {
    if (err?.code === 'P2002') {
      const field = err.meta?.target?.includes('email') ? 'Email' : 'NIM';
      return res.status(400).json({
        success: false,
        error: { message: `${field} sudah terdaftar. Gunakan email/NIM lain.` }
      });
    }
    throw err;
  }
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

  // Gamification: Daily Login Logic (berdasarkan calendar day, bukan selisih jam)
  // B-8: read-modify-write streak/poin non-atomik — dua login paralel (HP +
  // browser, double-click) keduanya membaca last_active_at yang sama, mencatat
  // DUA transaksi +10, tapi saldo hanya naik +10 (ledger tidak reconcile).
  // Kunci baris dengan FOR UPDATE & gunakan increment atomik di dalam transaction.
  const now = new Date();

  const loginAward = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw`SELECT points, streak_days, last_active_at FROM \`User\` WHERE id = ${user.id} FOR UPDATE`;
    const current = rows[0];

    let newStreak = current.streak_days || 0;
    let awarded = 0;

    if (!current.last_active_at) {
      newStreak = 1;
      awarded = 10;
    } else {
      const lastActive = new Date(current.last_active_at);
      const isToday = lastActive.toDateString() === now.toDateString();

      if (!isToday) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const wasYesterday = lastActive.toDateString() === yesterday.toDateString();

        newStreak = wasYesterday ? newStreak + 1 : 1;
        awarded = 10;
      }
    }

    if (awarded > 0) {
      await tx.$executeRaw`UPDATE \`User\` SET last_active_at = ${now}, streak_days = ${newStreak}, points = points + ${awarded} WHERE id = ${user.id}`;
      await tx.pointTransaction.create({
        data: {
          userId: user.id,
          type: 'login',
          amount: awarded,
          description: 'Login harian'
        }
      });
    } else {
      // Login di hari yang sama: perbarui last_active_at tanpa poin ganda.
      await tx.$executeRaw`UPDATE \`User\` SET last_active_at = ${now} WHERE id = ${user.id}`;
    }

    return { newStreak, newPoints: (current.points || 0) + awarded };
  });

  await checkStreakBadges(user.id, loginAward.newStreak);
  await checkTop10Badge(user.id);

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
        id: user.id,
        email: user.email,
        nim: user.nim,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        points: loginAward.newPoints,
        streak_days: loginAward.newStreak,
        program_studi: user.program_studi,
        avatar_url: user.avatar_url,
        bio: user.bio
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

// Ganti password saat sudah login (beda dari forgot/reset-password yang butuh email/token)
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'User tidak ditemukan' } });
  }

  const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValidPassword) {
    return res.status(400).json({ success: false, error: { message: 'Password saat ini salah' } });
  }

  const password_hash = await bcrypt.hash(newPassword, 10);

  // B-5: catat waktu perubahan password agar semua token JWT lama (yang dibuat
  // sebelum ini) otomatis ditolak oleh middleware authenticate.
  await prisma.user.update({
    where: { id: user.id },
    data: { password_hash, password_changed_at: new Date() }
  });

  res.json({ success: true, message: 'Password berhasil diubah. Sesi lain akan keluar otomatis.' });
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

// ─── Point History ──────────────────────────

export const getPointHistory = asyncHandler(async (req, res) => {
  const transactions = await prisma.pointTransaction.findMany({
    where: { userId: req.user.id },
    orderBy: { created_at: 'desc' },
    take: 50
  });

  res.json({ success: true, data: transactions });
});

// ─── Badges ──────────────────────────

export const getUserBadges = asyncHandler(async (req, res) => {
  const badges = await prisma.userBadge.findMany({
    where: { userId: req.user.id },
    orderBy: { earned_at: 'desc' }
  });

  const data = badges.map((b) => ({
    badgeKey: b.badgeKey,
    label: BADGE_CATALOG[b.badgeKey]?.label ?? b.badgeKey,
    description: BADGE_CATALOG[b.badgeKey]?.description ?? '',
    earned_at: b.earned_at
  }));

  res.json({ success: true, data });
});

// ─── Forgot / Reset Password ──────────────────────────

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Selalu return success untuk keamanan (jangan reveal apakah email terdaftar)
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

    await prisma.user.update({
      where: { id: user.id },
      data: { reset_token: resetToken, reset_token_expiry: expiry }
    });

    // B-1 (CRITICAL): JANGAN bangun link dari header Host/protocol — header tersebut
    // bisa diatur attacker (Host: evil.com) sehingga token reset dikirim ke situs
    // mereka → account takeover. Satu-satunya sumber kebenaran adalah FRONTEND_URL.
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    try {
      await sendMail({
        to: email,
        subject: 'Reset Password - English Club Vokasi UB',
        text: `Klik tautan berikut untuk reset password Anda (berlaku 1 jam): ${resetLink}`,
      });
    } catch (err) {
      // Jangan biarkan kegagalan SMTP mengubah response (status/waktu) dibanding kasus
      // "email tidak terdaftar" — itu akan jadi celah untuk menebak email yang terdaftar.
      console.error('[forgotPassword] gagal kirim email reset:', err.message);
    }
  }

  res.json({
    success: true,
    message: 'Jika email terdaftar, tautan reset password akan dikirim. Cek server console untuk link (dev mode).'
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ success: false, error: { message: 'Token dan password baru wajib diisi' } });
  }

  const user = await prisma.user.findUnique({ where: { reset_token: token } });

  if (!user) {
    return res.status(400).json({ success: false, error: { message: 'Token tidak valid atau sudah digunakan' } });
  }

  if (user.reset_token_expiry && new Date() > user.reset_token_expiry) {
    return res.status(400).json({ success: false, error: { message: 'Token sudah kedaluwarsa. Silakan request ulang.' } });
  }

  const password_hash = await bcrypt.hash(password, 10);

  // B-5: invalidasi semua token yang diterbitkan sebelum reset password.
  const password_changed_at = new Date();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password_hash,
      password_changed_at,
      reset_token: null,
      reset_token_expiry: null
    }
  });

  res.json({ success: true, message: 'Password berhasil direset. Silakan login dengan password baru.' });
});

// ─── Admin User Management ──────────────────────────

// Drill-down satu user: profil inti + kelas yang diikuti + riwayat attempt kuis + badge.
// Dipakai admin untuk investigasi ("kenapa siswa ini gak bisa ulangi kuis?") tanpa harus
// cari satu-satu lewat halaman quiz per kelas.
export const getUserDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, email: true, nim: true, full_name: true, role: true, status: true,
      program_studi: true, angkatan: true, phone: true, points: true, streak_days: true,
      created_at: true
    }
  });
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'User tidak ditemukan' } });
  }

  const [enrollments, attempts, badges] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId: id },
      orderBy: { joined_at: 'desc' },
      include: { class: { select: { id: true, name: true } } }
    }),
    prisma.quizAttempt.findMany({
      where: { userId: id },
      orderBy: { created_at: 'desc' },
      take: 50,
      include: { quiz: { select: { id: true, title: true, class: { select: { id: true, name: true } } } } }
    }),
    prisma.userBadge.findMany({ where: { userId: id }, orderBy: { earned_at: 'desc' } })
  ]);

  res.json({
    success: true,
    data: {
      user,
      classes: enrollments.map((e) => ({ id: e.class.id, name: e.class.name, joined_at: e.joined_at })),
      quizAttempts: attempts.map((a) => ({
        id: a.id, score: a.score, created_at: a.created_at,
        quizId: a.quiz.id, quizTitle: a.quiz.title, classId: a.quiz.class.id, className: a.quiz.class.name
      })),
      badges: badges.map((b) => ({ badgeKey: b.badgeKey, earned_at: b.earned_at }))
    }
  });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 25));
  const { search, status, role } = req.query;

  const where = {
    ...(status ? { status } : {}),
    ...(role ? { role } : {}),
    ...(search
      ? {
          OR: [
            { full_name: { contains: search } },
            { email: { contains: search } },
            { nim: { contains: search } }
          ]
        }
      : {})
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { created_at: 'desc' },
      select: {
        id: true, email: true, nim: true, full_name: true,
        role: true, status: true, program_studi: true,
        angkatan: true, points: true, created_at: true
      }
    }),
    prisma.user.count({ where })
  ]);

  res.json({ success: true, data: { items: users, total, page, pageSize } });
});

export const createUser = asyncHandler(async (req, res) => {
  const { email, password, nim, full_name, role, program_studi, angkatan, phone } = req.body;

  const existingUser = await prisma.user.findFirst({ where: { OR: [{ email }, { nim }] } });
  if (existingUser) {
    return res.status(400).json({ success: false, error: { message: 'Email atau NIM sudah terdaftar' } });
  }

  const password_hash = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      email, password_hash, nim, full_name,
      role: role || 'member',
      status: 'active',
      program_studi,
      angkatan: angkatan ? parseInt(angkatan) : null,
      phone
    }
  });

  res.status(201).json({
    success: true,
    message: `User ${newUser.full_name} berhasil dibuat dengan role ${newUser.role}`,
    data: { id: newUser.id, email: newUser.email, role: newUser.role, status: newUser.status }
  });
});

// Edit detail inti user (nama, email, NIM, dll) — sengaja admin-only. User sendiri hanya bisa
// ubah bio/phone/program_studi/avatar_url lewat updateProfile; kalau data intinya salah ketik
// saat daftar, cuma admin yang bisa mengoreksinya di sini.
export const updateUserByAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { full_name, email, nim, program_studi, angkatan, phone } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'User tidak ditemukan' } });
  }

  if (email !== undefined || nim !== undefined) {
    const conflict = await prisma.user.findFirst({
      where: {
        id: { not: id },
        OR: [
          ...(email !== undefined ? [{ email }] : []),
          ...(nim !== undefined ? [{ nim }] : [])
        ]
      }
    });
    if (conflict) {
      return res.status(400).json({ success: false, error: { message: 'Email atau NIM sudah dipakai user lain' } });
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(full_name !== undefined && { full_name }),
      ...(email !== undefined && { email }),
      ...(nim !== undefined && { nim }),
      ...(program_studi !== undefined && { program_studi }),
      ...(angkatan !== undefined && { angkatan: angkatan === null ? null : parseInt(angkatan) }),
      ...(phone !== undefined && { phone })
    }
  });

  res.json({ success: true, message: `Data user ${updated.full_name} berhasil diperbarui` });
});

// Mengaktifkan user — dipakai untuk approve akun pending BARU MAUPUN membuka blokir akun
// yang sebelumnya diblokir (tombol "Aktifkan" di AdminUsersPage memanggil endpoint yang sama
// untuk kedua status ini, jadi keduanya harus diterima di sini).
export const approveUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'User tidak ditemukan' } });
  }

  if (user.status === 'active') {
    return res.status(400).json({ success: false, error: { message: `User ${user.full_name} sudah aktif.` } });
  }

  const wasBlocked = user.status === 'blocked';

  await prisma.user.update({
    where: { id },
    data: { status: 'active' }
  });

  await createNotification({
    userId: id,
    type: 'account_approved',
    message: wasBlocked
      ? 'Akun Anda telah diaktifkan kembali oleh admin.'
      : 'Akun Anda telah disetujui admin. Selamat belajar di English Club Vokasi UB!',
    link: '/dashboard'
  });

  res.json({ success: true, message: `User ${user.full_name} telah diaktifkan` });
});

export const adjustUserPoints = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, description } = req.body;

  // B-7: clamp poin dari read di luar transaction → race condition: dua
  // pengurangan paralel membaca poin yang sama lalu keduanya decrement → poin
  // bisa negatif. Kunci baris dengan FOR UPDATE & clamp di dalam transaction.
  const result = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw`SELECT points, full_name FROM \`User\` WHERE id = ${id} FOR UPDATE`;
    const current = rows[0];
    if (!current) return null;

    // Jangan sampai poin jadi negatif
    const finalAmount = amount < 0 ? -Math.min(Math.abs(amount), current.points) : amount;
    if (finalAmount === 0) {
      return { zero: true, full_name: current.full_name };
    }

    await tx.$executeRaw`UPDATE \`User\` SET points = points + ${finalAmount} WHERE id = ${id}`;
    await tx.pointTransaction.create({
      data: { userId: id, type: 'admin', amount: finalAmount, description }
    });

    return { finalAmount, full_name: current.full_name };
  });

  if (!result) {
    return res.status(404).json({ success: false, error: { message: 'User tidak ditemukan' } });
  }
  if (result.zero) {
    return res.status(400).json({ success: false, error: { message: 'Poin user sudah 0, tidak bisa dikurangi lagi' } });
  }

  // B-11: tipe notifikasi salah — pakai 'points_adjusted', bukan 'account_approved'.
  await createNotification({
    userId: id,
    type: 'points_adjusted',
    message: result.finalAmount > 0
      ? `Kamu mendapat ${result.finalAmount} poin dari admin: ${description}`
      : `${Math.abs(result.finalAmount)} poin kamu dikurangi admin: ${description}`
  });

  res.json({ success: true, message: `Poin ${result.full_name} berhasil disesuaikan (${result.finalAmount > 0 ? '+' : ''}${result.finalAmount})` });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'User tidak ditemukan' } });
  }

  if (user.status !== 'pending') {
    return res.status(400).json({
      success: false,
      error: { message: 'Hanya user berstatus pending yang bisa dihapus permanen. Gunakan "Blokir" untuk user aktif.' }
    });
  }

  // B-13: cascade harus transaksional dan lengkap. Versi lama sequential &
  // melewatkan enrollment + quizAttempt — kalau gagal di tengah, user hilang
  // tapi relasinya jadi yatim (foreign key menunjuk ke user yang tidak ada).
  await prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany({ where: { userId: id } });
    await tx.userBadge.deleteMany({ where: { userId: id } });
    await tx.pointTransaction.deleteMany({ where: { userId: id } });
    await tx.quizAttempt.deleteMany({ where: { userId: id } });
    await tx.enrollment.deleteMany({ where: { userId: id } });
    await tx.user.delete({ where: { id } });
  });

  res.json({ success: true, message: `User ${user.full_name} berhasil dihapus permanen` });
});

export const blockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'User tidak ditemukan' } });
  }

  await prisma.user.update({
    where: { id },
    data: { status: 'blocked' }
  });

  await createNotification({
    userId: id,
    type: 'account_blocked',
    message: 'Akun Anda telah diblokir oleh admin.'
  });

  res.json({ success: true, message: `User ${user.full_name} telah diblokir` });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles = ['member', 'instructor', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, error: { message: 'Role tidak valid. Pilihan: member, instructor, admin' } });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'User tidak ditemukan' } });
  }

  await prisma.user.update({
    where: { id },
    data: { role }
  });

  res.json({ success: true, message: `Role user ${user.full_name} diubah menjadi ${role}` });
});

// ─── Notifications ──────────────────────────

export const getNotifications = asyncHandler(async (req, res) => {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { created_at: 'desc' },
      take: 50
    }),
    prisma.notification.count({ where: { userId: req.user.id, read: false } })
  ]);

  res.json({ success: true, data: { notifications, unreadCount } });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== req.user.id) {
    return res.status(404).json({ success: false, error: { message: 'Notifikasi tidak ditemukan' } });
  }

  await prisma.notification.update({ where: { id }, data: { read: true } });

  res.json({ success: true });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, read: false },
    data: { read: true }
  });

  res.json({ success: true });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== req.user.id) {
    return res.status(404).json({ success: false, error: { message: 'Notifikasi tidak ditemukan' } });
  }

  await prisma.notification.delete({ where: { id } });

  res.json({ success: true });
});

export const clearReadNotifications = asyncHandler(async (req, res) => {
  await prisma.notification.deleteMany({
    where: { userId: req.user.id, read: true }
  });

  res.json({ success: true });
});
