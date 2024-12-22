import React from 'react';
import { Avatar, Box, Typography } from '@mui/material';
import type { UserState } from '../../types';

interface ProfileSectionProps {
  user: UserState | null;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ user }) => {
  if (!user) return null;

  return (
    <Box display="flex" flexDirection="column" alignItems="center" component="div">
      <Avatar src={user.avatarUrl || ''} sx={{ width: 100, height: 100, mb: 2 }} />
      <Typography variant="h5">{user.name}</Typography>
      <Typography variant="body2" color="textSecondary">{user.email}</Typography>
    </Box>
  );
};

export default ProfileSection;