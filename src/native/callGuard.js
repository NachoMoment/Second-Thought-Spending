import { Capacitor, registerPlugin } from '@capacitor/core';

const NativeCallGuard = registerPlugin('CallGuard');
const WEB_STORAGE_KEY = 'second-thought-risky-contacts';
const LEGACY_WEB_STORAGE_KEY = 'second-thought-test-risky-number';

function createContact(number, name = 'Risky contact') {
  return {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `risky-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    number,
    enabled: true,
  };
}

function loadWebContacts() {
  const stored = window.localStorage.getItem(WEB_STORAGE_KEY);
  if (stored) {
    try {
      const contacts = JSON.parse(stored);
      if (Array.isArray(contacts)) return contacts;
    } catch {
      // Recover from malformed preview data below.
    }
  }

  const legacyNumber = window.localStorage.getItem(LEGACY_WEB_STORAGE_KEY);
  if (!legacyNumber) return [];
  const contacts = [createContact(legacyNumber)];
  window.localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(contacts));
  window.localStorage.removeItem(LEGACY_WEB_STORAGE_KEY);
  return contacts;
}

export const callGuard = {
  isNativeAndroid:
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android',

  async getStatus() {
    if (this.isNativeAndroid) {
      return NativeCallGuard.getStatus();
    }

    const riskyContacts = loadWebContacts();
    return {
      supported: false,
      roleHeld: false,
      notificationsGranted: false,
      riskyContacts,
      riskyNumber: riskyContacts[0]?.number ?? '',
    };
  },

  async saveRiskyContacts(contacts) {
    if (this.isNativeAndroid) {
      return NativeCallGuard.saveRiskyContacts({ contacts });
    }

    window.localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(contacts));
    return { riskyContacts: contacts, supported: false, roleHeld: false };
  },

  async saveRiskyNumber(number) {
    const status = await this.getStatus();
    const nextContacts = [...(status.riskyContacts ?? []), createContact(number)];
    const result = await this.saveRiskyContacts(nextContacts);
    return { ...result, riskyNumber: number };
  },

  async clearRiskyContacts() {
    if (this.isNativeAndroid) {
      return NativeCallGuard.clearRiskyContacts();
    }

    window.localStorage.removeItem(WEB_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_WEB_STORAGE_KEY);
    return { cleared: true };
  },

  async clearRiskyNumber() {
    return this.clearRiskyContacts();
  },

  async prepareNotifications() {
    if (!this.isNativeAndroid) return { granted: false };
    return NativeCallGuard.prepareNotifications();
  },

  async requestRole() {
    if (!this.isNativeAndroid) return { roleHeld: false };
    return NativeCallGuard.requestRole();
  },

  async openAppSettings() {
    if (!this.isNativeAndroid) return { opened: false };
    return NativeCallGuard.openAppSettings();
  },

  async continueCall(number) {
    if (this.isNativeAndroid) {
      return NativeCallGuard.continueCall({ number });
    }

    window.location.href = `tel:${number}`;
    return { opened: true };
  },
};
