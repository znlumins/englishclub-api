# Ayoo Update Bug Ini — Backlog CRUD & Janggal Round 2

> **Target Audience:** Junior programmer / low-cost AI coding agent
> **Konteks:** Round sebelumnya (lihat `IMPROVEMENTS_PRD.md`, sudah selesai & sudah live) menambahkan: unenroll self-service, pagination+search user, admin create-user, review jawaban kuis, leaderboard per kelas, notifikasi in-app, badge otomatis, dashboard analitik admin. Backlog di bawah ini adalah temuan **round kedua**: hal yang masih janggal + entity yang CRUD-nya belum lengkap.
> **Priority:** Sedang (bukan bug yang blocking user, tapi celah operasional buat admin)
> **Estimated Total Effort:** ~2–3 jam

---

## Task 1: Manual Point Adjustment oleh Admin

### Deskripsi
`prisma/schema.prisma` sudah punya komentar tipe `PointTransaction.type` berisi `'enroll', 'quiz', 'login', 'admin'`, dan `PointTransactionDTO` di `src/client/api/types.ts` juga sudah mendeklarasikan `'admin'` sebagai union type yang valid. **Tapi tidak ada satupun endpoint yang pernah membuat transaksi bertipe `admin`.** Sepertinya fitur "admin kasih/potong poin manual" sudah direncanakan tapi tidak pernah jadi.

**Solusi:** Buat endpoint `POST /auth/users/:id/points` (admin only) yang menambah/mengurangi poin user secara manual dengan alasan bebas (misal bonus partisipasi lomba, atau potongan karena kecurangan kuis), plus tombol di `AdminUsersPage`.

### File yang dimodifikasi

#### A. `src/middlewares/validate.js`

Tambahkan schema baru setelah `createUser` (sekitar baris 60, sebelum `login:`):

```js
adjustPoints: Joi.object({
  amount: Joi.number().integer().min(-10000).max(10000).required().messages({
    'any.required': 'Jumlah poin wajib diisi (boleh negatif untuk mengurangi)'
  }),
  description: Joi.string().min(3).max(200).required().messages({
    'any.required': 'Alasan wajib diisi'
  })
}),
```

#### B. `src/controllers/authController.js`

Tambahkan fungsi baru setelah `createUser` (setelah baris 349, sebelum `export const approveUser`):

```js
export const adjustUserPoints = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, description } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'User tidak ditemukan' } });
  }

  // Jangan sampai poin jadi negatif
  const finalAmount = amount < 0 ? -Math.min(Math.abs(amount), user.points) : amount;
  if (finalAmount === 0) {
    return res.status(400).json({ success: false, error: { message: 'Poin user sudah 0, tidak bisa dikurangi lagi' } });
  }

  await prisma.user.update({
    where: { id },
    data: { points: { increment: finalAmount } }
  });

  await prisma.pointTransaction.create({
    data: { userId: id, type: 'admin', amount: finalAmount, description }
  });

  await createNotification({
    userId: id,
    type: 'account_approved', // reuse tipe generik yang sudah ada di schema; bisa dibuat tipe baru 'points_adjusted' kalau mau lebih rapi
    message: finalAmount > 0
      ? `Kamu mendapat ${finalAmount} poin dari admin: ${description}`
      : `${Math.abs(finalAmount)} poin kamu dikurangi admin: ${description}`
  });

  res.json({ success: true, message: `Poin ${user.full_name} berhasil disesuaikan (${finalAmount > 0 ? '+' : ''}${finalAmount})` });
});
```

**Catatan:** kalau mau tipe notifikasi yang lebih rapi, tambahkan `'points_adjusted'` ke union type `Notification.type` (cuma komentar di schema, bebas nilai string apa saja karena kolomnya `String`) dan ke `NotificationDTO['type']` di `types.ts`.

Jangan lupa import `createNotification` sudah ada di file ini (baris 7).

#### C. `src/routes/authRoutes.js`

1. Tambahkan `adjustUserPoints` ke import dari `authController.js` (baris 1–6).
2. Tambahkan route setelah `router.put('/users/:id/role', ...)`:

```js
router.put('/users/:id/points', authenticate, authorize('admin'), validate(schemas.adjustPoints), adjustUserPoints);
```

#### D. `src/client/api/types.ts`

