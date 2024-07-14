import { Notifications, Lock, ExitToApp, VpnKey, DeleteForever, Favorite, DirectionsRun, Nature } from '@mui/icons-material';
import { Box, List, ListSubheader, ListItem, ListItemIcon, ListItemText, Switch, Divider, Paper, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import React from 'react';

import CustomButton from '@/components/CustomButton';
import { useAuth } from '@/context/AuthContext';
import { useAppSelector } from '@/store';

import type { UserSettings, UserState } from '@/types';



// Make environment impact alerts toggleable when toggling environmental impact notifications in the settings page by adding a new function handleNotificationPreferenceToggle that toggles the environmentalImpact notification preference in the user settings. The function should be called when the environmental impact alerts switch is toggled in the settings page. The function should update the user settings in the database and should be an async function that takes a single argument, the notification preference key to toggle. The function should be defined in the SettingsPage component and should be called with the 'environmentalImpact' key when the environmental impact alerts switch is toggled.
// What the function should do when called with the 'environmentalImpact' key when envrironmental impact alerts switch is toggled in the settings page:
// 1. Check if the user and user settings are available.
// 2. Check if the environmentalImpact notification preference is available in the user settings.
// 3. Toggle the environmentalImpact notification preference in the user settings.
// 4. Update the user settings in the database using the updateUserSettings function from the useAuth hook.
// 5. Catch and log any errors that occur during the update process.
// 6. The function should be an async function that takes a single argument, the notification preference key to toggle.
// 7. The function should be called with the 'environmentalImpact' key when the environmental impact alerts switch is toggled in the settings page.
// 8. The function should be defined in the SettingsPage component.
// 9. The function should utlize user geo location data to determine the country of the user, and overall location in order to alert of the environmental impact of the user's location.
// 10. The funtion should only be trigger once without repeating the same action multiple times just because the switch is toggled multiple times.
// 11. Once ouf of environmental impact radius alert of Environmental impact of the user's location should be triggers to let them know no longer an impact. 
// 12. The function should also automaticlaly alert when the impact that was orignally alerted is no longer an issue.
// 13. Allow within the notification preferences to set the radius of the environmental impact alerts to be triggered.
// 14. So Geo location will be used for allow radius with a figure touch of the map of there current aread for interactivity.



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

  const renderSettingsContent = () => (
    <>
      <List subheader={<ListSubheader>Notifications</ListSubheader>}>
        <ListItem>
          <ListItemIcon><Notifications /></ListItemIcon>
          <ListItemText primary="Enable Notifications" />
          <Switch
            edge="end"
            checked={settings?.notificationsEnabled ?? false}
            onChange={() => handleToggle('notificationsEnabled')}
          />
        </ListItem>
        {(settings?.notificationsEnabled ?? true) && (
          <>
            <ListItem>
              <ListItemText primary="Daily Reminder" secondary="Receive daily reminders to log your health data" />
              <Switch
                edge="end"
                checked={settings?.dailyReminder ?? false}
                onChange={() => handleToggle('dailyReminder')}
              />
            </ListItem>
            <ListItem>
              <ListItemText primary="Weekly Summary" secondary="Receive weekly health summaries" />
              <Switch
                edge="end"
                checked={settings?.weeklySummary ?? false}
                onChange={() => handleToggle('weeklySummary')}
              />
            </ListItem>
            <ListSubheader>Notification Preferences</ListSubheader>
            <ListItem>
              <ListItemIcon><Favorite /></ListItemIcon>
              <ListItemText primary="Heart Rate Alerts" />
              <Switch
                edge="end"
                checked={settings?.notificationPreferences?.heartRate ?? false}
                onChange={() => handleNotificationPreferenceToggle('heartRate')}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><DirectionsRun /></ListItemIcon>
              <ListItemText primary="Step Goal Notifications" />
              <Switch
                edge="end"
                checked={settings?.notificationPreferences?.stepGoal ?? false}
                onChange={() => handleNotificationPreferenceToggle('stepGoal')}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Nature /></ListItemIcon>
              <ListItemText primary="Environmental Impact Alerts" />
              <Switch
                edge="end"
                checked={settings?.notificationPreferences?.environmentalImpact ?? false}
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
            checked={settings?.shareData ?? false}
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
    </>
  );

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Paper elevation={3} sx={{ bgcolor: 'background.paper' }}>
        {user ? (
          renderSettingsContent()
        ) : (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Welcome to Settings</Typography>
            <Typography variant="body1">
              Once you're logged in, you'll be able to customize your notification preferences,
              privacy settings, and manage your account from here. Start tracking your health
              data to unlock all features!
            </Typography>
          </Box>
        )}
      </Paper>
      <Box sx={{ mt: 3 }}>
        <CustomButton
          title={user ? "Logout" : "Login"}
          onClick={user ? handleLogout : () => router.push('/login')}
          startIcon={<ExitToApp />}
          fullWidth
        />
      </Box>
    </Box>
  );
};

export default SettingsPage;