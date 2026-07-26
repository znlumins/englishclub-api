import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import StarIcon from '@mui/icons-material/Star';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import type { ClassSummary, UserDTO } from '../api/types';
import StatCard from '../components/StatCard';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';

export default function DashboardPage() {
  const { user, updateUser } = useAuth();
  const [myClasses, setMyClasses] = useState<ClassSummary[] | null>(null);

  useEffect(() => {
    api.get<UserDTO>('/auth/me').then((res) => {
      if (res.success) updateUser(res.data);
    });
    api.get<ClassSummary[]>('/classes/my').then((res) => {
      if (res.success) setMyClasses(res.data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <Typography variant="overline">Dashboard</Typography>
      <Typography variant="h2" sx={{ mb: 4 }}>
        Halo, {user?.full_name ?? 'Member'}
      </Typography>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, mb: 5 }}>
        <StatCard icon={<StarIcon />} label="Total Poin" value={user?.points ?? 0} />
        <StatCard icon={<LocalFireDepartmentIcon />} label="Streak Harian" value={`${user?.streak_days ?? 0} hari`} />
        <StatCard icon={<MenuBookIcon />} label="Kelas Diikuti" value={myClasses?.length ?? 0} />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h3">Kelas Saya</Typography>
        <Button component={RouterLink} to="/classes" endIcon={<ArrowForwardIcon />}>
          Jelajahi Katalog
        </Button>
      </Box>

      {myClasses === null && <PageLoader />}

      {myClasses !== null && myClasses.length === 0 && (
        <EmptyState
          icon={<MenuBookIcon />}
          title="Belum ada kelas"
          description="Kamu belum mendaftar ke kelas mana pun. Jelajahi katalog untuk mulai belajar."
          action={
            <Button component={RouterLink} to="/classes" variant="contained">
              Lihat Katalog Kelas
            </Button>
          }
        />
      )}

      {myClasses !== null && myClasses.length > 0 && (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' } }}>
          {myClasses.map((cls) => (
            <Card key={cls.id}>
              <CardActionArea component={RouterLink} to={`/classes/${cls.id}`}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {cls.name}
                  </Typography>
                  <Typography variant="body2">
                    Instructor: {cls.instructor?.full_name ?? '-'}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
