// src/components/CustomButton.tsx
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import React from 'react';

import type { ButtonProps } from '@mui/material/Button';

interface CustomButtonProps extends Omit<ButtonProps, 'title'> {
  title?: string;
  icon?: React.ReactNode;
}

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadius,
  fontWeight: 'bold',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const CustomButton: React.FC<CustomButtonProps> = ({ title, icon, children, ...props }) => {
  return (
    <StyledButton variant="contained" startIcon={icon} {...props}>
      {title || children}
    </StyledButton>
  );
};

export default CustomButton;