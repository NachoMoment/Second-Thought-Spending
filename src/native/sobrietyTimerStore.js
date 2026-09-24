import { securePreferences } from './securePreferences';

const SOBRIETY_TIMER_KEY = 'second-thought-sobriety-timer';

export async function loadSobrietyTimer() {
  const { value } = await securePreferences.get({ key: SOBRIETY_TIMER_KEY });

  if (!value) {
    return null;
  }

  const timer = JSON.parse(value);
  if (
    !timer ||
    typeof timer.label !== 'string' ||
    typeof timer.startAt !== 'string' ||
    Number.isNaN(Date.parse(timer.startAt))
  ) {
    throw new Error('Stored sobriety timer is not in the expected format.');
  }

  return {
    label: timer.label.trim() || 'My recovery',
    startAt: timer.startAt,
    updatedAt:
      typeof timer.updatedAt === 'string'
        ? timer.updatedAt
        : new Date().toISOString(),
  };
}

export async function saveSobrietyTimer(timer) {
  await securePreferences.set({
    key: SOBRIETY_TIMER_KEY,
    value: JSON.stringify(timer),
  });
}

export async function clearSobrietyTimer() {
  await securePreferences.remove({ key: SOBRIETY_TIMER_KEY });
}
