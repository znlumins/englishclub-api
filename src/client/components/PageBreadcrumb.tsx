import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

interface BreadcrumbItem {
  label: string;
  to?: string;
  icon?: ReactNode;
}

interface PageBreadcrumbProps {
  items: BreadcrumbItem[];
  rootLabel?: string;
  rootTo?: string;
}

export default function PageBreadcrumb({ items, rootLabel = 'Katalog Kelas', rootTo = '/classes' }: PageBreadcrumbProps) {
  return (
    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
      <Link
        component={RouterLink}
        to={rootTo}
        underline="hover"
        color="inherit"
        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
      >
        <HomeIcon fontSize="small" />
        {rootLabel}
      </Link>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        if (isLast) {
          return (
            <Typography key={idx} color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {item.icon && <Box sx={{ display: 'flex', fontSize: 'inherit' }}>{item.icon}</Box>}
              {item.label}
            </Typography>
          );
        }
        return (
          <Link
            key={idx}
            component={RouterLink}
            to={item.to ?? '#'}
            underline="hover"
            color="inherit"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            {item.icon && <Box sx={{ display: 'flex', fontSize: 'inherit' }}>{item.icon}</Box>}
            {item.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
