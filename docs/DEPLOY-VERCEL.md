# Deploy ke Vercel

## Prasyarat
- Akun [Vercel](https://vercel.com) (login dengan GitHub).
- Database **TiDB Cloud Serverless** (drop-in MySQL, cocok dengan Prisma
  provider `mysql` di repo ini). Daftar di [tidbcloud.com](https://tidbcloud.com),
  buat cluster Serverless (region bebas, gratis 5GB — cukup untuk klub).

  > Mengapa TiDB, bukan Supabase: schema & seluruh raw SQL di repo ini MySQL
  > (backtick identifier + `SELECT ... FOR UPDATE`). Supabase adalah Postgres,
  > jadi raw SQL harus ditulis ulang dan 17 bug fix di lapisan data harus
  > diverifikasi ulang. TiDB kompatibel apa adanya.

## Backend (repo ini)

1. Push repo ke GitHub.
2. Import ke Vercel (Add New → Project). Vercel membaca `vercel.json`:
   - build: `npx prisma generate`
   - output: serverless function `api/index.js` menangani semua route.
3. Ambil connection string TiDB: dashboard TiDB → cluster → **Connect** →
   pilih tab **Prisma**. Set Environment Variables di Vercel:

   | Key | Contoh | Wajib |
   |---|---|---|
   | `DATABASE_URL` | `mysql://user:pass@gateway01.region.prod.aws.tidbcloud.com:4000/lso_vokasi_ub?sslaccept=accept_invalid_certs&charset=utf8mb4` | ✅ |
   | `JWT_SECRET` | hasil `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | ✅ |
   | `FRONTEND_URL` | `https://englishclub-vokasi.vercel.app` | ✅ |
   | `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | lihat `.env.example` | opsional (reset password via email) |

   Koneksi TiDB butuh TLS. Param `sslaccept=accept_invalid_certs` memakai CA
   yang sudah ter-install; untuk verifikasi ketat, unduh CA dari dashboard
   TiDB dan tambahkan `&sslca=/path/isrgrootx1.pem`.

4. Siapkan database (sekali saja, dari mesin lokal dengan `DATABASE_URL`
   produksi):

   ```bash
   # Buat database (sys adalah system DB, jangan dipakai)
   npx prisma db execute --url 'mysql://...@host:4000/test?sslaccept=accept_invalid_certs' --stdin <<'EOF'
   CREATE DATABASE IF NOT EXISTS lso_vokasi_ub CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
   EOF

   # Terapkan schema
   npx prisma migrate deploy
   ```

5. Deploy di Vercel. Verifikasi: buka `https://<backend>.vercel.app/health`
   → harus mengembalikan `{"status":"ok",...}`.

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
