import prisma from '../utils/prisma.js';
import { createNotification } from './notifications.js';


export const BADGE_CATALOG = {
  'streak-7': { label: 'Streak 7 Hari', description: 'Login 7 hari berturut-turut' },
  'streak-30': { label: 'Streak 30 Hari', description: 'Login 30 hari berturut-turut' },
  'quiz-master': { label: 'Quiz Master', description: 'Rata-rata skor ≥ 90 di minimal 3 kuis berbeda' },
  'class-collector': { label: 'Class Collector', description: 'Terdaftar di 3 kelas atau lebih' },
  'top-10': { label: 'Top 10', description: 'Pernah masuk 10 besar leaderboard' },
};

// Badge check/award bersifat best-effort — jangan sampai gagal di sini membuat aksi utama
// (login, enroll, submit kuis) yang sudah commit tampak error ke user. Create bisa gagal
// karena race (dua request bersamaan lolos check yang sama) — @@unique([userId, badgeKey])
// di schema mencegah data ganda, kita cukup abaikan error unique-constraint tsb.
async function awardBadge(userId, badgeKey) {
  try {
    const existing = await prisma.userBadge.findUnique({
      where: { userId_badgeKey: { userId, badgeKey } }
    });
    if (existing) return;

    await prisma.userBadge.create({ data: { userId, badgeKey } });

    const badge = BADGE_CATALOG[badgeKey];
    await createNotification({
      userId,
      type: 'badge_earned',
      message: `Selamat! Kamu mendapatkan badge "${badge.label}" — ${badge.description}`
    });
  } catch (err) {
    console.error(`[awardBadge] gagal memberi badge "${badgeKey}" ke user ${userId}:`, err.message);
  }
}

export async function checkStreakBadges(userId, streakDays) {
  if (streakDays >= 7) await awardBadge(userId, 'streak-7');
  if (streakDays >= 30) await awardBadge(userId, 'streak-30');
}

export async function checkClassCollectorBadge(userId) {
  const count = await prisma.enrollment.count({ where: { userId } });
  if (count >= 3) await awardBadge(userId, 'class-collector');
}

export async function checkQuizMasterBadge(userId) {
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },
    select: { quizId: true, score: true }
  });

  const bestByQuiz = new Map();
  for (const a of attempts) {
    const prev = bestByQuiz.get(a.quizId);
    if (prev === undefined || a.score > prev) bestByQuiz.set(a.quizId, a.score);
  }

  if (bestByQuiz.size >= 3) {
    const scores = [...bestByQuiz.values()];
    const avg = scores.reduce((sum, v) => sum + v, 0) / scores.length;
    if (avg >= 90) await awardBadge(userId, 'quiz-master');
  }
}

export async function checkTop10Badge(userId) {
  const topUsers = await prisma.user.findMany({
    where: { status: 'active' },
    orderBy: { points: 'desc' },
    take: 10,
    select: { id: true }
  });

  if (topUsers.some((u) => u.id === userId)) {
    await awardBadge(userId, 'top-10');
  }
}
