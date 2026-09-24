import { callGuard } from './callGuard';
import { localReminders } from './localReminders';
import { applyScreenProtection } from './privacySettingsStore';
import { securePreferences } from './securePreferences';

export async function clearAllAppData() {
  const results = await Promise.allSettled([
    localReminders.cancelAll(),
    applyScreenProtection(false),
    callGuard.clearRiskyContacts(),
    securePreferences.clear(),
  ]);

  if (results.some((result) => result.status === 'rejected')) {
    throw new Error('Some local app data could not be cleared.');
  }
}
