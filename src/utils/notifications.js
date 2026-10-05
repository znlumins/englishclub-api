import prisma from '../utils/prisma.js';


// Notifikasi bersifat best-effort — kegagalannya tidak boleh membuat aksi utama
// (yang sudah commit ke DB, mis. enroll/submit kuis/tambah materi) tampak gagal ke user.
export async function createNotification({ userId, type, message, link }) {
  try {
    return await prisma.notification.create({ data: { userId, type, message, link } });
  } catch (err) {
    console.error('[createNotification] gagal membuat notifikasi:', err.message);
  }
}

export async function createNotificationForMany(userIds, { type, message, link }) {
  const uniqueIds = [...new Set(userIds)];
  if (uniqueIds.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: uniqueIds.map((userId) => ({ userId, type, message, link })),
    });
  } catch (err) {
    console.error('[createNotificationForMany] gagal membuat notifikasi:', err.message);
  }
}
