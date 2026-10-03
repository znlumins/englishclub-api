import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

export default function NotFoundPage() {
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ maxWidth: 520, mx: 'auto', mt: { xs: 6, md: 12 }, px: 2 }}>
      <EmptyState
        icon={<SearchOffIcon />}
        title="Halaman tidak ditemukan"
        description="URL yang kamu buka tidak ada atau sudah dipindahkan."
        action={
          <Button
            component={RouterLink}
            to={isAuthenticated ? '/dashboard' : '/'}
            variant="contained"
          >
            {isAuthenticated ? 'Ke Dashboard' : 'Ke Beranda'}
          </Button>
        }
      />
      <Typography variant="body2" sx={{ textAlign: 'center', mt: 2, color: 'text.secondary' }}>
        Kode kesalahan: 404
      </Typography>
    </Box>
  );
}
