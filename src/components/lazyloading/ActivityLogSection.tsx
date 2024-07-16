import React from 'react';
import { List, ListItem, ListItemText } from '@mui/material';
import type { HealthEnvironmentData } from '../../types';

interface ActivityLogSectionProps {
  healthData: HealthEnvironmentData[];
}

const ActivityLogSection: React.FC<ActivityLogSectionProps> = ({ healthData }) => {
  return (
    <List>
      {healthData.slice(-5).reverse().map((data, index) => (
        <ListItem key={index}>
          <ListItemText 
            primary={new Date(data.timestamp).toLocaleDateString()} 
            secondary={`Steps: ${data.steps}, Heart Rate: ${data.heartRate} bpm`} 
          />
        </ListItem>
      ))}
    </List>
  );
};

export default ActivityLogSection;