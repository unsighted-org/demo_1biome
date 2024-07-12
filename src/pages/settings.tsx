import { Notifications, Lock, ExitToApp, VpnKey, DeleteForever, Favorite, DirectionsRun, Nature } from '@mui/icons-material';
import { Box, List, ListSubheader, ListItem, ListItemIcon, ListItemText, Switch, Divider, Paper} from '@mui/material';
import { useRouter } from 'next/router';
import React from 'react';

import CustomButton from '@/components/CustomButton';
import { useAuth } from '@/context/AuthContext';
import { useAppSelector } from '@/store';

import type { UserSettings, UserState } from '@/types';

type NotificationPreferenceKey = keyof UserSettings['notificationPreferences'];
type ToggleableSettings = Omit<UserSettings, '_id' | 'userId' | 'dataRetentionPeriod'>;

const SettingsPage: React.FC = () => {
  const router = useRouter();
  const { user, signOut, updateUserSettings } = useAuth();
  const settings = useAppSelector((state: { user: UserState }) => state.user.settings);

  const handleToggle = async (key: keyof ToggleableSettings): Promise<void> => {
    if (user && settings) {
      const updatedSettings: Partial<UserSettings> = {
        [key]: !settings[key]
      };
      try {
        await updateUserSettings(updatedSettings);
      } catch (error) {
        console.error('Update settings error:', error);
      }
    }
  }

  const handleNotificationPreferenceToggle = async (preference: NotificationPreferenceKey): Promise<void> => {
    if (user && settings && settings.notificationPreferences) {
      const updatedPreferences: UserSettings['notificationPreferences'] = {
        ...settings.notificationPreferences,
        [preference]: !settings.notificationPreferences[preference]
      };
      try {
        await updateUserSettings({ notificationPreferences: updatedPreferences });
      } catch (error) {
        console.error('Update notification preference error:', error);
      }
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user || !settings) {
    return null; // or a loading spinner
  }


  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Paper elevation={3} sx={{ bgcolor: 'background.paper' }}>
        <List subheader={<ListSubheader>Notifications</ListSubheader>}>
          <ListItem>
            <ListItemIcon><Notifications /></ListItemIcon>
            <ListItemText primary="Enable Notifications" />
            <Switch
              edge="end"
              checked={settings.notificationsEnabled}
              onChange={() => handleToggle('notificationsEnabled')}
            />
          </ListItem>
          {settings.notificationsEnabled && (
            <>
              <ListItem>
                <ListItemText primary="Daily Reminder" secondary="Receive daily reminders to log your health data" />
                <Switch
                  edge="end"
                  checked={settings.dailyReminder}
                  onChange={() => handleToggle('dailyReminder')}
                />
              </ListItem>
              <ListItem>
                <ListItemText primary="Weekly Summary" secondary="Receive weekly health summaries" />
                <Switch
                  edge="end"
                  checked={settings.weeklySummary}
                  onChange={() => handleToggle('weeklySummary')}
                />
              </ListItem>
              <ListSubheader>Notification Preferences</ListSubheader>
              <ListItem>
                <ListItemIcon><Favorite /></ListItemIcon>
                <ListItemText primary="Heart Rate Alerts" />
                <Switch
                  edge="end"
                  checked={settings.notificationPreferences?.heartRate ?? false}
                  onChange={() => handleNotificationPreferenceToggle('heartRate')}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><DirectionsRun /></ListItemIcon>
                <ListItemText primary="Step Goal Notifications" />
                <Switch
                  edge="end"
                  checked={settings.notificationPreferences?.stepGoal ?? false}
                  onChange={() => handleNotificationPreferenceToggle('stepGoal')}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Nature /></ListItemIcon>
                <ListItemText primary="Environmental Impact Alerts" />
                <Switch
                  edge="end"
                  checked={settings.notificationPreferences?.environmentalImpact ?? false}
                  onChange={() => handleNotificationPreferenceToggle('environmentalImpact')}
                />
              </ListItem>
            </>
          )}
        </List>
        <Divider />
        <List subheader={<ListSubheader>Privacy</ListSubheader>}>
          <ListItem>
            <ListItemIcon><Lock /></ListItemIcon>
            <ListItemText primary="Share Data with Friends" secondary="Allow friends to see your health stats" />
            <Switch
              edge="end"
              checked={settings.shareData}
              onChange={() => handleToggle('shareData')}
            />
          </ListItem>
        </List>
        <Divider />
        <List subheader={<ListSubheader>Account</ListSubheader>}>
          <ListItem button onClick={() => router.push('/change-password')}>
            <ListItemIcon><VpnKey /></ListItemIcon>
            <ListItemText primary="Change Password" />
          </ListItem>
          <ListItem button onClick={() => router.push('/delete-account')}>
            <ListItemIcon><DeleteForever /></ListItemIcon>
            <ListItemText primary="Delete Account" />
          </ListItem>
        </List>
      </Paper>
      <Box sx={{ mt: 3 }}>
        <CustomButton
          title="Logout"
          onClick={handleLogout}
          startIcon={<ExitToApp />}
          fullWidth
        />
      </Box>
    </Box>
  );
};

export default SettingsPage;