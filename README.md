# LMS English Club Vokasi UB — Backend API 🚀

REST API server untuk Learning Management System (LMS) English Club Fakultas Vokasi Universitas Brawijaya.

## 🌐 Live API Service
* **API Base URL**: [https://api.englishclubfvub.web.id](https://api.englishclubfvub.web.id)
* **Health Check**: [https://api.englishclubfvub.web.id/health](https://api.englishclubfvub.web.id/health)
* **Frontend Web**: [https://englishclubfvub.web.id](https://englishclubfvub.web.id)

## 🛠️ Tech Stack
* **Backend**: Node.js, Express.js 5, Prisma ORM (v5), JWT Authentication
* **Database**: MySQL / TiDB Cloud Serverless (`charset=utf8mb4`)
* **Deployment**: Vercel Serverless Functions (`api/index.js`)
* **Frontend App**: Repositori terpisah `englishclub` (Next.js 14 App Router)

## 🔐 Environment Variables

Salin `.env.example` ke `.env` dan sesuaikan:

```bash
cp .env.example .env
```

Wajib untuk production:
* `DATABASE_URL` — connection string MySQL
* `JWT_SECRET` — secret kuat (generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
* `FRONTEND_URL` — origin frontend yang diizinkan CORS (mis. `https://englishclub-vokasi.vercel.app`)

## 💻 Cara Menjalankan Lokal
1. **Clone repository**:
   ```bash
   git clone https://github.com/znlumins/learning-management-system-for-lso-vokasi-ub.git
   cd learning-management-system-for-lso-vokasi-ub
   ```

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan aplikasi (Development)**:
   ```bash
   npm run dev
   ```

4. **Build untuk Produksi**:
   ```bash
   npm run build
   ```

5. **Database**: Prisma memakai migration history.
   ```bash
   # Development: terapkan migration & generate client
   npx prisma migrate deploy
   npx prisma generate

   # Setelah mengubah prisma/schema.prisma:
   npx prisma migrate dev --name <nama-perubahan>
   ```

> Catatan: aplikasi ini sebelumnya memakai `prisma db push` tanpa riwayat
> migration. Baseline `0_init` dibuat dari schema existing dan ditandai
> sebagai applied, sehingga database lokal tidak perlu di-reset.
