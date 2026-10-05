import { PrismaClient } from '@prisma/client';

// Di serverless (Vercel) set request bisa jalan di instance baru, dan setiap
// cold start membuat PrismaClient baru. Tanpa cache global, 7 file yang masing-
// masing `new PrismaClient()` akan membuka puluhan koneksi sampai DB habis.
// globalThis dipertahankan sepanjang hidup instance, jadi client cukup dibuat
// sekali dan dipakai ulang oleh seluruh modul.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ??
  (globalForPrisma.__prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
  }));

export default prisma;
