import { 
  Notifications, Lock, ExitToApp, VpnKey, DeleteForever, Favorite, DirectionsRun, Nature 
} from '@mui/icons-material';
import { 
  List, ListSubheader, ListItem, ListItemIcon, ListItemText, Switch, Divider, 
  Paper, Typography, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  CircularProgress, Snackbar
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useState, useCallback, useEffect } from 'react';

import CustomButton from '@/components/CustomButton';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationContext } from '@/contexts/NotificationContext';
import withAuth from '@/components/withAuth';
import { useAppSelector } from '@/store';
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout';
import { LoadingTimeoutError } from '@/components/LoadingTimeoutError';

import type { UserSettings, UserState } from '@/types';

type NotificationPreferenceKey = keyof UserSettings['notificationPreferences'];
type ToggleableSettings = Omit<UserSettings, '_id' | 'userId' | 'dataRetentionPeriod'>;

const SettingsPage: React.FC = () => {
  const router = useRouter();
  const { user, signOut, updateUserSettings } = useAuth();
  const { showNotification } = useNotificationContext();
  const settings = useAppSelector((state: { user: UserState }) => state.user.settings);
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const hasTimedOut = useLoadingTimeout({ 
    isLoading: isUpdating,
    timeoutMs: 8000 // 8 seconds for settings updates
  });

  const handleToggle = useCallback(async (key: keyof ToggleableSettings): Promise<void> => {
    if (!user || !settings || isUpdating) return;

    setIsUpdating(true);
    try {
      const updatedSettings: Partial<UserSettings> = {
        [key]: !settings[key]
      };
      await updateUserSettings(updatedSettings);
      showNotification({
        message: 'Settings updated successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Update settings error:', error);
      showNotification({
        message: 'Failed to update settings',
        type: 'error'
      });
    } finally {
      setIsUpdating(false);
    }
  }, [user, settings, isUpdating, updateUserSettings, showNotification]);

  const handleNotificationPreferenceToggle = useCallback(async (preference: NotificationPreferenceKey): Promise<void> => {
    if (!user || !settings?.notificationPreferences || isUpdating) return;

    setIsUpdating(true);
    try {
      const updatedPreferences: UserSettings['notificationPreferences'] = {
        ...settings.notificationPreferences,
        [preference]: !settings.notificationPreferences[preference]
      };
      await updateUserSettings({ notificationPreferences: updatedPreferences });
      showNotification({
        message: 'Notification preferences updated successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Update notification preference error:', error);
      showNotification({
        message: 'Failed to update notification preferences',
        type: 'error'
      });
    } finally {
      setIsUpdating(false);
    }
  }, [user, settings, isUpdating, updateUserSettings, showNotification]);

  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      await signOut();
      showNotification({
        message: 'Logged out successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Logout error:', error);
      showNotification({
        message: 'Failed to logout',
        type: 'error'
      });
    }
  }, [signOut, showNotification]);

  const handleLogoutClick = (): void => {
    setOpenLogoutDialog(true);
  };

  const handleLogoutConfirm = (): void => {
    setOpenLogoutDialog(false);
    handleLogout();
  };

  const handleLogoutCancel = (): void => {
    setOpenLogoutDialog(false);
  };

  const renderSettingsContent = (): JSX.Element => (
    <div className="settings-container">
      {isUpdating && (
        <div className="settings-loading-overlay">
          <CircularProgress />
        </div>
      )}
      <List>
        <ListSubheader>Notifications</ListSubheader>
        {(settings?.notificationsEnabled ?? true) && (
          <>
            <ListItem className="settings-form-field">
              <ListItemIcon><Notifications /></ListItemIcon>
              <ListItemText primary="Daily Reminder" />
              <Switch
                edge="end"
                disabled={isUpdating}
                checked={settings?.dailyReminder ?? false}
                onChange={() => handleToggle('dailyReminder')}
              />
            </ListItem>
            <ListItem className="settings-form-field">
              <ListItemText primary="Weekly Summary" secondary="Receive weekly health summaries" />
              <Switch
                edge="end"
                disabled={isUpdating}
                checked={settings?.weeklySummary ?? false}
                onChange={() => handleToggle('weeklySummary')}
              />
            </ListItem>
            <ListSubheader>Notification Preferences</ListSubheader>
            <ListItem className="settings-form-field">
              <ListItemIcon><Favorite /></ListItemIcon>
              <ListItemText primary="Heart Rate Alerts" />
              <Switch
                edge="end"
                disabled={isUpdating}
                checked={settings?.notificationPreferences?.heartRate ?? false}
                onChange={() => handleNotificationPreferenceToggle('heartRate')}
              />
            </ListItem>
            <ListItem className="settings-form-field">
              <ListItemIcon><DirectionsRun /></ListItemIcon>
              <ListItemText primary="Step Goal Notifications" />
              <Switch
                edge="end"
                disabled={isUpdating}
                checked={settings?.notificationPreferences?.stepGoal ?? false}
                onChange={() => handleNotificationPreferenceToggle('stepGoal')}
              />
            </ListItem>
            <ListItem className="settings-form-field">
              <ListItemIcon><Nature /></ListItemIcon>
              <ListItemText primary="Environmental Impact Alerts" />
              <Switch
                edge="end"
                disabled={isUpdating}
                checked={settings?.notificationPreferences?.environmentalImpact ?? false}
                onChange={() => handleNotificationPreferenceToggle('environmentalImpact')}
              />
            </ListItem>
          </>
        )}
      </List>
      <Divider className="settings-section" />
      <List subheader={<ListSubheader>Privacy</ListSubheader>}>
        <ListItem className="settings-form-field">
          <ListItemIcon><Lock /></ListItemIcon>
          <ListItemText primary="Share Data with Friends" secondary="Allow friends to see your health stats" />
          <Switch
            edge="end"
            disabled={isUpdating}
            checked={settings?.shareData ?? false}
            onChange={() => handleToggle('shareData')}
          />
        </ListItem>
      </List>
      <Divider className="settings-section" />
      <List subheader={<ListSubheader>Account</ListSubheader>}>
        <ListItem button onClick={() => router.push('/change-password')} className="settings-form-field">
          <ListItemIcon><VpnKey /></ListItemIcon>
          <ListItemText primary="Change Password" />
        </ListItem>
        <ListItem button onClick={() => router.push('/delete-account')} className="settings-form-field">
          <ListItemIcon><DeleteForever /></ListItemIcon>
          <ListItemText primary="Delete Account" />
        </ListItem>
      </List>
    </div>
  );

  if (hasTimedOut) {
    return <LoadingTimeoutError 
      message="Settings update is taking longer than expected." 
      onRetry={() => setIsUpdating(false)}
    />;
  }

  return (
    <div className="settings-container">
      {isUpdating && (
        <div className="settings-loading-overlay">
          <CircularProgress />
        </div>
      )}
      <Paper elevation={3} className="settings-paper">
        {user ? (
          renderSettingsContent()
        ) : (
          <div className="settings-welcome">
            <Typography variant="h6" gutterBottom>Welcome to Settings</Typography>
            <Typography variant="body1">
              Once you&apos;re logged in, you&apos;ll be able to customize your notification preferences,
              privacy settings, and manage your account from here. Start tracking your health
              data to unlock all features!
            </Typography>
          </div>
        )}
      </Paper>
      <div className="settings-actions">
        <CustomButton
          title={user ? "Logout" : "Login"}
          onClick={user ? handleLogoutClick : () => router.push('/login')}
          icon={<ExitToApp />}
          fullWidth
        />
      </div>

      <Dialog
        open={openLogoutDialog}
        onClose={handleLogoutCancel}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
      >
        <DialogTitle id="logout-dialog-title">Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText id="logout-dialog-description">
            Are you sure you want to logout? You will need to login again to access your account.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLogoutConfirm} color="primary" autoFocus>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default withAuth(SettingsPage);
