import { securePreferences } from './securePreferences';

const NOTIFICATION_SETTINGS_KEY = 'second-thought-notification-settings';

export const DEFAULT_NOTIFICATION_SETTINGS = {
  dailyEnabled: false,
  dailyTime: '19:00',
  updatedAt: null,
};

function isValidTime(value) {
  if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) {
    return false;
  }

  const [hours, minutes] = value.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export async function loadNotificationSettings() {
  const { value } = await securePreferences.get({ key: NOTIFICATION_SETTINGS_KEY });

  if (!value) {
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }

  const settings = JSON.parse(value);
  if (!settings || typeof settings !== 'object') {
    throw new Error('Stored notification settings are not in the expected format.');
  }

  return {
    dailyEnabled: settings.dailyEnabled === true,
    dailyTime: isValidTime(settings.dailyTime)
      ? settings.dailyTime
      : DEFAULT_NOTIFICATION_SETTINGS.dailyTime,
    updatedAt: typeof settings.updatedAt === 'string' ? settings.updatedAt : null,
  };
}

export async function saveNotificationSettings(settings) {
  await securePreferences.set({
    key: NOTIFICATION_SETTINGS_KEY,
    value: JSON.stringify(settings),
  });
}
