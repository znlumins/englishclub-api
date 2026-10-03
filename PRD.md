# PRD — LMS English Club Vokasi UB

> Dokumen ini mengatur **kebutuhan produk & kualitas fungsional**. Tidak membahas desain visual.
> Sumber: audit kode aktual 2026-10-02 (backend Express + frontend React), `requirement.md`, `PRODUCT.md`.
> Status: hasil verifikasi terhadap kode yang berjalan, bukan asumsi.

## 1. Ringkasan produk

LMS single-tenant untuk English Club Vokasi Universitas Brawijaya. Satu pintu terpusat untuk katalog kelas, materi, dan kuis, menggantikan distribusi manual via grup chat/spreadsheet. Gamifikasi (poin, streak, leaderboard, badge) mendorong keaktifan member.

**Sukses:** member mandiri mengikuti kelas tanpa bantuan admin/dev; instructor/admin mengelola tanpa campur tangan developer.

## 2. Aktor

| Aktor | Kewajiban & batasan |
|---|---|
| Member | Mahasiswa anggota klub. Mendaftar kelas, akses materi, kerjakan kuis, bersaing di leaderboard. Sering akses dari HP. |
| Instructor | Mentor/dosen pengelola. Mandiri kelola kelas/materi/kuis miliknya; **tidak boleh** menyentuh kelas instructor lain (403 wajib ditegakkan). |
| Admin | Pengelola sistem. Moderasi akun (pending/active/blocked), kelola semua kelas & user, mewarisi hak instructor di semua kelas. |

## 3. Status fitur (diverifikasi terhadap kode)

### 3.1 Selesai & terpakai
- Registrasi dengan validasi server-side (email unik, NIM unik numerik, password min. 6).
- Login JWT (expiry 30 hari), bcrypt.
- Approval akun oleh admin: pending / active / blocked.
- Profil sendiri: `GET/PUT /auth/me`, ganti password saat login, lupa/reset password via token email.
- CRUD kelas (create/update/delete) admin & instructor dengan kepemilikan.
- CRUD materi per kelas (title, url, type link/video/pdf), validasi URL `http(s)`.
- Enrollment member +50 poin, cegah duplikasi, unenroll self-service (poin -50 sebanding).
- Daftar peserta per kelas; admin/instructor bisa mengeluarkan member.
- Kuis: create/edit/delete, soal 2–6 opsi, penilaian otomatis, batas attempt.
- Poin kuis hanya pada attempt pertama per kuis per user (anti-exploit).
- Leaderboard publik top-10 + leaderboard per kelas (rata-rata skor terbaik).
- Riwayat transaksi poin, badge otomatis, notifikasi in-app (read/delete/clear).
- Admin: pagination + search user, filter status, create user, edit data user, ubah role, sesuaikan poin manual, hapus user pending, drill-down detail user.
- Rate limiting endpoint auth; header keamanan (helmet).

### 3.2 Gap fungsi (belum ada)
- **Verifikasi email** saat registrasi. Email belum diverifikasi; siapa saja bisa mendaftar dengan email orang lain.
- **Notifikasi approval via email.** Notifikasi in-app sudah ada, tapi member tidak bisa login untuk melihatnya saat masih pending — jadi notifikasi approval lewat in-app tidak sampai. Member harus coba-coba login. Sudah ada halaman "Cek Status Akun" sebagai mitigasi.
- **Kuota/kapasitas kelas.** Tidak ada batas peserta per kelas.
- **Kategori/tag kelas + filter katalog.** Katalog flat, tidak ada filter.
- **Upload avatar langsung.** UI "Pilih Foto" ada, tetapi **rusak total** (lihat bug B-1) — saat ini hanya URL gambar eksternal yang berfungsi.
- **Automated test suite.** `npm test` masih placeholder. Keputusan eksplisit ditunda.

## 4. Bug backlog terverifikasi

Diverifikasi langsung terhadap kode + runtime. Prioritas dari yang paling dampak pengguna.

### 4.1 Backend

