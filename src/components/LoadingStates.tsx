// e.g., src/components/LoadingOverlay.tsx
import { CircularProgress, Typography } from '@mui/material';
import styles from '@/styles/Globe.module.css';

export const LoadingOverlay = ({ message }: { message: string }) => {
  return (
    <div className={styles['globe-loading-overlay']}>
      <div className={styles['globe-loading-container']}>
        <CircularProgress size={40} />
        <Typography className={styles['loading-text']}>{message}</Typography>
      </div>
    </div>
  );
};
