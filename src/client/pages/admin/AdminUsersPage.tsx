import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Button from '@mui/material/Button';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import CheckIcon from '@mui/icons-material/Check';
import BlockIcon from '@mui/icons-material/Block';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { api } from '../../api/client';
import type { AccountStatus, UserDTO } from '../../api/types';
import PageLoader from '../../components/PageLoader';

type FilterValue = 'all' | AccountStatus;

const ROLE_COLOR: Record<UserDTO['role'], 'primary' | 'default'> = {
  admin: 'primary',
  instructor: 'primary',
  member: 'default',
};

const STATUS_COLOR: Record<AccountStatus, 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  active: 'success',
  blocked: 'error',
};

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState<UserDTO[] | null>(null);
  const [filter, setFilter] = useState<FilterValue>('all');

  const load = () => {
    api.get<UserDTO[]>('/auth/users').then((res) => {
      if (res.success) setUsers(res.data);
    });
  };

  useEffect(load, []);

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

  const handleBlock = async (user: UserDTO) => {
    const ok = await confirm({
      message: `Blokir user "${user.full_name}"? User tidak akan bisa login.`,
      destructive: true,
      confirmText: 'Blokir',
    });
    if (!ok) return;
    const res = await api.put(`/auth/users/${user.id}/reject`);
    if (res.success) {
      showToast(res.message ?? 'User diblokir', 'success');
      load();
    } else {
      showToast(res.error.message, 'error');
    }
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return filter === 'all' ? users : users.filter((u) => u.status === filter);
  }, [users, filter]);

  const columns: GridColDef<UserDTO>[] = [
    { field: 'full_name', headerName: 'Nama', flex: 1, minWidth: 160 },
    { field: 'nim', headerName: 'NIM', width: 120 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 180 },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color={ROLE_COLOR[params.value as UserDTO['role']]} sx={{ textTransform: 'capitalize' }} />
      ),
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
      width: 200,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const user = params.row;
        if (user.status === 'pending') {
          return (
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="contained" startIcon={<CheckIcon />} onClick={() => handleApprove(user)}>
                Setuju
              </Button>
              <Button size="small" variant="outlined" color="error" startIcon={<BlockIcon />} onClick={() => handleBlock(user)}>
                Tolak
              </Button>
            </Stack>
          );
        }
        if (user.status === 'active') {
          return (
            <Button size="small" variant="outlined" color="error" startIcon={<BlockIcon />} onClick={() => handleBlock(user)}>
              Blokir
            </Button>
          );
        }
        return (
          <Button size="small" variant="contained" startIcon={<CheckIcon />} onClick={() => handleApprove(user)}>
            Aktifkan
          </Button>
        );
      },
    },
  ];

  return (
    <Box>
      <Typography variant="overline">Khusus Admin</Typography>
      <Typography variant="h2" sx={{ mb: 3 }}>
        Kelola Pengguna
      </Typography>

      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={(_, value) => value && setFilter(value)}
        size="small"
        sx={{ mb: 3 }}
      >
        <ToggleButton value="all">Semua</ToggleButton>
        <ToggleButton value="pending">Pending</ToggleButton>
        <ToggleButton value="active">Aktif</ToggleButton>
        <ToggleButton value="blocked">Diblokir</ToggleButton>
      </ToggleButtonGroup>

      {users === null && <PageLoader />}

      {users !== null && (
        <Card>
          <DataGrid
            rows={filteredUsers}
            columns={columns}
            autoHeight
            disableRowSelectionOnClick
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            pageSizeOptions={[10, 25, 50]}
            sx={{ border: 0 }}
          />
        </Card>
      )}
    </Box>
  );
}