| # | Severity | Lokasi | Defek |
|---|---|---|---|
| B-1 | **CRITICAL** | `authController.js:263` | Link reset password dibangun dari `req.get('host')` (header bisa diatur attacker). Attacker kirim `POST /forgot-password` dengan `Host: evil.com` → korban dikirimi link ke situs attacker → **token reset bocor → account takeover**. |
| B-2 | **HIGH** | `app.js` | Tidak ada `trust proxy`. Di balik Render/Railway/Nginx, `req.ip` = IP proxy → bucket rate-limit 20/15 menit terbagi seluruh platform. User legit terus kena "Terlalu banyak percobaan", attacker malah aman. |
| B-3 | **HIGH** | `authRoutes.js:20` | `GET /auth/leaderboard` **tanpa autentikasi**. Bocor `full_name`, poin, streak, avatar semua user aktif ke internet publik. |
| B-4 | **HIGH** | `quizRoutes.js` + `quizController.js:342` | `POST /quizzes/:id/submit` **tidak ada validasi body**. `req.body.answers` undefined → `TypeError` → **500 dijamin**. Skema Joi `submitQuiz` tidak ada. |
| B-5 | MEDIUM | `authController.js:194, :302` | Ganti/reset password tidak membatalkan JWT lama. Token stateless 30 hari → token attacker tetap aktif setelah password diganti. |
| B-6 | MEDIUM | `classController.js:148-166` dll. | Multi-step write non-atomic (enroll → +50 poin → catat transaksi; deleteClass 6 delete berurutan). Kegagalan tengah = data inkonsisten (ter-enroll tapi tanpa poin). |
| B-7 | MEDIUM | `authController.js:508`, `classController.js:10` | Race condition: clamp poin terhadap read yang sudah stale → poin bisa **negatif**. |
| B-8 | MEDIUM | `authController.js:74-118` | Streak/poin login read-modify-write non-atomik → dua login paralel mencatat **dua** transaksi +10 tapi saldo hanya naik +10 (ledger tidak reconcile). |
| B-9 | MEDIUM | `validate.js:140,150` | `correct_answer` tidak divalidasi terhadap `options`. Typo instructor → kuis tidak bisa diselesaikan dengan benar. |
| B-10 | MEDIUM | `quizController.js:330-337` | Gate enrollment submit kuis hanya berlaku untuk `member`. Instructor/admin bisa submit kuis kelas orang lain → mencemari skor mereka + **farming +20 poin** dari semua kuis di platform. |
| B-11 | LOW | `authController.js:530` | `adjustUserPoints` pakai `type: 'account_approved'` untuk notifikasi penyesuaian poin — tipe salah. |
| B-12 | LOW | `authController.js:21,403` | Race duplikat email/NIM saat register → `P2002` → 500 dengan pesan Prisma mentah (bocor nama tabel). |
| B-13 | LOW | `authController.js:554-558` | `deleteUser` cascade tidak transaksional dan tidak lengkap (lewatkan `enrollment`, `quizAttempt`). |
| B-14 | LOW | `errorHandler.js:18-23` | 500 memantulkan `err.message` mentah → bocor internal Prisma. |
| B-15 | LOW | `quizController.js:341-352` | Jawaban benar langsung dibuka setelah submit, tapi leaderboard kelas dihitung dari skor **terbaik** → member bisa "tebus" jawaban di attempt pertama, retake untuk 100. |
| B-16 | LOW | `adminController.js:17-29` | `completionRate` bisa >100% (pembilang hitung user blocked/pending, penyebut hanya active). |
| B-17 | LOW | `app.js:30` | CORS terbuka untuk semua origin. |

### 4.2 Frontend

