# Design Specification: Modern SaaS/Editorial LMS

## 1. Pendahuluan
Dokumen ini mendefinisikan panduan antarmuka (UI Guidelines) untuk **Learning Management System (LMS) English Club Vokasi UB**. Gaya *Udemy-clone* sebelumnya digantikan dengan bahasa desain **Modern SaaS/Editorial** — bersih, presisi, dan matang, terinspirasi dari produk kelas Awwwards seperti Linear, Stripe, dan Notion. Fokusnya: tipografi yang tegas, whitespace yang lega, satu warna aksen yang berani, shadow & motion yang halus — bukan garis tebal atau sudut tajam ala neo-brutalism/Udemy lama.

## 2. Palet Warna (Color Scheme)

Netral dingin (cool slate) sebagai basis, satu warna aksen indigo sebagai identitas brand.

| Token | Hex | Kegunaan |
|---|---|---|
| `--color-primary` | `#4F46E5` | Tombol utama, link penting, focus ring, ikon aktif |
| `--color-primary-hover` | `#4338CA` | State hover/active dari primary |
| `--color-primary-light` | `#EEF2FF` | Background badge/chip, highlight lembut, hero background |
| `--color-ink` | `#0F172A` | Warna heading & teks utama |
| `--color-body` | `#334155` | Warna paragraf/body text |
| `--color-muted` | `#64748B` | Teks sekunder (meta info, label, placeholder) |
| `--color-border` | `#E2E8F0` | Garis pemisah, border card/input |
| `--color-surface` | `#FFFFFF` | Background utama |
| `--color-surface-alt` | `#F8FAFC` | Background section alternatif (banner, sidebar) |
| `--color-success` | `#16A34A` | Skor bagus, status berhasil |
| `--color-danger` | `#DC2626` | Error, validasi gagal |
| `--color-warning` | `#D97706` | Peringatan |

Tidak ada warna hitam pekat (`#000`) atau abu-abu acak (`#555`, `red` polos) — semua warna teks/border harus memakai token di atas.

## 3. Tipografi
- **Font-Family:** `Inter`, dimuat dari Google Fonts, fallback `-apple-system, Segoe UI, Helvetica Neue, Arial, sans-serif`. Angka statistik (poin, streak, skor) memakai `letter-spacing` rapat dan `font-variant-numeric: tabular-nums` agar terasa presisi ala dashboard SaaS.
- **Skala:**
  - Display (hero H1): `48px` / line-height `1.1`, weight `800`, `letter-spacing: -0.02em`.
  - Heading 1: `32px` / `1.2`, weight `700`, `letter-spacing: -0.01em`.
  - Heading 2: `24px` / `1.3`, weight `700`.
  - Heading 3: `18px` / `1.4`, weight `600`.
  - Body: `16px` / `1.6`, weight `400`, warna `--color-body`.
  - Small/meta: `14px`, warna `--color-muted`.
  - Eyebrow label: `12px`, uppercase, weight `600`, `letter-spacing: 0.06em`, warna `--color-primary` — dipakai di atas heading section (contoh: "COURSE CATALOG", "YOUR PROGRESS").

## 4. Spacing, Radius & Shadow
- **Spacing scale:** `4, 8, 12, 16, 24, 32, 48, 64, 96px` — semua padding/margin harus kelipatan skala ini.
- **Radius:** `--radius-sm: 8px` (input, chip kecil), `--radius-md: 12px` (card, button), `--radius-lg: 20px` (hero panel, modal), `--radius-full: 999px` (avatar, pill badge).
- **Shadow (elevation):**
  - `--shadow-sm: 0 1px 2px rgba(15,23,42,.06)` — kartu diam.
  - `--shadow-md: 0 8px 24px rgba(15,23,42,.08)` — kartu hover, dropdown.
  - `--shadow-lg: 0 20px 48px rgba(15,23,42,.14)` — modal, elemen mengambang.

## 5. Komponen Utama (Components)

