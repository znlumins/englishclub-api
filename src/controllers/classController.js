import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { createNotificationForMany } from '../utils/notifications.js';
import { checkClassCollectorBadge, checkTop10Badge } from '../utils/badges.js';

const prisma = new PrismaClient();

// Kurangi poin +50 yang didapat saat enroll (dipakai saat unenroll/dikeluarkan),
// supaya keluar-masuk kelas tidak jadi celah farming poin. Tidak sampai negatif.
// B-7: read-modify-write dilakukan di dalam transaction dengan FOR UPDATE supaya
// dua operasi paralel tidak membaca poin stale lalu decrement 2x sampai negatif.
async function deductEnrollPoints(userId, className, tx) {
  const db = tx ?? prisma;
  const rows = await db.$queryRaw`SELECT points FROM \`User\` WHERE id = ${userId} FOR UPDATE`;
  const points = rows[0]?.points ?? 0;
  const deduction = Math.min(50, points);
  if (deduction <= 0) return;

  await db.$executeRaw`UPDATE \`User\` SET points = points - ${deduction} WHERE id = ${userId}`;
  await db.pointTransaction.create({
    data: {
      userId,
      type: 'enroll',
      amount: -deduction,
      description: `Keluar dari kelas "${className}"`
    }
  });
}

// Get all classes
export const getAllClasses = asyncHandler(async (req, res) => {
  const classes = await prisma.class.findMany({
    include: {
      instructor: { select: { id: true, full_name: true } },
      _count: { select: { enrollments: true } }
    }
  });
  res.json({ success: true, data: classes });
});

// Create a new class (Admin/Instructor)
export const createClass = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const newClass = await prisma.class.create({
    data: { name, description, instructorId: req.user.id }
  });

  res.status(201).json({ success: true, data: newClass });
});

// Update class
export const updateClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, instructorId } = req.body;

  const classData = await prisma.class.findUnique({ where: { id } });
  if (!classData) {
    return res.status(404).json({ success: false, error: { message: 'Kelas tidak ditemukan' } });
  }

  if (req.user.role === 'instructor' && classData.instructorId !== req.user.id) {
    return res.status(403).json({ success: false, error: { message: 'Forbidden. Bukan kelas Anda.' } });
  }

  // Hanya admin yang boleh reassign instructor
  if (instructorId !== undefined && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: { message: 'Hanya admin yang bisa memindahkan kelas ke instructor lain' } });
  }

  if (instructorId !== undefined) {
    const newInstructor = await prisma.user.findUnique({ where: { id: instructorId } });
    if (!newInstructor || !['instructor', 'admin'].includes(newInstructor.role)) {
      return res.status(400).json({ success: false, error: { message: 'Instructor tujuan tidak valid' } });
    }
  }

  const updated = await prisma.class.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(instructorId !== undefined && { instructorId })
    }
  });

  res.json({ success: true, data: updated, message: 'Kelas berhasil diperbarui' });
});

// Delete class
export const deleteClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const classData = await prisma.class.findUnique({ where: { id } });
  if (!classData) {
    return res.status(404).json({ success: false, error: { message: 'Kelas tidak ditemukan' } });
  }

  if (req.user.role === 'instructor' && classData.instructorId !== req.user.id) {
    return res.status(403).json({ success: false, error: { message: 'Forbidden. Bukan kelas Anda.' } });
  }

  const quizzes = await prisma.quiz.findMany({ where: { classId: id }, select: { id: true } });

  // B-6: seluruh delete berjenjang harus atomic. Tanpa transaction, kegagalan
  // di tengah (mis. koneksi terputus) meninggalkan data yatim: kuis tanpa kelas,
  // enrollment menunjuk kelas yang tidak ada, dll.
  await prisma.$transaction(async (tx) => {
    await tx.quizAttempt.deleteMany({ where: { quiz: { classId: id } } });
    await tx.question.deleteMany({ where: { quiz: { classId: id } } });
    await tx.quiz.deleteMany({ where: { classId: id } });
    await tx.material.deleteMany({ where: { classId: id } });
    await tx.enrollment.deleteMany({ where: { classId: id } });
    await tx.class.delete({ where: { id } });
  });

  // Bersihkan notifikasi lama yang link-nya menunjuk ke kelas/kuis yang baru saja dihapus
  const danglingLinks = [`/classes/${id}`, ...quizzes.map((q) => `/quiz/${q.id}`)];
  await prisma.notification.deleteMany({ where: { link: { in: danglingLinks } } });

  res.json({ success: true, message: 'Kelas berhasil dihapus' });
});

