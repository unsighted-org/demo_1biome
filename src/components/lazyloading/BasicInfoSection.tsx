import React from 'react';
import { List, ListItem, ListItemText } from '@mui/material';
import type { UserState } from '../../types';

interface BasicInfoSectionProps {
  user: UserState | null;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ user }) => {
  if (!user) return null;

  return (
    <List>
      <ListItem>
        <ListItemText primary="Height" secondary={`${user.height} cm`} />
      </ListItem>
      <ListItem>
        <ListItemText primary="Weight" secondary={`${user.weight} kg`} />
      </ListItem>
      <ListItem>
        <ListItemText primary="Date of Birth" secondary={user.dateOfBirth} />
      </ListItem>
    </List>
  );
};

export default BasicInfoSection;