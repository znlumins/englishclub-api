import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

type StatCardAccent = 'primary' | 'success' | 'warning';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  accent?: StatCardAccent;
}

export default function StatCard({ icon, label, value, accent = 'primary' }: StatCardProps) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: `${accent}.light`,
            color: `${accent}.main`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2">{label}</Typography>
          <Typography variant="h3" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
