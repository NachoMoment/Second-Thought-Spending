import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const DAILY_REMINDER_ID = 21001;
const TEST_REMINDER_ID = 21002;
const REMINDER_CHANNEL_ID = 'second-thought-daily';

const isNative = Capacitor.isNativePlatform();

function getContent(discreet) {
  if (discreet) {
    return {
      title: 'A quiet reminder',
      body: 'Take a moment for yourself.',
    };
  }

  return {
    title: 'Time for a Second Thought check-in',
    body: 'Pause, notice what you need, and check in with yourself.',
  };
}

async function ensureChannel() {
  if (Capacitor.getPlatform() !== 'android') {
    return;
  }

  await LocalNotifications.createChannel({
    id: REMINDER_CHANNEL_ID,
    name: 'Daily reminders',
    description: 'Gentle reminders you schedule in Second Thought.',
    importance: 3,
    visibility: 0,
    vibration: true,
  });
}

async function cancelByIds(ids) {
  if (!isNative) {
    return;
  }

  await LocalNotifications.cancel({
    notifications: ids.map((id) => ({ id })),
  });
}

export const localReminders = {
  isNative,

  async getPermissionState() {
    if (!isNative) {
      return 'unavailable';
    }

    const permission = await LocalNotifications.checkPermissions();
    return permission.display;
  },

  async requestPermission() {
    if (!isNative) {
      return 'unavailable';
    }

    const permission = await LocalNotifications.requestPermissions();
    return permission.display;
  },

  async applyDailyReminder(settings, privacySettings) {
    if (!isNative) {
      return { scheduled: false, webPreview: true };
    }

    await cancelByIds([DAILY_REMINDER_ID]);

    if (!settings.dailyEnabled) {
      return { scheduled: false };
    }

    await ensureChannel();
    const [hour, minute] = settings.dailyTime.split(':').map(Number);
    const content = getContent(privacySettings.discreetNotifications);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: DAILY_REMINDER_ID,
          ...content,
          channelId: REMINDER_CHANNEL_ID,
          autoCancel: true,
          schedule: {
            on: { hour, minute },
            allowWhileIdle: false,
          },
          extra: { route: 'check-in' },
        },
      ],
    });

    return { scheduled: true };
  },

  async sendTest(discreetNotifications) {
    if (!isNative) {
      return { sent: false, webPreview: true };
    }

    await ensureChannel();
    const content = getContent(discreetNotifications);
    await LocalNotifications.schedule({
      notifications: [
        {
          id: TEST_REMINDER_ID,
          ...content,
          channelId: REMINDER_CHANNEL_ID,
          autoCancel: true,
          extra: { route: 'check-in', test: true },
        },
      ],
    });

    return { sent: true };
  },

  async cancelAll() {
    await cancelByIds([DAILY_REMINDER_ID, TEST_REMINDER_ID]);
  },

  async addActionListener(listener) {
    if (!isNative) {
      return null;
    }

    return LocalNotifications.addListener(
      'localNotificationActionPerformed',
      listener,
    );
  },
};