Tidak perlu DTO baru — endpoint ini cuma mengembalikan `{ success, message }`.

#### E. `src/client/pages/admin/AdminUsersPage.tsx`

1. Tambahkan state dialog baru setelah state `creating` (sekitar baris 60):

```tsx
const [pointsDialogUser, setPointsDialogUser] = useState<UserDTO | null>(null);
const [pointsAmount, setPointsAmount] = useState('');
const [pointsReason, setPointsReason] = useState('');
const [adjustingPoints, setAdjustingPoints] = useState(false);
```

2. Tambahkan handler setelah `handleCreateUser`:

```tsx
const handleAdjustPoints = async (e: FormEvent) => {
  e.preventDefault();
  if (!pointsDialogUser) return;
  setAdjustingPoints(true);
  const res = await api.put(`/auth/users/${pointsDialogUser.id}/points`, {
    amount: Number(pointsAmount),
    description: pointsReason,
  });
  setAdjustingPoints(false);
  if (res.success) {
    showToast(res.message ?? 'Poin berhasil disesuaikan', 'success');
    setPointsDialogUser(null);
    setPointsAmount('');
    setPointsReason('');
    load();
  } else {
    showToast(res.error.message, 'error');
  }
};
```

3. Tambahkan import icon `StarIcon` dari `@mui/icons-material/Star` di bagian import.

4. Di kolom `actions` (renderCell, sekitar baris 195–222), tambahkan tombol "Poin" di semua cabang (pending/active/blocked) — cara paling simpel: taruh di luar percabangan status, misalnya bungkus return value existing dengan `<Stack direction="row" spacing={1}>` yang berisi tombol status + tombol baru:

```tsx
<IconButton size="small" onClick={() => setPointsDialogUser(user)} aria-label="Sesuaikan poin">
  <StarIcon fontSize="small" />
</IconButton>
```

5. Tambahkan dialog baru sebelum penutup `</Box>` paling akhir (setelah dialog `Tambah User`, sekitar baris akhir file):

```tsx
<Dialog open={Boolean(pointsDialogUser)} onClose={() => setPointsDialogUser(null)} maxWidth="xs" fullWidth>
  <DialogTitle>Sesuaikan Poin — {pointsDialogUser?.full_name}</DialogTitle>
  <Box component="form" onSubmit={handleAdjustPoints}>
    <DialogContent>
      <Stack spacing={2.5} sx={{ mt: 1 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Poin saat ini: {pointsDialogUser?.points ?? 0}. Isi angka negatif untuk mengurangi.
        </Typography>
        <TextField
          label="Jumlah Poin (+/-)"
          type="number"
          value={pointsAmount}
          onChange={(e) => setPointsAmount(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Alasan"
          value={pointsReason}
          onChange={(e) => setPointsReason(e.target.value)}
          required
          fullWidth
          multiline
          rows={2}
        />
      </Stack>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 3 }}>
      <Button onClick={() => setPointsDialogUser(null)} color="inherit">Batal</Button>
      <Button type="submit" variant="contained" disabled={adjustingPoints}>
        {adjustingPoints ? 'Menyimpan...' : 'Simpan'}
      </Button>
    </DialogActions>
  </Box>
</Dialog>
```

---

## Task 2: Reassign Instructor Kelas

### Deskripsi
`updateClass` (`src/controllers/classController.js:52-74`) cuma bisa mengubah `name`/`description`. Kalau instructor keluar dari LSO atau admin salah assign instructor saat create, **tidak ada cara** memindahkan kelas ke instructor lain lewat API — harus edit database langsung.

**Solusi:** Izinkan admin (bukan instructor) mengubah `instructorId` lewat `updateClass`.

### File yang dimodifikasi

#### A. `src/middlewares/validate.js`

Ubah schema `updateClass` (baris 75–78) jadi:

```js
updateClass: Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  description: Joi.string().max(500).allow('', null).optional(),
  instructorId: Joi.string().uuid().optional()
}),
```

#### B. `src/controllers/classController.js`

Ubah `updateClass` (baris 52–74):

