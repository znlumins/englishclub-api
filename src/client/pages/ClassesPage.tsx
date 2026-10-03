import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { api } from '../api/client';
import type { ClassSummary } from '../api/types';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [myClassIds, setMyClassIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const load = () => {
    setLoadError(null);
    api.get<ClassSummary[]>('/classes').then((res) => {
      if (res.success) setClasses(res.data);
      else setLoadError(res.error.message);
    });
    api.get<ClassSummary[]>('/classes/my').then((res) => {
      if (res.success) setMyClassIds(new Set(res.data.map((c) => c.id)));
    });
  };

  useEffect(load, []);

  const filteredClasses = useMemo(() => {
    if (!classes) return [];
    if (!search.trim()) return classes;
    const q = search.toLowerCase();
    return classes.filter(
      (cls) =>
        cls.name.toLowerCase().includes(q) ||
        (cls.description ?? '').toLowerCase().includes(q) ||
        (cls.instructor?.full_name ?? '').toLowerCase().includes(q)
    );
  }, [classes, search]);

  return (
    <Box>
      <Typography variant="overline">Katalog</Typography>
      <Typography variant="h2" sx={{ mb: 4 }}>
        Semua Kelas
      </Typography>

      <TextField
        placeholder="Cari kelas..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          },
        }}
      />

      {classes === null && !loadError && <PageLoader />}

      {loadError && (
        <EmptyState
          icon={<ErrorOutlineIcon />}
          title="Gagal memuat daftar kelas"
          description={loadError}
          action={
            <Button variant="contained" onClick={load}>
              Coba Lagi
            </Button>
          }
        />
      )}

      {classes !== null && filteredClasses.length === 0 && (
        <EmptyState
          icon={<SearchIcon />}
          title={search ? 'Kelas tidak ditemukan' : 'Belum ada kelas'}
          description={search ? `Tidak ada kelas dengan kata kunci "${search}"` : 'Admin belum membuat kelas apa pun.'}
        />
      )}

      {filteredClasses.length > 0 && (
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' } }}>
          {filteredClasses.map((cls) => (
            <Card key={cls.id} sx={{ display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ p: 3, flexGrow: 1 }}>
                {myClassIds.has(cls.id) && (
                  <Chip label="Terdaftar" size="small" color="success" sx={{ mb: 1.5 }} />
                )}
                <Typography variant="h4" sx={{ mb: 1 }}>
                  {cls.name}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1.5, minHeight: 40 }}>
                  {cls.description || 'Tidak ada deskripsi.'}
                </Typography>
                <Typography variant="body2">Instruktur: {cls.instructor?.full_name ?? '-'}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, color: 'text.secondary' }}>
                  <PeopleIcon fontSize="small" />
                  <Typography variant="body2">{cls._count?.enrollments ?? 0} siswa</Typography>
                </Box>
              </CardContent>
              <CardActions sx={{ px: 3, pb: 3 }}>
                <Button component={RouterLink} to={`/classes/${cls.id}`} variant="contained" fullWidth>
                  Lihat Detail
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