// Enroll in a class
export const enrollClass = asyncHandler(async (req, res) => {
  const { id: classId } = req.params;
  const userId = req.user.id;

  // Cek status user — hanya yang active bisa enroll
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true }
  });

  if (!user || user.status !== 'active') {
    return res.status(403).json({ success: false, error: { message: 'Akun Anda belum aktif. Tunggu persetujuan admin.' } });
  }

  const existingEnrollment = await prisma.enrollment.findUnique({
    where: { userId_classId: { userId, classId } }
  });

  if (existingEnrollment) {
    return res.status(400).json({ success: false, error: { message: 'Anda sudah terdaftar di kelas ini' } });
  }

  // Dapatkan nama kelas untuk deskripsi transaksi
  const classData = await prisma.class.findUnique({ where: { id: classId }, select: { name: true } });
  if (!classData) {
    return res.status(404).json({ success: false, error: { message: 'Kelas tidak ditemukan' } });
  }

  // B-6: enrollment + penambahan poin + catat transaksi wajib atomic. Tanpa ini,
  // kalau gagal di tengah jalan user sudah ter-enroll tapi tanpa poin (atau
  // sebaliknya) — data inkonsisten.
  try {
    await prisma.$transaction(async (tx) => {
      // Unique constraint userId_classId menjadi pertahanan terakhir melawan
      // enroll paralel (double-click / multi-tab) — meski cek di atas lolos.
      await tx.enrollment.create({ data: { userId, classId } });

      // Gamifikasi: +50 poin saat enroll
      await tx.user.update({
        where: { id: userId },
        data: { points: { increment: 50 } }
      });

      await tx.pointTransaction.create({
        data: {
          userId,
          type: 'enroll',
          amount: 50,
          description: `Enroll kelas "${classData?.name ?? classId}"`
        }
      });
    });
  } catch (err) {
    if (err?.code === 'P2002') {
      return res.status(400).json({ success: false, error: { message: 'Anda sudah terdaftar di kelas ini' } });
    }
    throw err;
  }

  await checkClassCollectorBadge(userId);
  await checkTop10Badge(userId);

  res.status(201).json({ success: true, message: 'Berhasil mendaftar ke kelas! +50 points' });
});

// Unenroll from a class (self)
export const unenrollClass = asyncHandler(async (req, res) => {
  const { id: classId } = req.params;
  const userId = req.user.id;

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_classId: { userId, classId } }
  });

  if (!enrollment) {
    return res.status(404).json({ success: false, error: { message: 'Anda tidak terdaftar di kelas ini' } });
  }

  const classData = await prisma.class.findUnique({ where: { id: classId }, select: { name: true } });

  // B-6: hapus enrollment & pengurangan poin harus atomic — kalau pengurangan
  // gagal, user keluar kelas tapi poin +50-nya tidak dikurangkan (celah farming).
  await prisma.$transaction(async (tx) => {
    await tx.enrollment.delete({ where: { userId_classId: { userId, classId } } });
    // Kurangi poin secara simetris dengan poin yang didapat saat enroll,
    // supaya keluar-masuk kelas tidak jadi cara memfarming poin.
    await deductEnrollPoints(userId, classData?.name ?? classId, tx);
  });

  res.json({ success: true, message: 'Berhasil keluar dari kelas' });
});