```js
export const updateClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, instructorId } = req.body;

  const classData = await prisma.class.findUnique({ where: { id } });
  if (!classData) {
    return res.status(404).json({ success: false, error: { message: 'Kelas tidak ditemukan' } });
  }

  if (req.user.role === 'instructor' && classData.instructorId !== req.user.id) {
    return res.status(403).json({ success: false, error: { message: 'Forbidden. Bukan kelas Anda.' } });
  }

  // Hanya admin yang boleh reassign instructor
  if (instructorId !== undefined && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: { message: 'Hanya admin yang bisa memindahkan kelas ke instructor lain' } });
  }

  if (instructorId !== undefined) {
    const newInstructor = await prisma.user.findUnique({ where: { id: instructorId } });
    if (!newInstructor || !['instructor', 'admin'].includes(newInstructor.role)) {
      return res.status(400).json({ success: false, error: { message: 'Instructor tujuan tidak valid' } });
    }
  }

  const updated = await prisma.class.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(instructorId !== undefined && { instructorId })
    }
  });

  res.json({ success: true, data: updated, message: 'Kelas berhasil diperbarui' });
});
```

#### C. `src/controllers/authController.js` — dukung filter role di `getAllUsers`

Supaya frontend bisa ambil daftar instructor untuk dropdown, tambahkan filter `role` ke `getAllUsers` (baris 287–303). Ubah:

```js
const { search, status } = req.query;

const where = {
  ...(status ? { status } : {}),
```

Menjadi:

```js
const { search, status, role } = req.query;

const where = {
  ...(status ? { status } : {}),
  ...(role ? { role } : {}),
```

#### D. `src/client/pages/admin/AdminDashboardPage.tsx`

1. Tambah `instructorId` ke `ClassFormState` (baris 35–39):

```tsx
interface ClassFormState {
  id: string | null;
  name: string;
  description: string;
  instructorId: string;
}
```

Sesuaikan `EMPTY_FORM` (baris 41) jadi `{ id: null, name: '', description: '', instructorId: '' }`.

2. Tambah state daftar instructor + fetch di `load()` (hanya untuk `isAdmin`):

```tsx
const [instructors, setInstructors] = useState<UserDTO[]>([]);
```

Di dalam `load()`, tambahkan (perlu import `UserDTO` dari `../../api/types`):

```tsx
if (isAdmin) {
  api.get<PaginatedUsers>('/auth/users?role=instructor&pageSize=100').then((res) => {
    if (res.success) setInstructors(res.data.items);
  });
}
```

(Import `PaginatedUsers` juga dari `../../api/types`.)

3. Di `openEdit`, isi `instructorId` dari `cls.instructorId` (perlu pastikan `ClassSummary` di `types.ts` sudah punya field `instructorId` — sudah ada, lihat `src/client/api/types.ts:35`).

4. Sertakan `instructorId` di payload `handleSubmit` (hanya kirim kalau `isAdmin` dan field terisi), dan tambahkan `Select`/`TextField select` di dialog form untuk memilih instructor dari `instructors`, ditampilkan **hanya untuk admin** (`{isAdmin && (...)}`).

**Catatan:** Instructor yang login TIDAK boleh melihat/mengubah field ini (backend sudah menolak di langkah B), jadi di UI juga sembunyikan field-nya kalau `!isAdmin` supaya tidak membingungkan.

---

## Task 3: Hapus / Clear Notifikasi

### Deskripsi
Notifikasi (`src/controllers/authController.js`, section `─── Notifications ───`) sudah punya `GET`, dan `mark read` (single + all), tapi **tidak ada delete**. Daftar notifikasi bakal terus menumpuk tanpa cara dibersihkan user.

### File yang dimodifikasi

#### A. `src/controllers/authController.js`

Tambahkan setelah `markAllNotificationsRead` (di akhir file):

```js
export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== req.user.id) {
    return res.status(404).json({ success: false, error: { message: 'Notifikasi tidak ditemukan' } });
  }

  await prisma.notification.delete({ where: { id } });

  res.json({ success: true });
});

export const clearReadNotifications = asyncHandler(async (req, res) => {
  await prisma.notification.deleteMany({
    where: { userId: req.user.id, read: true }
  });

  res.json({ success: true });
});
```

#### B. `src/routes/authRoutes.js`

Tambahkan import (`deleteNotification, clearReadNotifications`) dan routes setelah `router.put('/notifications/read-all', ...)`:

```js
router.delete('/notifications/:id', authenticate, deleteNotification);
router.delete('/notifications/read', authenticate, clearReadNotifications);
```

