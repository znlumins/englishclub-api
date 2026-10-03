# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Member (pengguna utama):** mahasiswa anggota English Club Vokasi Universitas Brawijaya. Mendaftar kelas bahasa Inggris, mengakses materi (link/video/PDF), mengerjakan kuis, dan bersaing di leaderboard poin keaktifan. Sering dari HP; frustrasi utama bila status akun (pending/blocked) tidak dijelaskan dengan jelas.
- **Instructor:** mentor/dosen pengelola kelas. Mandiri mengelola kelas, materi, dan kuis miliknya, memantau peserta; tidak boleh menyentuh kelas instructor lain (403 ditegakkan).
- **Admin:** pengelola sistem. Memoderasi akun baru (pending/active/blocked), mengelola semua kelas & user, mewarisi hak instructor di semua kelas.

## Product Purpose

LMS single-tenant untuk English Club Vokasi UB: satu pintu terpusat untuk katalog kelas, materi, dan kuis, menggantikan distribusi manual via grup chat/spreadsheet. Gamifikasi (poin: enroll +50, kuis pertama +20, login harian +10; streak harian; leaderboard publik top-10) mendorong keaktifan member. Sukses = member mandiri mengikuti kelas tanpa bantuan admin/dev, dan instructor/admin bisa mengelola tanpa campur tangan developer.

## Positioning

Bukan marketplace kursus umum dan bukan platform live-class: LMS internal komunitas yang mengikat keaktifan anggota ke insentif poin & peringkat — sesuatu yang tidak bisa ditiru LMS generik tanpa mengadopsi struktur organisasi klub (approval admin, kepemilikan kelas per instructor, leaderboard keaktifan).

## Operating Context

- Registrasi member menghasilkan status `pending`; admin approve/blokir di `/admin/users`. Role instructor/admin di-set via database (belum ada UI).
- Alur inti member: register → login → dashboard → katalog kelas → enroll (+50 poin) → materi → kuis → skor otomatis → leaderboard.
- Alur instructor: hanya melihat kelas yang dia ampu; CRUD materi (title, url, type: link/video/pdf) dan kuis (buat/hapus; edit kuis belum ada).
- Non-goals: bukan video-conferencing, bukan sistem pembayaran, tidak multi-organisasi.

## Capabilities and Constraints

- Stack (sudah ditentukan repo, bukan keputusan baru): React 19 + TypeScript + MUI v9 SPA (Vite, `src/client/`), Express 5 + Prisma/SQLite, auth JWT + bcrypt, validasi Joi. API prefix `/api/v1`; dev: `npm run dev` (Express :3000) + `npm run dev:client` (Vite :5173, proxy `/api`).
- Aturan kode yang mengikat UI (requirement.md §7): styling wajib lewat theme token (`src/client/theme.ts`), dilarang hex/inline style mentah; halaman async wajib state loading/empty/error eksplisit; notifikasi via `useToast()`, konfirmasi destruktif via `useConfirm()`; `AppShell` satu-satunya sumber navigasi; landing page dilarang menampilkan data kelas palsu.
- Belum ada: reset password, verifikasi email, notifikasi approval akun, edit kuis, kuota kelas, upload avatar (hanya URL), automated test (keputusan eksplisit, sengaja ditunda).
- Poin kuis hanya diberikan pada attempt pertama per kuis per user (anti-exploit, selesai 2026-07-26).

## Brand Commitments

- Nama produk: English Club Vokasi UB ("English Club" sebagai wordmark).
- Logo: monogram "EC" gaya geometris/De Stijl, aset `src/client/assets/logo.png`, dipakai konsisten via komponen `<Brand />` di navbar landing, sidebar AppShell, dan header auth; favicon dari aset yang sama.
- Bahasa UI: Indonesia.
- Ikon fungsional wajib dari `@mui/icons-material` — dilarang emoji di UI, kode, maupun dokumen (design.md §8.7).

## Evidence on Hand

- `requirement.md`: PRD lengkap dengan peta situs, alur pengguna, status fitur per modul, dan debt backlog ter-audit terhadap kode (revisi 2026-07-26).
- `design.md`: spesifikasi desain "Modern SaaS/Editorial" (Linear/Stripe/Notion-like) lengkap dengan token warna (indigo `#4F46E5` di atas slate), tipografi Inter, spacing/radius/shadow, komponen, dan pemetaan ke MUI theme — menjadi DESIGN.md proyek.
- Implementasi aktif: `src/client/` (React+MUI, migrasi Fase 6.1–6.4 selesai 2026-07-26) dan backend `src/` (Express, controllers/routes/middlewares).

## Product Principles

1. Satu pintu: semua kebutuhan member (kelas, materi, kuis, progres) tanpa koordinasi manual di luar sistem.
2. Kemandirian instructor: pengelolaan kelas tanpa perantara developer/admin.
3. Keaktifan dihargai: setiap kontribusi (enroll, kuis, login harian) terlihat dan berimbas pada poin, streak, dan peringkat.
4. Transparansi status: setiap keadaan akun/proses (pending, blocked, kosong, gagal) selalu disertai penjelasan yang jelas bagi pengguna.
5. Konsistensi sistem desain: token theme adalah satu-satunya jalan styling; tidak ada pengecualian per halaman.
