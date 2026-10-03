import Button from '@mui/material/Button';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import EmptyState from './EmptyState';

interface LoadErrorProps {
  title?: string;
  message: string;
  onRetry: () => void;
}

/** Pola error+retry yang seragam untuk fetch halaman. */
export default function LoadError({
  title = 'Gagal memuat data',
  message,
  onRetry,
}: LoadErrorProps) {
  return (
    <EmptyState
      icon={<ErrorOutlineIcon />}
      title={title}
      description={message}
      action={
        <Button variant="contained" onClick={onRetry}>
          Coba Lagi
        </Button>
      }
    />
  );
}
