// components/HealthDataSummary.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Skeleton,
} from '@mui/material';
import React from 'react';

import {
  formatDate,
  calculateBMI,
  getActivityLevel,
  getEnvironmentalImpact,
  getAirQualityDescription,
} from '@/lib/helpers';

import type { HealthEnvironmentData } from '@/types';

interface HealthDataSummaryProps {
  healthData: HealthEnvironmentData[];
  isMobile: boolean;
  isInitialLoad: boolean;
}

const HealthDataSummary: React.FC<HealthDataSummaryProps> = ({ healthData, isMobile, isInitialLoad }) => {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Date</TableCell>
          <TableCell>Steps</TableCell>
          <TableCell>Activity Level</TableCell>
          <TableCell>Heart Rate</TableCell>
          {!isMobile && (
            <>
              <TableCell>BMI</TableCell>
              <TableCell>Environmental Impact</TableCell>
              <TableCell>Air Quality</TableCell>
            </>
          )}
        </TableRow>
      </TableHead>
      <TableBody>
        {isInitialLoad ? (
          <TableRow>
            <TableCell colSpan={isMobile ? 4 : 7}>
              <Skeleton variant="rectangular" height={40} />
            </TableCell>
          </TableRow>
        ) : healthData.length === 0 ? (
          <TableRow>
            <TableCell colSpan={isMobile ? 4 : 7}>
              <Typography align="center">No health data available</Typography>
            </TableCell>
          </TableRow>
        ) : (
          healthData.map((data: HealthEnvironmentData) => (
            <TableRow key={data._id}>
              <TableCell>{formatDate(data.timestamp)}</TableCell>
              <TableCell>{data.steps}</TableCell>
              <TableCell>{getActivityLevel(data.steps)}</TableCell>
              <TableCell>{data.heartRate}</TableCell>
              {!isMobile && (
                <>
                  <TableCell>{calculateBMI(data.weight, data.height).toFixed(2)}</TableCell>
                  <TableCell>{getEnvironmentalImpact(data)}</TableCell>
                  <TableCell>{getAirQualityDescription(data.airQualityIndex)}</TableCell>
                </>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default HealthDataSummary;