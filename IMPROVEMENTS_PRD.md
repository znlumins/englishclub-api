# Improvement Tasks — LMS English Club Vokasi UB

> **Target Audience:** Junior programmer / low-cost AI coding agent  
> **Priority:** Tinggi (perbaikan UX yang membingungkan user)  
> **Estimated Total Effort:** ~2–4 jam

---

## Task 1: Halaman Pending Approval

### Deskripsi
Saat ini setelah user registrasi, mereka di-redirect ke `/login` dengan toast "Akun berhasil dibuat". Ketika mereka mencoba login, muncul error "Akun masih menunggu persetujuan admin". Ini membingungkan karena user pikir registrasi gagal.

**Solusi:** Buat halaman `/pending-approval` dan arahkan user ke sana setelah registrasi.

### File yang perlu dibuat/dimodifikasi

#### A. BUAT FILE BARU: `src/client/pages/PendingApprovalPage.tsx`

Buat halaman statis dengan:
- Header: "Akun Berhasil Dibuat 🎉"
- Subtitle: "Menunggu Persetujuan Admin"
- Penjelasan: "Akun kamu sedang menunggu persetujuan dari admin English Club. Setelah disetujui, kamu akan bisa login dan mulai belajar."
- Poin-poin checklist:
  - "Cek email kamu untuk informasi lebih lanjut"
  - "Proses approval biasanya memakan waktu 1×24 jam"
  - "Hubungi admin jika sudah melebihi waktu tersebut"
- Link/button ke halaman login

Gunakan komponen MUI yang sudah ada: `Box`, `Typography`, `Button`, `Stack`, `Card`, `CardContent`, `CheckCircleOutlineIcon`, `LoginIcon` (atau `ArrowForwardIcon`).

Layout: Gunakan `minHeight: '100vh'`, `display: 'flex'`, center content. Background pakai gradient seperti landing page. Jangan pakai `AuthLayout` karena komponen itu terlalu spesifik untuk login/register.

#### B. MODIFIKASI: `src/client/App.tsx`

1. Import halaman baru di bagian atas:
```tsx
import PendingApprovalPage from './pages/PendingApprovalPage';
```

2. Tambahkan route di bagian public routes (setelah route `/register`):
```tsx
<Route path="/pending-approval" element={<PendingApprovalPage />} />
```

#### C. MODIFIKASI: `src/client/pages/RegisterPage.tsx`

Cari baris ini (sekitar baris 38–45):
```tsx
if (result.ok) {
  showToast(result.message ?? 'Akun berhasil dibuat. Menunggu persetujuan admin.', 'success');
  navigate('/login');
}
```

Ubah `navigate('/login')` menjadi:
```tsx
navigate('/pending-approval');
```

**CATATAN:** Hapus atau komentari `showToast` — karena user akan lihat halaman baru yang menjelaskan status, toast tidak diperlukan lagi.

---

## Task 2: Label Sidebar Dinamis (Admin vs Instructor)

### Deskripsi
Saat ini sidebar menampilkan label "Admin" untuk seksi admin, TAPI label yang sama juga muncul untuk instructor yang bukan admin. Instructor bukan admin, jadi ini membingungkan.

**Solusi:** Label "Admin" tetap untuk admin. Untuk instructor, ganti jadi "Kelola" atau "Instructor".

### File yang dimodifikasi

#### A. `src/client/components/AppShell.tsx`

Cari kode berikut (sekitar baris 100–115):
```tsx
<>
  <Typography
    variant="overline"
    sx={{ display: 'block', px: 3, mt: 2, mb: 0.5, fontSize: 11 }}
  >
    Admin
  </Typography>
  {ADMIN_LINKS.map(navItem)}
  {isAdmin && ADMIN_ONLY_LINKS.map(navItem)}
</>
```

Ubah menjadi:
```tsx
<>
  <Typography
    variant="overline"
    sx={{ display: 'block', px: 3, mt: 2, mb: 0.5, fontSize: 11 }}
  >
    {isAdmin ? 'Admin' : 'Kelola'}
  </Typography>
  {ADMIN_LINKS.map(navItem)}
  {isAdmin && ADMIN_ONLY_LINKS.map(navItem)}
</>
```

