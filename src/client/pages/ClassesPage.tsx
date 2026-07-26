import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import PeopleIcon from '@mui/icons-material/People';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { api } from '../api/client';
import type { ClassSummary } from '../api/types';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassSummary[] | null>(null);
  const [myClassIds, setMyClassIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get<ClassSummary[]>('/classes').then((res) => {
      if (res.success) setClasses(res.data);
    });
    api.get<ClassSummary[]>('/classes/my').then((res) => {
      if (res.success) setMyClassIds(new Set(res.data.map((c) => c.id)));
    });
  }, []);

  return (
    <Box>
      <Typography variant="overline">Katalog</Typography>
      <Typography variant="h2" sx={{ mb: 4 }}>
        Semua Kelas
      </Typography>

      {classes === null && <PageLoader />}

      {classes !== null && classes.length === 0 && (
        <EmptyState icon={<MenuBookIcon />} title="Belum ada kelas" description="Admin belum membuat kelas apa pun." />
      )}

      {classes !== null && classes.length > 0 && (
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' } }}>
          {classes.map((cls) => (
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
                <Typography variant="body2">Instructor: {cls.instructor?.full_name ?? '-'}</Typography>
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
