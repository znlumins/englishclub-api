# Design Specification: Udemy-Like Modern E-Learning UI

## 1. Pendahuluan
Dokumen ini mendefinisikan panduan antarmuka (UI Guidelines) untuk merombak total tampilan **Learning Management System (LMS) English Club Vokasi UB**. Desain *Neo-Brutalism* sebelumnya akan sepenuhnya digantikan dengan gaya modern, bersih, dan profesional yang terinspirasi dari platform e-learning **Udemy**.

## 2. Palet Warna (Color Scheme)
Warna yang digunakan berfokus pada warna-warna netral (putih, abu-abu, hitam pekat) dengan *Accent Color* ungu khas Udemy.

- **Brand Primary (Purple):** `#A435F0` — Digunakan untuk tombol utama, link penting, dan elemen *hover*.
- **Brand Primary Hover:** `#8710D8` — Warna ungu lebih gelap saat tombol di-*hover*.
- **Text Main (Dark):** `#1C1D1F` — Warna hitam keabu-abuan untuk teks heading dan paragraf (tidak menggunakan murni hitam `#000000`).
- **Text Secondary (Gray):** `#6A6F73` — Digunakan untuk teks deksripsi, nama instruktur, dan informasi sekunder.
- **Background Primary:** `#FFFFFF` (Putih bersih).
- **Background Secondary:** `#F7F9FA` (Abu-abu sangat terang untuk memisahkan section).
- **Borders & Dividers:** `#D1D7DC` — Garis pemisah tipis 1px.

## 3. Tipografi
- **Font-Family:** `Inter`, `Roboto`, `Helvetica Neue`, `Arial`, `sans-serif`.
- **Heading 1:** 32px, Bold (700).
- **Heading 2:** 24px, Bold (700).
- **Heading 3:** 19px, Bold (700).
- **Body Text:** 16px atau 14px, Normal (400).

## 4. Komponen Utama (Components)

### A. Navigation Bar (Navbar)
- **Background:** Putih bersih (`#FFFFFF`).
- **Border-bottom:** 1px solid `#D1D7DC`.
- **Layout:** Logo/Brand di kiri, (opsional) *Search Bar* di tengah (radius melengkung penuh), menu dan tombol *Profile/Login* di kanan.
- **Shadow:** *Subtle box-shadow* (`0 2px 4px rgba(0,0,0,0.08)`) atau sekadar border bawah.

### B. Course Cards (Katalog Kelas)
- **Bentuk:** Persegi panjang vertikal.
- **Image/Thumbnail:** Di bagian paling atas, gambar penuh (rasio 16:9).
- **Padding konten:** Minimalis (tidak ada padding berlebih di sisi luar teks).
- **Teks:**
  - **Judul Kelas:** Bold, max 2 baris, `#1C1D1F`.
  - **Instruktur:** Ukuran 12px/14px, `#6A6F73`.
  - **Rating/Metrics:** (Misal jumlah materi/siswa) di bawah nama instruktur.
- **Hover Effect:** Saat card di-*hover*, *overlay* akan sedikit menggelap atau muncul bayangan (*box-shadow: 0 2px 4px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.08)*). Tidak ada transisi perpindahan posisi (seperti neo-brutalism).

### C. Buttons (Tombol)
- **Primary Button:** Background `#1C1D1F` (hitam) atau `#A435F0` (ungu), text putih. Tanpa border radius melingkar (radius tajam 0px atau kotak kaku).
- **Secondary/Outline Button:** Background *transparent*, border 1px solid `#1C1D1F`, teks `#1C1D1F`. Saat di-*hover*, background menjadi `#F7F9FA`.

### D. Hero Section / Jumbotron (Dashboard / Landing)
- Menggunakan container grid. Teks promosi / selamat datang di sisi kiri dengan background *off-white* (`#F7F9FA`) atau blok putih, dan gambar / ilustrasi di sisi kanan.

## 5. Implementasi & Transisi
Seluruh file `style.css` akan dihapus isinya dan diganti dengan kelas-kelas utilitas dan komponen yang mengadopsi prinsip desain ini. Semua file HTML (mulai dari `index.html` sampai `leaderboard.html`) akan dirombak struktur DOM-nya untuk menghilangkan properti CSS kaku (*inline styles*) peninggalan desain Neo-Brutalism.