Penjelasan: `isAdmin` sudah tersedia dari `useAuth()`. Untuk admin → "Admin". Untuk instructor (yang `isAdminOrInstructor` true tapi `isAdmin` false) → "Kelola".

---

## Task 3: Breadcrumb Navigation

### Deskripsi
Saat user masuk ke detail kelas atau kuis, tidak ada navigasi hierarki (breadcrumb). User harus klik sidebar untuk balik ke daftar kelas. Breadcrumb akan memudahkan navigasi.

### File yang dimodifikasi

#### A. `src/client/pages/ClassDetailPage.tsx`

**Tambahkan import:**
```tsx
import Breadcrumbs from '@mui/material/Breadcrumbs';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
```

**Tambahkan komponen breadcrumb** di bagian atas halaman, tepat setelah `<Typography variant="overline">Detail Kelas</Typography>`:

```tsx
<Breadcrumbs
  separator={<NavigateNextIcon fontSize="small" />}
  sx={{ mb: 1 }}
>
  <Link component={RouterLink} to="/classes" underline="hover" color="inherit" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
    <HomeIcon fontSize="small" />
    Katalog Kelas
  </Link>
  <Typography color="text.primary">{detail.name}</Typography>
</Breadcrumbs>
```

**Juga import `Link` dari MUI:**
Cari `import LinkIcon from '@mui/icons-material/Link';` — JANGAN tambah import `Link` dari MUI karena akan konflik dengan `LinkIcon`. 
Gunakan `import Link from '@mui/material/Link';` di samping import lainnya.

#### B. `src/client/pages/QuizPage.tsx`

**Tambahkan import:**
```tsx
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
```

**Tambahkan breadcrumb** setelah tag pembuka `<Box>` (sebelum "Kuis" overline):

```tsx
<Breadcrumbs
  separator={<NavigateNextIcon fontSize="small" />}
  sx={{ mb: 2 }}
>
  <Link component={RouterLink} to="/classes" underline="hover" color="inherit" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
    <HomeIcon fontSize="small" />
    Katalog Kelas
  </Link>
  <Typography color="text.primary">{quiz?.title ?? 'Kuis'}</Typography>
</Breadcrumbs>
```

---

## Task 4: Preview Materi untuk User Belum Enroll

### Deskripsi
Saat ini user yang belum enroll ke kelas hanya melihat tombol "Enroll Kelas" dan deskripsi, tanpa tahu apakah kelas itu punya materi atau tidak. Ini membuat user ragu untuk enroll.

**Solusi:** Tampilkan jumlah & daftar judul materi (tanpa link/akses) untuk user yang belum enroll.

### File yang dimodifikasi

#### A. `src/client/pages/ClassDetailPage.tsx`

Cari bagian render materi (sekitar baris 125–140):
```tsx
<Typography variant="h3" sx={{ mb: 2 }}>Materi</Typography>
{detail.materials.length === 0 ? (
  <EmptyState icon={<DescriptionIcon />} title="Belum ada materi" description="Instructor belum menambahkan materi." />
) : (
  <Card sx={{ mb: 5 }}>
    ...
  </Card>
)}
```

Ubah menjadi kode yang mengecek apakah user sudah enroll:

Untuk user **yang sudah enroll** → tampilkan materi seperti sekarang (dengan link).
Untuk user **yang belum enroll** → tampilkan preview:
- "Kelas ini memiliki N materi"
- Daftar judul materi (tanpa link/akses)

Kode lengkap pengganti:

