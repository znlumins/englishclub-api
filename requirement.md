# Requirement Spesification: Learning Management System (LMS) - English Club Vokasi UB

## 1. Pendahuluan
Dokumen ini berisi daftar spesifikasi kebutuhan (requirements) untuk pengembangan platform Learning Management System (LMS) yang dikhususkan bagi anggota English Club di Vokasi Universitas Brawijaya (UB). Platform ini dibangun dengan konsep **Udemy-Like Modern UI** untuk antarmukanya dan akan mengakomodasi kebutuhan manajemen kelas, materi, serta leaderboard (gamifikasi).

## 2. Aktor / Pengguna Sistem
Sistem ini akan diakses oleh 3 jenis role pengguna:
1. **Member (Mahasiswa/Siswa):** Anggota klub yang ingin bergabung ke dalam kelas, mengakses materi, dan mendapatkan poin keaktifan.
2. **Instructor (Pengajar/Dosen):** Mentor atau dosen yang bertugas mengelola kelas spesifik, membagikan tautan materi, dan memonitor anggotanya.
3. **Admin (Administrator):** Pengelola sistem yang memiliki hak akses penuh ke seluruh fitur dan pengaturan platform.

## 3. Fitur Utama (Fase Pengembangan)

### Fase 1: Autentikasi dan Manajemen Pengguna
- **Registrasi:** Pengguna baru dapat mendaftar dengan menginputkan Email, NIM, Nama Lengkap, dan Password. Role default adalah `member`.
- **Login:** Pengguna yang telah terdaftar dapat masuk menggunakan Email dan Password (dilindungi JWT token).
- **Session & Security:** Autentikasi berbasis Bearer Token dan enkripsi password menggunakan bcrypt.

### Fase 2: Manajemen Modul Kelas
- **Katalog Kelas:** Menampilkan seluruh kelas yang tersedia di platform (hanya bisa diakses oleh pengguna yang sudah login).
- **Pendaftaran (Enrollment):** Member dapat mendaftarkan diri (enroll) ke dalam kelas yang diminati. Pendaftaran dibatasi unik agar tidak ada duplikasi data.
- **Detail & Materi Kelas:** Pengguna dapat melihat detail kelas beserta daftar materi (tautan URL dokumen, web, atau video YouTube) yang telah disisipkan oleh Instructor.

### Fase 3: Antarmuka Instructor & Admin
- **Role-Based Access Control (RBAC):** Navigasi antarmuka yang tersembunyi ("Admin Panel") hanya muncul untuk user berstatus `admin` atau `instructor`.
- **Pembuatan Kelas:** Admin/Instructor dapat membuat nama dan deskripsi kelas baru langsung dari UI.
- **Manajemen Materi:** Instructor dapat menyuntikkan (insert) tautan materi baru ke spesifik kelas yang mereka kelola.
- **Monitoring Peserta:** Instructor dapat melihat daftar mahasiswa (NIM & Nama) yang sudah tergabung ke dalam kelas mereka.

### Fase 4: Gamifikasi (Leaderboard & Profil) *[Segera]*
- **Sistem Poin & Streak:** Perhitungan keaktifan mahasiswa melalui login harian (streak) dan tugas.
- **Leaderboard Publik:** Papan peringkat yang menampilkan member dengan poin tertinggi bergaya UI Neo-Brutalism.
- **Profil Pengguna:** Halaman untuk mengedit bio, foto avatar, melihat history kelas, dan total poin yang dimiliki.

## 4. Teknologi (Tech Stack)
- **Frontend:** HTML5, Vanilla JavaScript, Custom CSS (Udemy-like design, modern, sleek, minimal).
- **Backend:** Node.js (ES Modules), Express.js.
- **Database:** SQLite.
- **ORM:** Prisma Client (v5.x).

## 5. Deployment & Version Control
- **Version Control:** Git & GitHub (`https://github.com/znlumins/learning-management-system-for-lso-vokasi-ub.git`).
- **Server Dev:** `nodemon` berjalan di `localhost:3000`.