### A. Navigation Bar (Navbar)
- **Posisi:** `sticky top: 0`, background putih semi-transparan dengan `backdrop-filter: blur(12px)` agar terasa "melayang" saat discroll.
- **Border-bottom:** 1px solid `--color-border`, tanpa shadow tebal — cukup blur untuk kedalaman.
- **Brand:** logo mark asli (monogram "EC" gaya geometris/De Stijl, `src/client/assets/logo.png`) + wordmark "English Club" bold — komponen `<Brand />` (`src/client/components/Brand.tsx`), dipakai konsisten di navbar landing, sidebar (`AppShell`), dan header halaman login/register (`AuthLayout`). Favicon browser (`src/client/public/favicon.png`) pakai aset yang sama.
- **Layout:** Logo kiri, menu tengah/kanan, CTA (`btn-primary`) paling kanan.

### B. Course Cards (Katalog Kelas)
- **Bentuk:** rounded (`--radius-md`), border tipis `--color-border`, tanpa border di thumbnail (menyatu).
- **Thumbnail:** rasio 16:9, radius mengikuti card di sisi atas, bisa berupa gradient placeholder (bukan foto stok abu-abu polos) menggunakan kombinasi warna primary + surface-alt.
- **Kategori tag:** pill kecil (`--color-primary-light` bg, `--color-primary` text) di atas judul.
- **Hover:** `translateY(-4px)` + `--shadow-md`, transisi `200ms ease-out` — tanpa delay, tanpa efek "kaku".
- **Metrics:** ikon bintang + rating + jumlah siswa, warna `--color-muted`, angka `--color-ink` weight 600.

### C. Buttons (Tombol)
- **Primary:** background `--color-primary`, teks putih, radius `--radius-md`, hover: background `--color-primary-hover` + `translateY(-1px)` + `--shadow-sm`.
- **Secondary/Outline:** background transparan, border 1px `--color-border`, teks `--color-ink`, hover: background `--color-surface-alt`.
- **Ghost:** tanpa border/background, teks `--color-primary`, dipakai untuk aksi sekunder di tabel/list.
- Semua tombol: radius membulat (bukan kotak tajam ala desain lama), transisi halus `150–200ms`.

### D. Hero Section / Banner
- Background gradasi lembut: radial-gradient dari `--color-primary-light` ke `--color-surface`, dengan 1–2 "blob" dekoratif blur (CSS `filter: blur(80px)`, opacity rendah) di belakang konten — sentuhan khas landing page Awwwards tanpa perlu gambar/ilustrasi eksternal.
- Eyebrow label di atas heading, heading skala Display, subtext `--color-muted`, dua CTA (primary + ghost/secondary).

### E. Forms
- Input: radius `--radius-sm`, border `--color-border`, padding `12px 16px`, focus: border `--color-primary` + `box-shadow: 0 0 0 4px var(--color-primary-light)` (focus ring lembut ala SaaS modern, bukan garis tebal).
- Label: `12px`, uppercase, weight 600, warna `--color-muted`, `margin-bottom: 6px`.

### F. Badge & Pill
- Dipakai untuk role user, status quiz ("Not Attempted"/"Completed"), rank leaderboard.
- Bentuk pill (`--radius-full`), padding `4px 12px`, font `12px` weight 600.
- Varian warna: primary (indigo), success (hijau), muted (abu netral).

### G. Table (Leaderboard)
- Tanpa border kotak kaku; gunakan `border-bottom` tipis antar baris.
- Baris top 3 mendapat badge peringkat berwarna (emas/perak/perunggu) alih-alih hanya highlight background.

## 6. Motion
- Semua transisi state (hover, focus) memakai `transition: all 150–200ms ease-out`.
- Hindari animasi loncat/instan ala neo-brutalism; setiap perubahan visual harus terasa halus.

## 7. Implementasi (Riwayat — digantikan Section 8)
> **Selesai per 2026-07-26.** Section ini didokumentasikan sebagai riwayat implementasi vanilla JS/CSS sebelum migrasi. `public/css/style.css`, `public/*.html`, dan `public/js/*.js` yang dijelaskan di bawah **sudah dihapus dari repo** — implementasi aktif sekarang mengikuti Section 8 (tema MUI di `src/client/theme.ts`).

