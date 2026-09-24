import React, { useEffect, useState } from 'react';
import { AlertCircle, Bell, BellRing, CheckCircle2, Clock3, Send, Settings } from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  loadNotificationSettings,
  saveNotificationSettings,
} from '../native/notificationSettingsStore';
import { localReminders } from '../native/localReminders';
import { callGuard } from '../native/callGuard';

function formatTime(value) {
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function NotificationSettingsFeature({ privacySettings }) {
  const [settings, setSettings] = useState(DEFAULT_NOTIFICATION_SETTINGS);
  const [permission, setPermission] = useState('prompt');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');

  useEffect(() => {
    let active = true;
    let appStateListener;

    Promise.all([
      loadNotificationSettings(),
      localReminders.getPermissionState(),
    ])
      .then(([storedSettings, permissionState]) => {
        if (!active) return;
        setSettings(storedSettings);
        setPermission(permissionState);
      })
      .catch(() => {
        if (active) {
          setMessage('Your notification settings could not be loaded.');
          setMessageType('error');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        localReminders.getPermissionState().then(setPermission).catch(() => {});
      }
    }).then((listener) => {
      appStateListener = listener;
    });

    return () => {
      active = false;
      appStateListener?.remove();
    };
  }, []);

  const updateSetting = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setMessage('');
  };

  const ensurePermission = async () => {
    if (!localReminders.isNative) {
      return 'unavailable';
    }

    if (permission === 'granted') {
      return permission;
    }

    const nextPermission = await localReminders.requestPermission();
    setPermission(nextPermission);
    return nextPermission;
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      let nextSettings = {
        ...settings,
        updatedAt: new Date().toISOString(),
      };

      if (nextSettings.dailyEnabled) {
        const nextPermission = await ensurePermission();
        if (nextPermission !== 'granted' && nextPermission !== 'unavailable') {
          nextSettings = { ...nextSettings, dailyEnabled: false };
          setSettings(nextSettings);
          setPermission(nextPermission);
          await saveNotificationSettings(nextSettings);
          await localReminders.applyDailyReminder(nextSettings, privacySettings);
          setMessage('Notifications are not allowed. The daily reminder was left off.');
          setMessageType('error');
          return;
        }
      }

      await saveNotificationSettings(nextSettings);
      const result = await localReminders.applyDailyReminder(
        nextSettings,
        privacySettings,
      );
      setSettings(nextSettings);
      setMessage(
        result.webPreview
          ? 'Saved for this preview. Install the Android build to receive reminders.'
          : nextSettings.dailyEnabled
            ? `Daily reminder set for ${formatTime(nextSettings.dailyTime)}.`
            : 'Daily reminders are off.',
      );
      setMessageType('success');
    } catch {
      setMessage('Your reminder could not be saved. Please try again.');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setSaving(true);
    setMessage('');
    try {
      const nextPermission = await ensurePermission();
      if (nextPermission !== 'granted') {
        setMessage(
          nextPermission === 'unavailable'
            ? 'Test notifications are available in the installed Android app.'
            : 'Allow notifications in Android settings before sending a test.',
        );
        setMessageType(nextPermission === 'unavailable' ? 'info' : 'error');
        return;
      }

      await localReminders.sendTest(privacySettings.discreetNotifications);
      setMessage('Test notification sent.');
      setMessageType('success');
    } catch {
      setMessage('The test notification could not be sent.');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="feature-loading" role="status">
        <Bell size={25} />
        <span>Loading notification settings…</span>
      </div>
    );
  }

  return (
    <form className="settings-panel" onSubmit={saveSettings}>
      <div className="settings-intro-card">
        <BellRing size={25} />
        <div>
          <strong>Gentle, optional reminders</strong>
          <span>Second Thought will only notify you when you choose.</span>
        </div>
      </div>

      <section className="settings-card">
        <div className="setting-row">
          <div>
            <strong>Daily check-in</strong>
            <span>A quiet nudge to pause and notice what you need.</span>
          </div>
          <button
            className={`switch-control ${settings.dailyEnabled ? 'on' : ''}`}
            type="button"
            role="switch"
            aria-checked={settings.dailyEnabled}
            aria-label="Daily check-in reminder"
            onClick={() => updateSetting('dailyEnabled', !settings.dailyEnabled)}
          >
            <span />
          </button>
        </div>

        {settings.dailyEnabled && (
          <label className="time-setting" htmlFor="daily-reminder-time">
            <span>
              <Clock3 size={17} />
              Reminder time
            </span>
            <input
              id="daily-reminder-time"
              type="time"
              value={settings.dailyTime}
              onChange={(event) => updateSetting('dailyTime', event.target.value)}
            />
          </label>
        )}
      </section>

      <div className="notification-preview">
        <Bell size={18} />
        <div>
          <small>Notification preview</small>
          <strong>
            {privacySettings.discreetNotifications
              ? 'A quiet reminder'
              : 'Time for a Second Thought check-in'}
          </strong>
          <span>
            {privacySettings.discreetNotifications
              ? 'Take a moment for yourself.'
              : 'Pause, notice what you need, and check in with yourself.'}
          </span>
        </div>
      </div>

      {message && (
        <div className={`settings-message ${messageType}`} role="status">
          {messageType === 'success' ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{message}</span>
        </div>
      )}

      <button className="primary-button settings-save-button" type="submit" disabled={saving}>
        <Bell size={18} />
        <span>{saving ? 'Saving…' : 'Save reminder'}</span>
      </button>
      <button className="secondary-button settings-save-button" type="button" disabled={saving} onClick={sendTest}>
        <Send size={18} />
        <span>Send a test notification</span>
      </button>

      {localReminders.isNative && permission !== 'granted' && (
        <button className="secondary-button settings-save-button" type="button" onClick={() => callGuard.openAppSettings()}>
          <Settings size={18} />
          <span>Open Android notification settings</span>
        </button>
      )}

      <p className="settings-footnote">
        Reminders are supportive prompts, not emergency alerts. Delivery time can vary slightly with Android battery settings.
      </p>
    </form>
  );
}
