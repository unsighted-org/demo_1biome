import React from 'react';
import { List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { AccessTime, FavoriteOutlined, DirectionsRunOutlined, Co2Outlined } from '@mui/icons-material';
import type { HealthEnvironmentData, HealthScores } from '../../types';

interface HealthSummarySectionProps {
  healthData: HealthEnvironmentData[];
  healthScores: HealthScores | null;
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
        <ListItemText primary="Average Heart Rate" secondary={`${healthScores?.cardioHealthScore.toFixed(2) || 'N/A'} bpm`} />
      </ListItem>
      <ListItem>
        <ListItemIcon><DirectionsRunOutlined /></ListItemIcon>
        <ListItemText primary="Average Daily Steps" secondary={healthScores?.physicalActivityScore.toFixed(0) || 'N/A'} />
      </ListItem>
      <ListItem>
        <ListItemIcon><Co2Outlined /></ListItemIcon>
        <ListItemText primary="Environmental Impact Score" secondary={healthScores?.environmentalImpactScore.toFixed(2) || 'N/A'} />
      </ListItem>
    </List>
  );
};

export default HealthSummarySection;