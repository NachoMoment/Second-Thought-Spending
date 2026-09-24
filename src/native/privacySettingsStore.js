import { Capacitor } from '@capacitor/core';
import { PrivacyScreen } from '@capacitor/privacy-screen';
import { securePreferences } from './securePreferences';

const PRIVACY_SETTINGS_KEY = 'second-thought-privacy-settings';

export const DEFAULT_PRIVACY_SETTINGS = {
  showHomeReminder: true,
  discreetNotifications: true,
  screenProtection: false,
  updatedAt: null,
};

export async function loadPrivacySettings() {
  const { value } = await securePreferences.get({ key: PRIVACY_SETTINGS_KEY });

  if (!value) {
    return { ...DEFAULT_PRIVACY_SETTINGS };
  }

  const settings = JSON.parse(value);
  if (!settings || typeof settings !== 'object') {
    throw new Error('Stored privacy settings are not in the expected format.');
  }

  return {
    showHomeReminder: settings.showHomeReminder !== false,
    discreetNotifications: settings.discreetNotifications !== false,
    screenProtection: settings.screenProtection === true,
    updatedAt: typeof settings.updatedAt === 'string' ? settings.updatedAt : null,
  };
}

export async function savePrivacySettings(settings) {
  await securePreferences.set({
    key: PRIVACY_SETTINGS_KEY,
    value: JSON.stringify(settings),
  });
}

export async function applyScreenProtection(enabled) {
  if (!Capacitor.isNativePlatform()) {
    return { supported: false };
  }

  if (enabled) {
    await PrivacyScreen.enable({
      android: {
        dimBackground: true,
        privacyModeOnActivityHidden: 'dim',
      },
      ios: {
        blurEffect: 'light',
      },
    });
  } else {
    await PrivacyScreen.disable();
  }

  return { supported: true };
}
