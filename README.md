# Learning Management System — English Club Vokasi UB (LSO) 🚀

Aplikasi Web Learning Management System (LMS) interaktif untuk Lembaga Semi Otonom (LSO) English Club Fakultas Vokasi Universitas Brawijaya.

## 🌐 Live Application
* **Live Web App**: [https://lso-vokasi-app.onrender.com](https://lso-vokasi-app.onrender.com)
* **Health Check**: [https://lso-vokasi-app.onrender.com/health](https://lso-vokasi-app.onrender.com/health)

## 🛠️ Tech Stack
* **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS — repositori terpisah `englishclub`
* **Backend**: Node.js, Express.js, Prisma ORM (v5), JWT Authentication
* **Database**: MySQL (Laragon / cloud MySQL, `charset=utf8mb4`)
* **Deployment**: Render.com Web Services (MySQL database), Vercel (frontend)

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
