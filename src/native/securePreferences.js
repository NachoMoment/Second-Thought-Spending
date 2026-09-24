import { Capacitor, registerPlugin } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const NativeSecureStorage = registerPlugin('SecureStorage');
const isNativeAndroid =
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

async function get({ key }) {
  if (!isNativeAndroid) {
    return Preferences.get({ key });
  }

  const secureResult = await NativeSecureStorage.get({ key });
  if (secureResult.value !== null && secureResult.value !== undefined) {
    return secureResult;
  }

  const legacyResult = await Preferences.get({ key });
  if (legacyResult.value !== null && legacyResult.value !== undefined) {
    await NativeSecureStorage.set({ key, value: legacyResult.value });
    await Preferences.remove({ key });
  }
  return legacyResult;
}

async function set({ key, value }) {
  if (!isNativeAndroid) {
    return Preferences.set({ key, value });
  }

  await NativeSecureStorage.set({ key, value });
  await Preferences.remove({ key });
}

async function remove({ key }) {
  if (!isNativeAndroid) {
    return Preferences.remove({ key });
  }

  await Promise.all([
    NativeSecureStorage.remove({ key }),
    Preferences.remove({ key }),
  ]);
}

async function clear() {
  if (!isNativeAndroid) {
    return Preferences.clear();
  }

  await Promise.all([NativeSecureStorage.clear(), Preferences.clear()]);
}

export const securePreferences = { get, set, remove, clear, isNativeAndroid };
