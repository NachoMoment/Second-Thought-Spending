import { securePreferences } from './securePreferences';

const ONBOARDING_KEY = 'second-thought-onboarding-v1';

export async function loadOnboardingStatus() {
  const { value } = await securePreferences.get({ key: ONBOARDING_KEY });
  if (!value) return null;
  const stored = JSON.parse(value);
  return stored?.completed === true;
}

export async function completeOnboarding() {
  await securePreferences.set({
    key: ONBOARDING_KEY,
    value: JSON.stringify({ completed: true, completedAt: new Date().toISOString() }),
  });
}

export async function resetOnboarding() {
  await securePreferences.remove({ key: ONBOARDING_KEY });
}