| # | Severity | Lokasi | Defek |
|---|---|---|---|
| F-1 | **CRITICAL** | `ProfilePage.tsx:81-115` | "Pilih Foto" upload avatar **pasti gagal**: file diubah jadi `data:` URL, tapi backend hanya terima `http(s)://` → selalu 400 "URL avatar tidak valid". Seluruh fitur upload dead code. |
| F-2 | **HIGH** | `AdminUsersPage.tsx:267-290` | Edit user **menghapus nomor telepon** diam-diam. `getAllUsers` tidak select `phone` → form selalu kosong → submit kirim `null`. |
| F-3 | HIGH | `QuizPage.tsx:41-52` | Navigasi `/quiz/A` → `/quiz/B` membocorkan skor + "Pembahasan" kuis A di bawah judul kuis B, dan jawaban A tersimpan ke draft B. |
| F-4 | HIGH | `QuizPage.tsx:39,55-67` | Draft jawaban hanya direstore untuk kuis pertama yang dibuka (ref tidak di-reset saat ganti kuis). |
| F-5 | HIGH | `api/client.ts:22-30` | Akun **diblokir** dapat status 403 (bukan 401) → client tidak pernah logout. Pengguna diblokir terus melihat halaman yang selalu gagal tanpa penjelasan/redirect. |
| F-6 | MEDIUM | `AdminClassPage.tsx:567-575` | Field "Maksimal Attempt" tidak bisa dikosongkan, padahal helperText bilang "Kosongkan untuk tidak membatasi". Ngosongkan → kirim `0` → ditolak backend. |
| F-7 | MEDIUM | `ToastContext.tsx:31-40` | `Snackbar` tanpa `key` → toast kedua mewarisi sisa timer dan bisa hilang dalam hitungan ratusan ms. |
| F-8 | MEDIUM | `ClassDetailPage.tsx:54-82` | `loadError` tidak di-clear saat sukses → kalau kelas A pernah 404, ke kelas B yang valid tetap menampilkan layar error. |
| F-9 | MEDIUM | `AdminUsersPage.tsx:235-251` | Tabel user **tidak punya state error**. Fetch gagal → grid kosong tanpa pesan/retry, tidak seperti halaman list lain. |
| F-10 | LOW | `ClassDetailPage.tsx:340` | Conditional mati: `variant={isAttemptsExhausted ? 'outlined' : 'outlined'}`. |
| F-11 | LOW | `LandingPage.tsx:78-250` | Sisa scaffolding tool desain (`data-impeccable-variants` + 2 variant `display:none` + JSON param) terkirim ke setiap pengunjung. |
| F-12 | LOW | `RegisterPage.tsx:82-90`, `LoginPage.tsx:107-114` | Helper text "Minimal 6 karakter" tapi tidak ada validasi client-side → password pendek dikirim lalu ditolak backend. |
| F-13 | LOW | `ProfilePage.tsx:35,88` | Batas file 180 KB tapi toast bilang "150 KB" — tidak konsisten. |
| F-14 | LOW | `ClassesPage.tsx:58-73`, `AdminUsersPage.tsx:505-523` | Field pencarian tanpa nama aksesibel (hanya `placeholder`). |
| F-15 | LOW | `ResetPasswordPage.tsx:16-19` | Token dari URL hanya dibaca sekali; ganti `?token=` pada instance komponen yang sama → token stale. |
| F-16 | LOW | `index.html` (root), `src/client/index.html` | Favicon 404 di dev & build (referensi `/favicon.png` tapi tidak ada `public/` root). `src/client/index.html` duplikat tidak terpakai. |
| F-17 | LOW | `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage` | Tidak redirect saat sudah login (LoginPage sudah). |
| F-18 | LOW | `ConfirmContext.tsx:25-30` | `confirm()` tumpang tindih → promise caller pertama tidak pernah settle. |
| F-19 | LOW | `AdminClassPage.tsx:684` | `key={i}` pada tabel skor yang barisnya bisa dimutasi (reset attempt). |

## 5. Aturan kualitas fungsional (berlaku untuk semua perubahan)

1. **Validasi input:** semua endpoint yang terima body wajib lewat middleware `validate()` + skema Joi. Tidak ada validasi ad-hoc di controller.
2. **Error handling:** semua controller dibungkus `asyncHandler`. Response konsisten `{ success, data?, message?, error?: { message } }. Error 500 tidak boleh memantulkan pesan internal.
3. **Transaksi:** operasi multi-step yang harus konsisten (poin, enrollment, delete berjenjang) wajib `$transaction`.
4. **Otorisasi:** setiap endpoint data wajib `authenticate`; kepemilikan (instructor terhadap kelasnya, user terhadap notifikasinya) wajib diperiksa eksplisit.
5. **State UI:** setiap halaman async wajib punya 3 state eksplisit: loading, empty, error (+ retry). Tidak boleh ada layar kosong tanpa feedback.
6. **Feedback aksi:** notifikasi via toast, aksi destruktif wajib konfirmasi. Tidak boleh `alert()`/`confirm()` browser.
7. **Penanganan sesi:** 401 **dan** 403 yang menandakan status akun harus mengarahkan ke logout/login, bukan diam.
8. **Tidak ada data palsu:** landing tidak boleh menampilkan data kelas/mentimoni perusahaan fiktif.
9. **Bahasa UI:** Bahasa Indonesia.

## 6. Prioritas pengerjaan

### Sprint 1 — perbaikan darurat (keamanan & data)
B-1 (account takeover), B-2 (rate limiter), B-3 (bocor PII leaderboard), B-4 (submitQuiz 500), F-2 (hapus telepon), F-1/F-13 (avatar).

### Sprint 2 — integritas data
B-5 (invalidasi JWT), B-6 (transaksi), B-7 + B-8 (race poin), B-10 (farming poin instructor), F-3/F-4 (bocor antar-kuis), F-5 (logout akun diblokir).

### Sprint 3 — kualitas UX
F-6 sampai F-9, F-11, F-12, F-16, F-17, F-18, F-19.

### Sprint 4 — fitur baru
Verifikasi email, notifikasi approval via email (butuh keputusan provider SMTP), kuota kelas, kategori/filter katalog.

### Backlog (sengaja ditunda)
Automated test suite.

## 7. Non-goal

Bukan video-conferencing, bukan marketplace kursus umum, bukan sistem pembayaran, tidak multi-organisasi.
