import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import logo from '../assets/logo.png';

interface BrandProps {
  size?: number;
  showWordmark?: boolean;
}

export default function Brand({ size = 36, showWordmark = true }: BrandProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Box
        component="img"
        src={logo}
        alt="English Club"
        sx={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
      />
      {showWordmark && (
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
          English Club
        </Typography>
      )}
    </Box>
  );
}