`public/css/style.css` (riwayat) mendefinisikan seluruh token & kelas komponen di atas. Semua halaman HTML (`index.html` s.d. `admin-class.html`) dan skrip yang me-render HTML secara dinamis (`public/js/*.js`) wajib memakai kelas & variabel ini — dilarang menulis warna hex/inline style yang tidak terdaftar di tabel Section 2, dan dilarang menyisakan sisa kelas/variabel dari desain sebelumnya (mis. `--jet-black`, `color: red` polos).

## 8. Migrasi UI ke React + MUI — Selesai (2026-07-26)

### 8.1 Kenapa Migrasi
Audit UI saat ini (lihat `requirement.md` §11) menemukan drift berulang dari sistem desain sendiri: inline style yang menyimpang dari token (mis. `admin-users.html`), tidak ada pola konsisten untuk state loading/empty/error di semua halaman, tabel tanpa pagination, dan sidebar mobile yang di-handle manual lewat toggle class. Ini gejala dari membangun ulang komponen UI dengan tangan di tiap halaman HTML terpisah, tanpa sistem komponen nyata.

**MUI (Material UI) adalah library React** — bukan drop-in CSS untuk vanilla JS. Konsekuensinya, migrasi ini **mengubah stack frontend dari Vanilla JS + HTML statis (MPA) menjadi React SPA**. Ini keputusan arsitektur, bukan cuma restyle.