```tsx
<Typography variant="h3" sx={{ mb: 2 }}>Materi</Typography>
{detail.materials.length === 0 ? (
  <EmptyState icon={<DescriptionIcon />} title="Belum ada materi" description="Instructor belum menambahkan materi." />
) : !enrolled && !isAdminOrInstructor ? (
  <Card sx={{ mb: 5 }}>
    <CardContent sx={{ p: 3 }}>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        Kelas ini memiliki <strong>{detail.materials.length} materi</strong>. Daftar untuk mengakses:
      </Typography>
      <List disablePadding>
        {detail.materials.map((material, idx) => (
          <Box key={material.id}>
            {idx > 0 && <Divider component="li" />}
            <ListItem disablePadding sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>{MATERIAL_ICON[material.type]}</ListItemIcon>
              <ListItemText
                primary={material.title}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondary={material.type.toUpperCase()}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          </Box>
        ))}
      </List>
      <Button
        variant="contained"
        onClick={handleEnroll}
        disabled={enrolling}
        sx={{ mt: 2 }}
      >
        {enrolling ? 'Memproses...' : 'Enroll untuk Akses Materi'}
      </Button>
    </CardContent>
  </Card>
) : (
  <Card sx={{ mb: 5 }}>
    ...
    {/* kode render materi yang sudah ada (dengan link) */}
  </Card>
)}
```

**PENTING:** Pastikan import `ListItem` dan `ListItemButton` sudah benar. Jika ada konflik, gunakan import yang tepat.

---

## Task 5: Info Attempt Kuis

### Deskripsi
Saat ini tidak ada info berapa kali user sudah mengerjakan kuis. Juga tidak jelas apakah attempt dibatasi atau tidak.

**Solusi:** 
1. Di `ClassDetailPage`: tampilkan jumlah attempt + skor terakhir
2. Di `QuizPage`: tampilkan info attempt saat mengerjakan kuis

### File yang dimodifikasi

#### A. `src/client/pages/ClassDetailPage.tsx`

Cari bagian render kartu kuis yang sudah ada (sekitar baris 155–175). Saat ini sudah menampilkan chip skor terakhir. Tambahkan juga informasi jumlah attempt.

Tepat di bawah chip `lastAttempt`, tambahkan:
```tsx
{lastAttempt && quiz.attempts.length > 0 && (
  <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
    {quiz.attempts.length === 1 ? '1 attempt' : `${quiz.attempts.length} attempts`}
  </Typography>
)}
```

#### B. `src/client/pages/QuizPage.tsx`

Di bagian atas halaman (setelah judul kuis dan sebelum daftar soal), tambahkan info attempt dari API. 
Sayangnya endpoint `GET /quizzes/:id` tidak mengembalikan data attempts. Untuk solusi sederhana:
- Buat state baru: `attemptCount`
- Di `useEffect` yang fetch quiz, tambahkan fetch ke `/quizzes/class/${classId}` untuk dapat data attempts
- Tampilkan "Ini attempt ke-N" atau "Skor sebelumnya: ..."

**Alternatif yang lebih sederhana:** Di bagian hasil submit (sudah ada), tambahkan info:
Cari bagian render result (setelah submit):
```tsx
{result && (
  <Box>
    ...
    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
      {result.correctCount} dari {result.totalQuestions} jawaban benar.
    </Typography>
    ...
  </Box>
)}
```

Tidak perlu diubah — sudah cukup jelas.

**Yang perlu ditambahkan:** State dan fetch untuk attempt count dari quiz. Tapi ini membutuhkan perubahan API. Untuk tugas ini, cukup terima bahwa info attempt sudah ditampilkan di halaman detail kelas.

---

## Ringkasan File yang Dimodifikasi

| # | File | Action | Kompleksitas |
|---|---|---|---|
| 1 | `src/client/pages/PendingApprovalPage.tsx` | **BUAT BARU** | Mudah |
| 2 | `src/client/App.tsx` | Tambah import + route | Mudah |
| 3 | `src/client/pages/RegisterPage.tsx` | Ubah redirect | Sangat Mudah |
| 4 | `src/client/components/AppShell.tsx` | Ubah label dinamis | Sangat Mudah |
| 5 | `src/client/pages/ClassDetailPage.tsx` | Tambah breadcrumb + materi preview | Sedang |
| 6 | `src/client/pages/QuizPage.tsx` | Tambah breadcrumb | Mudah |

---

## Cara Test

1. `npm run dev` → buka `http://localhost:3000`
2. Test alur **registrasi** → harus diarahkan ke `/pending-approval`
3. Test **breadcrumb** di detail kelas & kuis
4. Test **sidebar** → login sebagai instructor → label berubah jadi "Kelola"
5. Test **materi preview** → buka kelas sebagai member yang belum enroll
