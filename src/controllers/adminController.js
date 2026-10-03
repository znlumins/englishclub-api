import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middlewares/errorHandler.js';

const prisma = new PrismaClient();

export const getStats = asyncHandler(async (req, res) => {
  const [usersByStatus, totalClasses, totalQuizzes, totalAttempts, topClasses, quizTakers] = await Promise.all([
    prisma.user.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.class.count(),
    prisma.quiz.count(),
    prisma.quizAttempt.count(),
    prisma.class.findMany({
      orderBy: { enrollments: { _count: 'desc' } },
      take: 5,
      select: { id: true, name: true, _count: { select: { enrollments: true } } }
    }),
    prisma.quizAttempt.groupBy({ by: ['userId'] })
  ]);

  const statusCounts = { pending: 0, active: 0, blocked: 0 };
  usersByStatus.forEach((s) => {
    statusCounts[s.status] = s._count.id;
  });
  const totalUsers = statusCounts.pending + statusCounts.active + statusCounts.blocked;

  // Perkiraan tingkat penyelesaian: member aktif yang pernah submit minimal 1 kuis
  // B-16: quizTakers di-groupBy dari SEMUA user (termasuk yang kini
  // blocked/pending) sehingga pembilang bisa melebihi penyebut (active) →
  // persentase >100%. Filter penghitung ke user active saja.
  const activeQuizTakers = quizTakers.length
    ? (
        await prisma.user.findMany({
          where: { id: { in: quizTakers.map((q) => q.userId) }, status: 'active' },
          select: { id: true }
        })
      ).length
    : 0;

  const completionRate = statusCounts.active > 0
    ? Math.round((activeQuizTakers / statusCounts.active) * 100)
    : 0;

  res.json({
    success: true,
    data: {
      users: { ...statusCounts, total: totalUsers },
      totalClasses,
      totalQuizzes,
      totalAttempts,
      completionRate,
      topClasses: topClasses.map((c) => ({ id: c.id, name: c.name, enrollments: c._count.enrollments }))
    }
  });
});

// Audit riwayat transaksi poin lintas user (opsional filter per user)
export const getPointTransactions = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 25));
  const { userId } = req.query;

  const where = userId ? { userId } : {};

  const [transactions, total] = await Promise.all([
    prisma.pointTransaction.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { created_at: 'desc' },
      include: { user: { select: { full_name: true, nim: true } } }
    }),
    prisma.pointTransaction.count({ where })
  ]);

  res.json({ success: true, data: { items: transactions, total, page, pageSize } });
});