**Manfaat yang didapat, dan menjawab backlog §11 `requirement.md` langsung:**
- `MUI DataGrid` → tabel `admin-users.html` dapat pagination & sorting gratis (menjawab item #5 backlog).
- `Skeleton` + `Alert` + `Snackbar` → pola loading/empty/error jadi seragam by design, bukan hafalan tiap halaman (menjawab §7 aturan 2 `requirement.md`).
- `Drawer` (variant `temporary`/`permanent`) → sidebar responsif tanpa kode toggle manual (`shared.js: toggleSidebar/closeSidebar` dapat dipensiunkan).
- Theming terpusat di satu file (`theme.ts`) → inline style yang menyimpang dari token jadi mustahil terjadi tanpa sengaja, karena komponen MUI otomatis mewarisi tema.

### 8.2 Strategi Migrasi: Bertahap per Batch, Bukan Coexistence Permanen
Direkomendasikan **migrasi per-batch fitur**, **bukan** menjalankan React dan HTML lama berdampingan permanen di halaman berbeda. Alasan: berbagi state auth/session antara SPA React dan MPA vanilla JS di dua sistem berjalan lama justru menambah kerumitan, bertentangan dengan tujuan "merapikan".

> **Catatan eksekusi aktual:** atas permintaan eksplisit untuk mengeksekusi seluruh rencana sekaligus, keempat batch di bawah dikerjakan berurutan dalam satu sesi kerja (bukan branch terpisah per batch yang di-merge bertahap ke `main` seperti skenario ideal di atas), lalu satu kali cutover di akhir (§8.2 tetap dipertahankan sebagai referensi urutan/dependensi, bukan riwayat proses Git literal). Untuk migrasi berikutnya yang lebih besar, pola per-branch tetap direkomendasikan.

| Batch | Halaman | Alasan urutan |
|---|---|---|
| **1. Fondasi & Auth** | `index`, `login`, `register` + shell bersama (tema MUI, `AppBar`, `Drawer`, `Snackbar` toast system, auth context) | Wajib duluan — semua batch lain bergantung pada shell & tema ini |
| **2. Member Core** | `dashboard`, `classes`, `class-detail`, `quiz` | Alur inti member (lihat `requirement.md` §4.2) |
| **3. Gamifikasi & Profil** | `leaderboard`, `profile` | Bergantung pada shell, risiko lebih rendah |
| **4. Admin** | `admin-dashboard`, `admin-class`, `admin-users` | Paling diuntungkan `DataGrid` untuk tabel besar; dikerjakan terakhir karena dampak salah pakai lebih kritikal (hak akses admin) |

Setelah Batch 4 selesai, `public/*.html` lama dan `public/js/*.js` **sudah dihapus** (bukan dibiarkan menumpuk sebagai dead code) — direktori `public/` lama tidak lagi ada di repo.

### 8.3 Tooling Baru
- **Bahasa:** Seluruh kode React ditulis dalam **TypeScript** (`.ts`/`.tsx`) — dilarang menulis file baru sebagai `.js`/`.jsx` polos di `src/client/`. Props komponen, response API, dan theme object wajib punya tipe eksplisit (mis. `interface ClassDTO`, `interface UserDTO` merefleksikan skema Prisma di §8 `requirement.md`/Section 8 model data), bukan `any`.
- **Dependencies baru:** `react`, `react-dom`, `react-router-dom`, `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `@mui/x-data-grid` (untuk tabel admin, lihat §8.5).
- **Dependencies baru (dev/type support):** `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `@vitejs/plugin-react`, `vite`.
- **Build tool:** Vite — project saat ini tidak punya build step sama sekali, jadi ini juga infrastruktur baru, bukan cuma dependency. Vite + `@vitejs/plugin-react` mendukung `.tsx` langsung tanpa config tambahan.
- **`tsconfig.json` baru** di root, `include` mengarah ke `src/client/**/*`; backend Express (`src/controllers`, `src/routes`, `src/middlewares`) tetap JavaScript murni — TypeScript pada fase ini hanya lingkup frontend baru, bukan migrasi backend.
- **Struktur folder baru:** `src/client/` (kode React: `pages/`, `components/`, `theme.ts`, `main.tsx`) terpisah dari `src/` backend Express yang sudah ada (`controllers/`, `routes/`, `middlewares/`).
- **Dev workflow:** `npm run dev` (backend, tetap) + `npm run dev:client` (Vite dev server dengan proxy `/api` → `localhost:3000`). Build produksi (`npm run build:client`) menghasilkan static assets yang di-serve Express menggantikan `express.static('public')`.
- **Package.json scripts (rencana):** tambah `"dev:client": "vite"`, `"build:client": "vite build"`, dan `"typecheck": "tsc --noEmit"` di samping `"dev"` yang sudah ada. `typecheck` sebaiknya jadi gate sebelum merge tiap batch (§8.2).

### 8.4 Pemetaan Tema (Token `design.md` → MUI Theme)

| Token `design.md` (Section 2–4) | MUI theme key |
|---|---|
| `--color-primary` `#4F46E5` | `palette.primary.main` |
| `--color-primary-hover` `#4338CA` | `palette.primary.dark` |
| `--color-primary-light` `#EEF2FF` | `palette.primary.light` (dipakai untuk Chip/badge bg, bukan hover state tombol) |
| `--color-ink` `#0F172A` | override `typography.h1`–`h6.color` (MUI `text.primary` default dipakai untuk body, lihat baris di bawah) |
| `--color-body` `#334155` | `palette.text.primary` |
| `--color-muted` `#64748B` | `palette.text.secondary` |
| `--color-border` `#E2E8F0` | `palette.divider` |
| `--color-surface` `#FFFFFF` | `palette.background.paper` |
| `--color-surface-alt` `#F8FAFC` | `palette.background.default` |
| `--color-success` `#16A34A` | `palette.success.main` |
| `--color-danger` `#DC2626` | `palette.error.main` |
| `--color-warning` `#D97706` | `palette.warning.main` |
| Font `Inter` | `typography.fontFamily` |
| Radius `--radius-sm/md/lg` (8/12/20px) | `shape.borderRadius: 12` (base) + override per-komponen (`components.MuiButton/MuiTextField.styleOverrides` untuk 8px, `components.MuiDialog` untuk 20px) |
| Spacing scale (4/8/12/16/24/32/48/64/96) | `theme.spacing()` — unit dasar tetap 8px (default MUI), dipetakan via kelipatan: `spacing(0.5)=4, spacing(1)=8, spacing(1.5)=12, spacing(2)=16, spacing(3)=24, spacing(4)=32, spacing(6)=48, spacing(8)=64, spacing(12)=96` |
| `--shadow-sm/md/lg` | `theme.shadows[]` custom array, dipakai lewat prop `elevation` pada `Paper`/`Card` |

### 8.5 Pemetaan Komponen (Kelas CSS Lama → Komponen MUI)

| Komponen lama (`style.css`) | Komponen MUI pengganti |
|---|---|
| `.navbar` (sticky + blur) | `AppBar` (`position="sticky"`) + `sx={{ backdropFilter: 'blur(12px)' }}` |
| `.course-card` | `Card` + `CardActionArea` + `CardContent`, hover via `sx` (`transform`, `boxShadow`) |
| `.btn-primary` / `.btn-secondary` / `.btn-ghost` | `Button` `variant="contained"` / `"outlined"` / `"text"` |
| Hero/banner gradient | `Box` custom dengan `sx` gradient + blob dekoratif (tetap custom, MUI tidak punya komponen hero) |
| Input form | `TextField` (`variant="outlined"`) |
| `.badge` / pill | `Chip` (`size="small"`, warna dari `color` prop yang sudah dipetakan ke palette) |
| Tabel leaderboard & admin-users | `Table` MUI biasa untuk leaderboard (statis, top-10); `DataGrid` (`@mui/x-data-grid`, dependency tambahan) untuk `admin-users` karena butuh sort/filter/pagination |
| Modal konfirmasi (`shared.js: openModal/confirmAction`) | `Dialog` + `DialogActions` |
| Toast (`shared.js: showToast`) | `Snackbar` + `Alert` |
| Sidebar (`shared.js: initSidebar`) | `Drawer` (`variant="permanent"` desktop, `variant="temporary"` mobile via `useMediaQuery`) |
| State loading (teks "Memuat...") | `Skeleton` |
| Ikon custom SVG (`shared.js: ICONS`) | `@mui/icons-material` — **wajib** untuk semua ikon generik (check, close, menu, trash, warning, dll). Lihat aturan larangan emoji di §8.7. |

### 8.6 Yang Tidak Berubah
Token warna, tipografi, radius, dan prinsip visual di Section 1–6 **tetap jadi sumber kebenaran** — migrasi ini memindahkan *cara implementasi*-nya dari CSS custom-class ke MUI theme object, bukan mendesain ulang dari nol. Bahasa desain "Modern SaaS/Editorial" (Linear/Stripe/Notion-like) tidak berubah.

### 8.7 Larangan Emoji & Aturan Ikon
**Dilarang memakai karakter emoji di mana pun** — UI (label, badge, status, empty state), kode (log/`console.warn`, komentar), maupun dokumen (`design.md`, `requirement.md`). Ini termasuk emoji yang sudah ada di kode lama sebelum migrasi (mis. `⚠️` pada `console.warn` di `app.js`/`authController.js` — sudah dibersihkan jadi teks polos).

- **Di UI React:** setiap kebutuhan ikon memakai komponen dari `@mui/icons-material` (mis. `CheckCircleOutlineIcon` untuk sukses, `WarningAmberIcon` untuk peringatan, `BlockIcon` untuk blokir, `PendingActionsIcon` untuk status pending) — bukan emoji karakter (✅/⚠️/📋) dan bukan SVG custom baru, kecuali untuk logo/wordmark brand ("English Club") yang secara sifat adalah brand mark, bukan ikon fungsional.
- **Di dokumen (`.md`):** status/kategori memakai label teks eksplisit dalam kurung siku, mis. `[Selesai]`, `[Gap]`, `[Rencana]` (lihat `requirement.md` §5 & §10) — bukan simbol ✅/🔧/📋.
- **Di kode/log:** pesan `console.warn`/`console.error` cukup teks biasa, tanpa emoji dekoratif.
