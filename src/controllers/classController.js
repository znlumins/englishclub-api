import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middlewares/errorHandler.js';

const prisma = new PrismaClient();

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
  const { name, description } = req.body;

  const classData = await prisma.class.findUnique({ where: { id } });
  if (!classData) {
    return res.status(404).json({ success: false, error: { message: 'Kelas tidak ditemukan' } });
  }

  if (req.user.role === 'instructor' && classData.instructorId !== req.user.id) {
    return res.status(403).json({ success: false, error: { message: 'Forbidden. Bukan kelas Anda.' } });
  }

  const updated = await prisma.class.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description })
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

  // Delete all related data
  await prisma.quizAttempt.deleteMany({ where: { quiz: { classId: id } } });
  await prisma.question.deleteMany({ where: { quiz: { classId: id } } });
  await prisma.quiz.deleteMany({ where: { classId: id } });
  await prisma.material.deleteMany({ where: { classId: id } });
  await prisma.enrollment.deleteMany({ where: { classId: id } });
  await prisma.class.delete({ where: { id } });

  res.json({ success: true, message: 'Kelas berhasil dihapus' });
});

// Enroll in a class
export const enrollClass = asyncHandler(async (req, res) => {
  const { id: classId } = req.params;
  const userId = req.user.id;

  const existingEnrollment = await prisma.enrollment.findUnique({
    where: { userId_classId: { userId, classId } }
  });

  if (existingEnrollment) {
    return res.status(400).json({ success: false, error: { message: 'Anda sudah terdaftar di kelas ini' } });
  }

  await prisma.enrollment.create({
    data: { userId, classId }
  });

  // Gamification: Add +50 points for enrolling
  await prisma.user.update({
    where: { id: userId },
    data: { points: { increment: 50 } }
  });

  res.status(201).json({ success: true, message: 'Berhasil mendaftar ke kelas! +50 points' });
});

// Get single class detail with materials
export const getClassDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;

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

  res.json({ success: true, data: classDetail });
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