// Get single class detail with materials
export const getClassDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { id: userId, role } = req.user;

  const classDetail = await prisma.class.findUnique({
    where: { id },
    include: {
      instructor: { select: { id: true, full_name: true } },
      materials: { orderBy: { created_at: 'asc' } }
    }
  });

  if (!classDetail) {
    return res.status(404).json({ success: false, error: { message: 'Kelas tidak ditemukan' } });
  }

  // Preview kelas (nama, deskripsi, judul & tipe materi) boleh dilihat siapa saja yang login,
  // tapi URL materi aslinya hanya untuk yang sudah enroll/instructor pemilik/admin —
  // supaya insentif "+50 poin buat enroll" tidak bisa dilewati lewat panggilan API langsung.
  const isPrivileged = role === 'admin' || (role === 'instructor' && classDetail.instructorId === userId);
  let hasAccess = isPrivileged;
  if (!hasAccess) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_classId: { userId, classId: id } }
    });
    hasAccess = Boolean(enrollment);
  }

  const materials = hasAccess
    ? classDetail.materials
    : classDetail.materials.map((m) => ({ ...m, url: '' }));

  res.json({ success: true, data: { ...classDetail, materials } });
});

// Add Material to Class
export const addMaterial = asyncHandler(async (req, res) => {
  const { id: classId } = req.params;
  const { title, url, type } = req.body;

  const classData = await prisma.class.findUnique({ where: { id: classId } });
  if (!classData) {
    return res.status(404).json({ success: false, error: { message: 'Kelas tidak ditemukan' } });
  }

  if (req.user.role === 'instructor' && classData.instructorId !== req.user.id) {
    return res.status(403).json({ success: false, error: { message: 'Forbidden. Bukan kelas Anda.' } });
  }

  const material = await prisma.material.create({
    data: { title, url, type: type || 'link', classId }
  });

  const enrolledUserIds = (
    await prisma.enrollment.findMany({ where: { classId }, select: { userId: true } })
  ).map((e) => e.userId);

  await createNotificationForMany(enrolledUserIds, {
    type: 'new_material',
    message: `Materi baru "${material.title}" ditambahkan di kelas "${classData.name}"`,
    link: `/classes/${classId}`
  });

  res.status(201).json({ success: true, data: material, message: 'Materi berhasil ditambahkan' });
});

// Update Material
export const updateMaterial = asyncHandler(async (req, res) => {
  const { id: classId, materialId } = req.params;
  const { title, url, type } = req.body;

  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (!material || material.classId !== classId) {
    return res.status(404).json({ success: false, error: { message: 'Materi tidak ditemukan' } });
  }

  const classData = await prisma.class.findUnique({ where: { id: classId } });
  if (req.user.role === 'instructor' && classData.instructorId !== req.user.id) {
    return res.status(403).json({ success: false, error: { message: 'Forbidden. Bukan kelas Anda.' } });
  }

  const updated = await prisma.material.update({
    where: { id: materialId },
    data: {
      ...(title !== undefined && { title }),
      ...(url !== undefined && { url }),
      ...(type !== undefined && { type })
    }
  });

  res.json({ success: true, data: updated, message: 'Materi berhasil diperbarui' });
});

// Delete Material
export const deleteMaterial = asyncHandler(async (req, res) => {
  const { id: classId, materialId } = req.params;

  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (!material || material.classId !== classId) {
    return res.status(404).json({ success: false, error: { message: 'Materi tidak ditemukan' } });
  }

  const classData = await prisma.class.findUnique({ where: { id: classId } });
  if (req.user.role === 'instructor' && classData.instructorId !== req.user.id) {
    return res.status(403).json({ success: false, error: { message: 'Forbidden. Bukan kelas Anda.' } });
  }

  await prisma.material.delete({ where: { id: materialId } });

  res.json({ success: true, message: 'Materi berhasil dihapus' });
});

// Get Enrolled Classes for User
export const getMyClasses = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      class: {
        include: {
          instructor: { select: { full_name: true } }
        }
      }
    }
  });

  const myClasses = enrollments.map(e => e.class);
  res.json({ success: true, data: myClasses });
});

// Get Managed Classes (Admin/Instructor)
export const getManagedClasses = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  let whereClause = {};
  if (req.user.role === 'instructor') {
    whereClause.instructorId = userId;
  }

  const classes = await prisma.class.findMany({
    where: whereClause,
    include: {
      _count: { select: { enrollments: true, materials: true } }
    }
  });

  res.json({ success: true, data: classes });
});

