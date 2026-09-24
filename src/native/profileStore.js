import { securePreferences } from './securePreferences';

const PROFILE_KEY = 'second-thought-profile';

export async function loadProfile() {
  const { value } = await securePreferences.get({ key: PROFILE_KEY });

  if (!value) {
    return null;
  }

  const profile = JSON.parse(value);
  if (!profile || typeof profile !== 'object') {
    throw new Error('Stored profile is not in the expected format.');
  }

  return {
    nickname: typeof profile.nickname === 'string' ? profile.nickname.trim() : '',
    recoveryFocus:
      typeof profile.recoveryFocus === 'string'
        ? profile.recoveryFocus.trim()
        : '',
    intention:
      typeof profile.intention === 'string' ? profile.intention.trim() : '',
    updatedAt:
      typeof profile.updatedAt === 'string'
        ? profile.updatedAt
        : new Date().toISOString(),
  };
}

export async function saveProfile(profile) {
  await securePreferences.set({
    key: PROFILE_KEY,
    value: JSON.stringify(profile),
  });
}