#### C. `src/client/components/AppShell.tsx`

1. Tambah handler setelah `handleMarkAllRead` (baris 82–85):

```tsx
const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
  e.stopPropagation();
  await api.delete(`/auth/notifications/${id}`);
  loadNotifications();
};

const handleClearRead = async () => {
  await api.delete('/auth/notifications/read');
  loadNotifications();
};
```

2. Tambahkan tombol "Bersihkan yang dibaca" di sebelah "Tandai semua dibaca" (baris 105–112), dan tombol hapus (ikon X kecil) di tiap `MenuItem` notifikasi (baris 121–141) — pakai `IconButton` kecil dengan `onClick={(e) => handleDeleteNotification(e, n.id)}` (import `CloseIcon` dari `@mui/icons-material/Close`, dan `stopPropagation` penting supaya tidak ikut trigger `handleNotificationClick`).

---

## Task 4: Bersihkan Notifikasi Dangling saat Kelas Dihapus

### Deskripsi
`deleteClass` (`src/controllers/classController.js:77-98`) menghapus quiz/materi/enrollment terkait, tapi **tidak membersihkan `Notification.link`** yang menunjuk ke `/classes/:id` atau `/quiz/:quizId` milik kelas itu. Kalau user klik notifikasi lama ("Materi baru ditambahkan..."), akan mengarah ke kelas yang sudah tidak ada (404 di frontend).

### File yang dimodifikasi

#### A. `src/controllers/classController.js`

Ubah `deleteClass` (baris 77–98) supaya ambil `quizIds` dulu sebelum dihapus, lalu bersihkan notifikasi terkait:

```js
export const deleteClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const classData = await prisma.class.findUnique({ where: { id } });
  if (!classData) {
    return res.status(404).json({ success: false, error: { message: 'Kelas tidak ditemukan' } });
  }

  if (req.user.role === 'instructor' && classData.instructorId !== req.user.id) {
    return res.status(403).json({ success: false, error: { message: 'Forbidden. Bukan kelas Anda.' } });
  }

  const quizzes = await prisma.quiz.findMany({ where: { classId: id }, select: { id: true } });

  // Delete all related data
  await prisma.quizAttempt.deleteMany({ where: { quiz: { classId: id } } });
  await prisma.question.deleteMany({ where: { quiz: { classId: id } } });
  await prisma.quiz.deleteMany({ where: { classId: id } });
  await prisma.material.deleteMany({ where: { classId: id } });
  await prisma.enrollment.deleteMany({ where: { classId: id } });
  await prisma.class.delete({ where: { id } });

  // Bersihkan notifikasi lama yang link-nya menunjuk ke kelas/kuis yang baru saja dihapus
  const danglingLinks = [`/classes/${id}`, ...quizzes.map((q) => `/quiz/${q.id}`)];
  await prisma.notification.deleteMany({ where: { link: { in: danglingLinks } } });

  res.json({ success: true, message: 'Kelas berhasil dihapus' });
});
```

**Catatan:** ini best-effort — kalau format link berubah di masa depan (misal ditambah query string), query `in` ini tidak akan match. Cukup untuk kondisi saat ini karena semua link dibuat persis `/classes/${classId}` atau `/quiz/${quizId}` (lihat `addMaterial` dan `createQuiz` di file yang sama).

---

## Task 5: Hard-Delete User Pending

### Deskripsi
Admin sekarang bisa approve/block/ubah role/hapus poin manual (Task 1), tapi **tidak ada cara menghapus akun secara permanen** — bahkan untuk user berstatus `pending` yang belum pernah login/enroll/apa-apa (misal salah daftar, spam, atau typo NIM/email dan mau daftar ulang). Satu-satunya opsi sekarang adalah "blokir" selamanya, yang tetap menyisakan barisnya di tabel user.

**Solusi:** Endpoint delete khusus untuk user `pending` (aman karena belum ada data terkait — enrollment/quizAttempt/pointTransaction/classesTaught pasti kosong untuk akun yang belum pernah aktif).

### File yang dimodifikasi

#### A. `src/controllers/authController.js`

Tambahkan setelah `blockUser`:

