import { useEffect, useState, type FormEvent } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import CheckIcon from '@mui/icons-material/Check';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { api } from '../../api/client';
import type {
  AccountStatus,
  PaginatedPointTransactions,
  PaginatedUsers,
  AdminPointTransactionDTO,
  UserDTO,
  UserDetailDTO,
} from '../../api/types';
import type { Role } from '../../api/types';

type FilterValue = 'all' | AccountStatus;

const STATUS_COLOR: Record<AccountStatus, 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  active: 'success',
  blocked: 'error',
};

/** Fallback labels when detail payload only has badgeKey */
const BADGE_LABELS: Record<string, string> = {
  'streak-7': 'Streak 7 Hari',
  'streak-30': 'Streak 30 Hari',
  'quiz-master': 'Quiz Master',
  'class-collector': 'Class Collector',
  'top-10': 'Top 10',
};

interface NewUserForm {
  full_name: string;
  nim: string;
  email: string;
  password: string;
  role: Role;
  program_studi: string;
}

const EMPTY_NEW_USER: NewUserForm = { full_name: '', nim: '', email: '', password: '', role: 'member', program_studi: '' };

interface EditUserForm {
  id: string;
  full_name: string;
  email: string;
  nim: string;
  program_studi: string;
  angkatan: string;
  phone: string;
}

interface UserRowActionsProps {
  user: UserDTO;
  onApprove: (user: UserDTO) => void;
  onBlock: (user: UserDTO) => void;
  onEdit: (user: UserDTO) => void;
  onPoints: (user: UserDTO) => void;
  onDelete: (user: UserDTO) => void;
}

