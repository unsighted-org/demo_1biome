import React from 'react';
import { List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { AccessTime, FavoriteOutlined, DirectionsRunOutlined, Co2Outlined } from '@mui/icons-material';
import type { HealthEnvironmentData, HealthScore } from '@/types';

interface HealthSummarySectionProps {
  healthData: HealthEnvironmentData[];
  healthScores: HealthScore | null;
}

const HealthSummarySection: React.FC<HealthSummarySectionProps> = ({ healthData, healthScores }) => {
  const latestHealthData = healthData[healthData.length - 1] || {} as HealthEnvironmentData;

  return (
    <List>
      <ListItem>
        <ListItemIcon><AccessTime /></ListItemIcon>
        <ListItemText primary="Last Sync" secondary={new Date(latestHealthData.timestamp).toLocaleString()} />
      </ListItem>
      <ListItem>
        <ListItemIcon><FavoriteOutlined /></ListItemIcon>
        <ListItemText primary="Cardio Health Score" secondary={`${healthScores?.cardioHealthScore.toFixed(2) || 'N/A'}`} />
      </ListItem>
      <ListItem>
        <ListItemIcon><DirectionsRunOutlined /></ListItemIcon>
        <ListItemText primary="Physical Activity Score" secondary={`${healthScores?.physicalActivityScore.toFixed(0) || 'N/A'}`} />
      </ListItem>
      <ListItem>
        <ListItemIcon><Co2Outlined /></ListItemIcon>
        <ListItemText primary="Environmental Impact Score" secondary={`${healthScores?.environmentalImpactScore.toFixed(2) || 'N/A'}`} />
      </ListItem>
    </List>
  );
};

export default HealthSummarySection;