// Get Class Members
export const getClassMembers = asyncHandler(async (req, res) => {
  const { id: classId } = req.params;

  const classData = await prisma.class.findUnique({ where: { id: classId } });
  if (!classData) {
    return res.status(404).json({ success: false, error: { message: 'Kelas tidak ditemukan' } });
  }

  if (req.user.role === 'instructor' && classData.instructorId !== req.user.id) {
    return res.status(403).json({ success: false, error: { message: 'Forbidden. Bukan kelas Anda.' } });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { classId },
    include: {
      user: { select: { id: true, full_name: true, nim: true, email: true } }
    }
  });

  const members = enrollments.map(e => ({
    ...e.user,
    enrolled_at: e.joined_at
  }));

  res.json({ success: true, data: members });
});

// Remove Member from Class (Admin/Instructor)
export const removeMember = asyncHandler(async (req, res) => {
  const { id: classId, userId } = req.params;

  const classData = await prisma.class.findUnique({ where: { id: classId } });
  if (!classData) {
    return res.status(404).json({ success: false, error: { message: 'Kelas tidak ditemukan' } });
  }

  if (req.user.role === 'instructor' && classData.instructorId !== req.user.id) {
    return res.status(403).json({ success: false, error: { message: 'Forbidden. Bukan kelas Anda.' } });
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_classId: { userId, classId } }
  });

  if (!enrollment) {
    return res.status(404).json({ success: false, error: { message: 'User tidak terdaftar di kelas ini' } });
  }

  // B-6: sama seperti unenroll — delete enrollment & pengurangan poin atomic.
  await prisma.$transaction(async (tx) => {
    await tx.enrollment.delete({
      where: { userId_classId: { userId, classId } }
    });

    await deductEnrollPoints(userId, classData.name, tx);
  });

  res.json({ success: true, message: 'Peserta berhasil dikeluarkan dari kelas' });
});

// Get Class Leaderboard (ranking peserta berdasarkan rata-rata skor kuis terbaik di kelas ini)
export const getClassLeaderboard = asyncHandler(async (req, res) => {
  const { id: classId } = req.params;
  const { id: userId, role } = req.user;

  const classData = await prisma.class.findUnique({ where: { id: classId } });
  if (!classData) {
    return res.status(404).json({ success: false, error: { message: 'Kelas tidak ditemukan' } });
  }

  const isPrivileged = role === 'admin' || (role === 'instructor' && classData.instructorId === userId);
  if (!isPrivileged) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_classId: { userId, classId } }
    });
    if (!enrollment) {
      return res.status(403).json({ success: false, error: { message: 'Anda harus terdaftar di kelas ini untuk melihat leaderboard' } });
    }
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { classId },
    include: { user: { select: { id: true, full_name: true, avatar_url: true } } }
  });

  const quizzes = await prisma.quiz.findMany({ where: { classId }, select: { id: true } });
  const quizIds = quizzes.map((q) => q.id);

  const attempts = quizIds.length
    ? await prisma.quizAttempt.findMany({
        where: { quizId: { in: quizIds } },
        select: { userId: true, quizId: true, score: true }
      })
    : [];

  // Ambil skor terbaik per (user, quiz), lalu rata-ratakan antar kuis
  const bestScoreByUserQuiz = new Map();
  for (const a of attempts) {
    const key = `${a.userId}:${a.quizId}`;
    const prev = bestScoreByUserQuiz.get(key);
    if (prev === undefined || a.score > prev) bestScoreByUserQuiz.set(key, a.score);
  }

  const totalsByUser = new Map();
  for (const [key, score] of bestScoreByUserQuiz.entries()) {
    const userId = key.split(':')[0];
    const entry = totalsByUser.get(userId) ?? { total: 0, count: 0 };
    entry.total += score;
    entry.count += 1;
    totalsByUser.set(userId, entry);
  }

  const leaderboard = enrollments.map((e) => {
    const entry = totalsByUser.get(e.user.id);
    return {
      id: e.user.id,
      full_name: e.user.full_name,
      avatar_url: e.user.avatar_url,
      averageScore: entry ? Math.round(entry.total / entry.count) : null,
      quizzesCompleted: entry?.count ?? 0
    };
  });

  leaderboard.sort((a, b) => (b.averageScore ?? -1) - (a.averageScore ?? -1));

  res.json({ success: true, data: leaderboard });
});