function UserRowActions({ user, onApprove, onBlock, onEdit, onPoints, onDelete }: UserRowActionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const closeMenu = () => setAnchorEl(null);

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      {user.status === 'pending' && (
        <Button size="small" variant="contained" startIcon={<CheckIcon />} onClick={() => onApprove(user)}>
          Setuju
        </Button>
      )}
      {user.status === 'blocked' && (
        <Button size="small" variant="contained" startIcon={<CheckIcon />} onClick={() => onApprove(user)}>
          Aktifkan
        </Button>
      )}
      <IconButton
        size="small"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label="Aksi lainnya"
        aria-controls={menuOpen ? `user-actions-${user.id}` : undefined}
        aria-haspopup="true"
        aria-expanded={menuOpen ? 'true' : undefined}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        id={`user-actions-${user.id}`}
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={closeMenu}
        onClick={(e) => e.stopPropagation()}
      >
        {user.status === 'pending' && (
          <MenuItem
            onClick={() => {
              closeMenu();
              onBlock(user);
            }}
          >
            Tolak
          </MenuItem>
        )}
        {user.status === 'pending' && (
          <MenuItem
            onClick={() => {
              closeMenu();
              onDelete(user);
            }}
            sx={{ color: 'error.main' }}
          >
            Hapus
          </MenuItem>
        )}
        {user.status === 'active' && (
          <MenuItem
            onClick={() => {
              closeMenu();
              onBlock(user);
            }}
            sx={{ color: 'error.main' }}
          >
            Blokir
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            closeMenu();
            onEdit(user);
          }}
        >
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            onPoints(user);
          }}
        >
          Sesuaikan poin
        </MenuItem>
      </Menu>
    </Stack>
  );
}

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });

  const [createOpen, setCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState<NewUserForm>(EMPTY_NEW_USER);
  const [creating, setCreating] = useState(false);

  const [editUser, setEditUser] = useState<EditUserForm | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<UserDetailDTO | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const openDetail = (userId: string) => {
    setDetailUserId(userId);
    setDetailData(null);
    setLoadingDetail(true);
    api.get<UserDetailDTO>(`/auth/users/${userId}`).then((res) => {
      setLoadingDetail(false);
      if (res.success) {
        setDetailData(res.data);
      } else {
        showToast(res.error.message, 'error');
        setDetailUserId(null);
      }
    });
  };

  const [pointsDialogUser, setPointsDialogUser] = useState<UserDTO | null>(null);
  const [pointsAmount, setPointsAmount] = useState('');
  const [pointsReason, setPointsReason] = useState('');
  const [adjustingPoints, setAdjustingPoints] = useState(false);
  const [pointsHistory, setPointsHistory] = useState<AdminPointTransactionDTO[]>([]);
  const [loadingPointsHistory, setLoadingPointsHistory] = useState(false);

  const loadPointsHistory = (userId: string) => {
    setLoadingPointsHistory(true);
    api.get<PaginatedPointTransactions>(`/admin/points?userId=${userId}&pageSize=10`).then((res) => {
      setLoadingPointsHistory(false);
      if (res.success) setPointsHistory(res.data.items);
    });
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(paginationModel.page + 1),
      pageSize: String(paginationModel.pageSize),
    });
    if (filter !== 'all') params.set('status', filter);
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());

    api.get<PaginatedUsers>(`/auth/users?${params.toString()}`).then((res) => {
      setLoading(false);
      if (res.success) {
        setUsers(res.data.items);
        setTotal(res.data.total);
      }
    });
  };

  useEffect(load, [filter, debouncedSearch, paginationModel.page, paginationModel.pageSize]);

  const handleApprove = async (user: UserDTO) => {
    const ok = await confirm(`Aktifkan user "${user.full_name}"?`);
    if (!ok) return;
    const res = await api.put(`/auth/users/${user.id}/approve`);
    if (res.success) {
      showToast(res.message ?? 'User diaktifkan', 'success');
      load();
    } else {
      showToast(res.error.message, 'error');
    }
  };

  const openEdit = (user: UserDTO) => {
    setEditUser({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      nim: user.nim,
      program_studi: user.program_studi ?? '',
      angkatan: user.angkatan != null ? String(user.angkatan) : '',
      phone: user.phone ?? '',
    });
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setSavingEdit(true);
    const res = await api.put(`/auth/users/${editUser.id}`, {
      full_name: editUser.full_name,
      email: editUser.email,
      nim: editUser.nim,
      program_studi: editUser.program_studi || null,
      angkatan: editUser.angkatan ? Number(editUser.angkatan) : null,
      phone: editUser.phone || null,
    });
    setSavingEdit(false);
    if (res.success) {
      showToast(res.message ?? 'Data user berhasil diperbarui', 'success');
      setEditUser(null);
      load();
    } else {
      showToast(res.error.message, 'error');
    }
  };

  const handleBlock = async (user: UserDTO) => {
    const ok = await confirm({
      message: `Blokir user "${user.full_name}"? User tidak akan bisa login.`,
      destructive: true,
      confirmText: 'Blokir',
    });
    if (!ok) return;
    const res = await api.put(`/auth/users/${user.id}/block`);
    if (res.success) {
      showToast(res.message ?? 'User diblokir', 'success');
      load();
    } else {
      showToast(res.error.message, 'error');
    }
  };

  const handleDelete = async (user: UserDTO) => {
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
  };

  const openPoints = (user: UserDTO) => {
    setPointsDialogUser(user);
    setPointsAmount('');
    setPointsReason('');
    loadPointsHistory(user.id);
  };

  const handleRoleChange = async (user: UserDTO, newRole: Role) => {
    if (newRole === user.role) return;
    const ok = await confirm({
      title: 'Ubah Role',
      message: `Ubah role "${user.full_name}" dari ${user.role} menjadi ${newRole}?`,
      confirmText: 'Ubah',
    });
    if (!ok) return;
    const res = await api.put(`/auth/users/${user.id}/role`, { role: newRole });
    if (res.success) {
      showToast(res.message ?? 'Role berhasil diubah', 'success');
      load();
    } else {
      showToast(res.error.message, 'error');
    }
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await api.post('/auth/users', {
      full_name: newUser.full_name,
      nim: newUser.nim,
      email: newUser.email,
      password: newUser.password,
      role: newUser.role,
      program_studi: newUser.program_studi || undefined,
    });
    setCreating(false);
    if (res.success) {
      showToast(res.message ?? 'User berhasil dibuat', 'success');
      setCreateOpen(false);
      setNewUser(EMPTY_NEW_USER);
      load();
    } else {
      showToast(res.error.message, 'error');
    }
  };

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

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const columns: GridColDef<UserDTO>[] = [
    {
      field: 'full_name',
      headerName: 'Nama',
      flex: 1,
      minWidth: 160,
      renderCell: (params) => (
        <Button
          size="small"
          onClick={() => openDetail(params.row.id)}
          sx={{ textTransform: 'none', fontWeight: 600, justifyContent: 'flex-start', px: 0.5 }}
        >
          {params.value}
        </Button>
      ),
    },
    { field: 'nim', headerName: 'NIM', width: 120 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 180 },
    {
      field: 'role',
      headerName: 'Role',
      width: 140,
      sortable: false,
      renderCell: (params) => {
        const user = params.row;
        return (
          <Select
            value={user.role}
            size="small"
            onChange={(e) => handleRoleChange(user, e.target.value as Role)}
            sx={{ fontSize: '0.8rem', '& .MuiSelect-select': { py: 0.5 } }}
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem value="member">Member</MenuItem>
            <MenuItem value="instructor">Instructor</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        );
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color={STATUS_COLOR[params.value as AccountStatus]} sx={{ textTransform: 'capitalize' }} />
      ),
    },
    {
      field: 'points',
      headerName: 'Poin',
      width: 90,
      type: 'number',
    },
    {
      field: 'actions',
      headerName: 'Aksi',
      width: 160,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <UserRowActions
          user={params.row}
          onApprove={handleApprove}
          onBlock={handleBlock}
          onEdit={openEdit}
          onPoints={openPoints}
          onDelete={handleDelete}
        />
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="overline">Khusus Admin</Typography>
          <Typography variant="h2">Kelola Pengguna</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          Tambah User
        </Button>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, value) => {
            if (!value) return;
            setFilter(value);
            setPaginationModel((prev) => ({ ...prev, page: 0 }));
          }}
          size="small"
        >
          <ToggleButton value="all">Semua</ToggleButton>
          <ToggleButton value="pending">Pending</ToggleButton>
          <ToggleButton value="active">Aktif</ToggleButton>
          <ToggleButton value="blocked">Diblokir</ToggleButton>
        </ToggleButtonGroup>

        <TextField
          placeholder="Cari nama, email, atau NIM..."
          size="small"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPaginationModel((prev) => ({ ...prev, page: 0 }));
          }}
          sx={{ minWidth: 260 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>

      <Card>
        <DataGrid
          rows={users}
          columns={columns}
          rowCount={total}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          sx={{ border: 0 }}
        />
      </Card>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tambah User Baru</DialogTitle>
        <Box component="form" onSubmit={handleCreateUser}>
          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                User yang dibuat lewat form ini langsung aktif, tanpa perlu proses approval. Cocok untuk
                onboarding instructor secara langsung.
              </Typography>
              <TextField
                label="Nama Lengkap"
                value={newUser.full_name}
                onChange={(e) => setNewUser((prev) => ({ ...prev, full_name: e.target.value }))}
                required
                fullWidth
              />
              <TextField
                label="NIM"
                value={newUser.nim}
                onChange={(e) => setNewUser((prev) => ({ ...prev, nim: e.target.value }))}
                required
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                required
                fullWidth
              />
              <TextField
                label="Password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                required
                fullWidth
                helperText="Minimal 6 karakter"
              />
              <TextField
                label="Role"
                select
                value={newUser.role}
                onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value as Role }))}
                fullWidth
              >
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="instructor">Instructor</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
              <TextField
                label="Program Studi (opsional)"
                value={newUser.program_studi}
                onChange={(e) => setNewUser((prev) => ({ ...prev, program_studi: e.target.value }))}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setCreateOpen(false)} color="inherit">
              Batal
            </Button>
            <Button type="submit" variant="contained" disabled={creating}>
              {creating ? 'Menyimpan...' : 'Buat User'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(editUser)} onClose={() => setEditUser(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Data User</DialogTitle>
        <Box component="form" onSubmit={handleEditSubmit}>
          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Koreksi data user di sini (mis. salah ketik saat daftar). User sendiri tidak bisa
                mengubah nama/email/NIM/angkatan miliknya sendiri.
              </Typography>
              <TextField
                label="Nama Lengkap"
                value={editUser?.full_name ?? ''}
                onChange={(e) => setEditUser((prev) => (prev ? { ...prev, full_name: e.target.value } : prev))}
                required
                fullWidth
              />
              <TextField
                label="NIM"
                value={editUser?.nim ?? ''}
                onChange={(e) => setEditUser((prev) => (prev ? { ...prev, nim: e.target.value } : prev))}
                required
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                value={editUser?.email ?? ''}
                onChange={(e) => setEditUser((prev) => (prev ? { ...prev, email: e.target.value } : prev))}
                required
                fullWidth
              />
              <TextField
                label="Program Studi"
                value={editUser?.program_studi ?? ''}
                onChange={(e) => setEditUser((prev) => (prev ? { ...prev, program_studi: e.target.value } : prev))}
                fullWidth
              />
              <TextField
                label="Angkatan"
                type="number"
                value={editUser?.angkatan ?? ''}
                onChange={(e) => setEditUser((prev) => (prev ? { ...prev, angkatan: e.target.value } : prev))}
                fullWidth
                slotProps={{ htmlInput: { min: 2020, max: 2035 } }}
              />
              <TextField
                label="Telepon"
                value={editUser?.phone ?? ''}
                onChange={(e) => setEditUser((prev) => (prev ? { ...prev, phone: e.target.value } : prev))}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setEditUser(null)} color="inherit">
              Batal
            </Button>
            <Button type="submit" variant="contained" disabled={savingEdit}>
              {savingEdit ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(detailUserId)} onClose={() => setDetailUserId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{detailData?.user.full_name ?? 'Detail User'}</DialogTitle>
        <DialogContent>
          {loadingDetail && (
            <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
              Memuat...
            </Typography>
          )}
          {!loadingDetail && detailData && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Chip label={detailData.user.email} size="small" />
                <Chip label={`NIM ${detailData.user.nim}`} size="small" />
                <Chip label={detailData.user.role} size="small" color="primary" sx={{ textTransform: 'capitalize' }} />
                <Chip
                  label={detailData.user.status}
                  size="small"
                  color={STATUS_COLOR[detailData.user.status]}
                  sx={{ textTransform: 'capitalize' }}
                />
                <Chip label={`${detailData.user.points} poin`} size="small" variant="outlined" />
              </Stack>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Kelas Diikuti ({detailData.classes.length})
                </Typography>
                {detailData.classes.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Belum mengikuti kelas apa pun.
                  </Typography>
                ) : (
                  <List dense disablePadding>
                    {detailData.classes.map((cls) => (
                      <ListItem key={cls.id} disablePadding sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={cls.name}
                          secondary={`Bergabung ${new Date(cls.joined_at).toLocaleDateString('id-ID')}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Riwayat Kuis ({detailData.quizAttempts.length})
                </Typography>
                {detailData.quizAttempts.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Belum pernah mengerjakan kuis.
                  </Typography>
                ) : (
                  <List dense disablePadding>
                    {detailData.quizAttempts.map((attempt) => (
                      <ListItem
                        key={attempt.id}
                        disablePadding
                        sx={{ py: 0.5 }}
                        secondaryAction={
                          <Chip label={attempt.score} size="small" color={attempt.score >= 60 ? 'success' : 'warning'} />
                        }
                      >
                        <ListItemText
                          primary={`${attempt.quizTitle} — ${attempt.className}`}
                          secondary={new Date(attempt.created_at).toLocaleDateString('id-ID')}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmojiEventsIcon fontSize="small" /> Badge ({detailData.badges.length})
                </Typography>
                {detailData.badges.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Belum ada badge.
                  </Typography>
                ) : (
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {detailData.badges.map((b) => {
                      const badge = b as { badgeKey: string; label?: string; earned_at: string };
                      return (
                        <Chip
                          key={badge.badgeKey}
                          icon={<EmojiEventsIcon />}
                          label={badge.label ?? BADGE_LABELS[badge.badgeKey] ?? badge.badgeKey}
                          variant="outlined"
                          size="small"
                        />
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDetailUserId(null)} color="inherit">
            Tutup
          </Button>
        </DialogActions>
      </Dialog>

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
        <Divider />
        <Box sx={{ px: 3, py: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Riwayat Poin Terakhir
          </Typography>
          {loadingPointsHistory && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Memuat...
            </Typography>
          )}
          {!loadingPointsHistory && pointsHistory.length === 0 && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Belum ada transaksi poin.
            </Typography>
          )}
          {!loadingPointsHistory && pointsHistory.length > 0 && (
            <Stack spacing={1}>
              {pointsHistory.map((tx) => (
                <Box key={tx.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" noWrap>
                      {tx.description}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {formatDateTime(tx.created_at)} &bull; {tx.type}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, whiteSpace: 'nowrap', color: tx.amount < 0 ? 'error.main' : 'success.main' }}
                  >
                    {tx.amount < 0 ? '' : '+'}{tx.amount}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
