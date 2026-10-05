# Deploy ke Vercel

## Prasyarat
- Akun [Vercel](https://vercel.com) (login dengan GitHub).
- Database MySQL yang **bisa diakses publik** dari serverless Vercel:
  PlanetScale, Railway, Aiven, atau MySQL cloud lainnya.
  Laragon hanya cocok untuk development lokal — `localhost:3306` tidak
  terjangkau dari fungsi serverless Vercel.

## Backend (repo ini)

1. Push repo ke GitHub.
2. Import ke Vercel (Add New → Project). Vercel membaca `vercel.json`:
   - build: `npx prisma generate`
   - output: serverless function `api/index.js` menangani semua route.
3. Set Environment Variables (Settings → Environment Variables):

   | Key | Contoh | Wajib |
   |---|---|---|
   | `DATABASE_URL` | `mysql://user:pass@host:3306/lso_vokasi_ub?charset=utf8mb4` | ✅ |
   | `JWT_SECRET` | hasil `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | ✅ |
   | `FRONTEND_URL` | `https://englishclub-vokasi.vercel.app` | ✅ |
   | `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | lihat `.env.example` | opsional (reset password via email) |

4. Deploy. Verifikasi: buka `https://<backend>.vercel.app/health` → harus
   mengembalikan `{"status":"ok",...}`.
5. Inisialisasi schema di database baru:

   ```bash
   # dari mesin lokal, arahkan ke database produksi
   DATABASE_URL="mysql://..." npx prisma migrate deploy
   ```

   Buat user admin pertama (lihat catatan di bawah).

## Frontend (repo `englishclub`)

1. Import repo Next.js ke Vercel (terdeteksi otomatis).
2. Set Environment Variable:

   | Key | Contoh |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://<backend>.vercel.app/api/v1` |

   ⚠️ `NEXT_PUBLIC_*` di-inline ke bundle saat **build**, jadi set variabelnya
   **sebelum** deploy pertama (atau Redeploy setelah mengubahnya).

3. Deploy. Setelah dapat domain, update `FRONTEND_URL` di backend supaya
   CORS mengizinkan origin frontend.

## Catatan

- **Rate limiting** memakai store in-memory per-instance. Serverless bisa
  spin-up beberapa instance, jadi limit 20/15 menit diterapkan per instance,
  bukan global. Jika butuh presisi, ganti ke store Redis (Upstash) nanti.
- **Cold start**: function serverless tidur setelah idle; request pertama
  butuh ~1-2 dtk. `/health` tidak memakai DB, jadi tetap cepat.
- `trust proxy` sudah aktif (B-2) sehingga `req.ip` benar di balik Vercel.