```js
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'User tidak ditemukan' } });
  }

  if (user.status !== 'pending') {
    return res.status(400).json({
      success: false,
      error: { message: 'Hanya user berstatus pending yang bisa dihapus permanen. Gunakan "Blokir" untuk user aktif.' }
    });
  }

  // Defensif: bersihkan relasi yang mungkin ada (harusnya kosong untuk user pending)
  await prisma.notification.deleteMany({ where: { userId: id } });
  await prisma.userBadge.deleteMany({ where: { userId: id } });
  await prisma.pointTransaction.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });

  res.json({ success: true, message: `User ${user.full_name} berhasil dihapus permanen` });
});
```

#### B. `src/routes/authRoutes.js`

Tambahkan import `deleteUser` dan route setelah `router.put('/users/:id/role', ...)`:

```js
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);
```

#### C. `src/client/pages/admin/AdminUsersPage.tsx`

Di kolom `actions`, cabang `user.status === 'pending'` (baris 197–208), tambahkan tombol hapus di samping "Setuju"/"Tolak":

```tsx
<Button
  size="small"
  variant="text"
  color="error"
  onClick={async () => {
    const ok = await confirm({
      title: 'Hapus Permanen',
      message: `Hapus akun "${user.full_name}" secara permanen? Aksi ini tidak bisa dibatalkan.`,
      destructive: true,
      confirmText: 'Hapus Permanen',
    });
    if (!ok) return;
    const res = await api.delete(`/auth/users/${user.id}`);
    if (res.success) {
      showToast(res.message ?? 'User dihapus', 'success');
      load();
    } else {
      showToast(res.error.message, 'error');
    }
  }}
>
  Hapus
</Button>
```

**PENTING:** jangan tampilkan tombol ini untuk status `active`/`blocked` — sengaja dibatasi ke `pending` saja di backend maupun UI supaya tidak ada resiko kehilangan riwayat poin/enrollment/quiz attempt user yang sudah pernah aktif. Kalau butuh "hapus" untuk user aktif, itu di luar scope task ini — gunakan "Blokir" (soft-delete) yang sudah ada.

---

## Ringkasan File yang Dimodifikasi

| # | File | Action | Kompleksitas |
|---|---|---|---|
| 1a | `src/middlewares/validate.js` | Tambah schema `adjustPoints` | Sangat Mudah |
| 1b | `src/controllers/authController.js` | Tambah `adjustUserPoints` | Mudah |
| 1c | `src/routes/authRoutes.js` | Tambah route poin | Sangat Mudah |
| 1d | `src/client/pages/admin/AdminUsersPage.tsx` | Dialog + tombol adjust poin | Sedang |
| 2a | `src/middlewares/validate.js` | Tambah `instructorId` ke `updateClass` schema | Sangat Mudah |
| 2b | `src/controllers/classController.js` | `updateClass` bisa reassign instructor (admin only) | Sedang |
| 2c | `src/controllers/authController.js` | Filter `role` di `getAllUsers` | Sangat Mudah |
| 2d | `src/client/pages/admin/AdminDashboardPage.tsx` | Dropdown pilih instructor (admin only) | Sedang |
| 3a | `src/controllers/authController.js` | `deleteNotification` + `clearReadNotifications` | Mudah |
| 3b | `src/routes/authRoutes.js` | 2 route delete notifikasi | Sangat Mudah |
| 3c | `src/client/components/AppShell.tsx` | Tombol hapus per notifikasi + bersihkan yang dibaca | Sedang |
| 4 | `src/controllers/classController.js` | Bersihkan notifikasi dangling saat `deleteClass` | Mudah |
| 5a | `src/controllers/authController.js` | `deleteUser` (khusus status pending) | Mudah |
| 5b | `src/routes/authRoutes.js` | Route delete user | Sangat Mudah |
| 5c | `src/client/pages/admin/AdminUsersPage.tsx` | Tombol "Hapus" khusus baris pending | Mudah |

**Urutan pengerjaan yang disarankan:** 1 → 5 → 3 → 4 → 2 (Task 2 paling kompleks karena nyentuh 2 halaman admin + butuh dropdown data instructor; Task 1 & 5 saling melengkapi di `AdminUsersPage` jadi enak dikerjakan berurutan).

**Setelah selesai:** jalankan `npm run typecheck`, lalu `npx prisma validate` (tidak ada perubahan schema di round ini, jadi tidak perlu `prisma db push`), lalu test manual tiap endpoint baru sebelum commit.
