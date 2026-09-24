import { securePreferences } from './securePreferences';

const CHECK_INS_KEY = 'second-thought-check-ins';
const MAX_STORED_CHECK_INS = 30;

function normalizeCheckIn(checkIn) {
  if (
    !checkIn ||
    typeof checkIn.id !== 'string' ||
    !Array.isArray(checkIn.feelings) ||
    typeof checkIn.intensity !== 'number' ||
    typeof checkIn.createdAt !== 'string'
  ) {
    return null;
  }

  return {
    id: checkIn.id,
    feelings: checkIn.feelings.filter((feeling) => typeof feeling === 'string'),
    intensity: Math.min(10, Math.max(1, Math.round(checkIn.intensity))),
    note: typeof checkIn.note === 'string' ? checkIn.note.trim() : '',
    createdAt: checkIn.createdAt,
  };
}

export async function loadCheckIns() {
  const { value } = await securePreferences.get({ key: CHECK_INS_KEY });

  if (!value) {
    return [];
  }

  const storedCheckIns = JSON.parse(value);
  if (!Array.isArray(storedCheckIns)) {
    throw new Error('Stored check-ins are not in the expected format.');
  }

  return storedCheckIns.map(normalizeCheckIn).filter(Boolean);
}

export async function saveCheckIns(checkIns) {
  await securePreferences.set({
    key: CHECK_INS_KEY,
    value: JSON.stringify(checkIns.slice(0, MAX_STORED_CHECK_INS)),
  });
}

export async function clearCheckIns() {
  await securePreferences.remove({ key: CHECK_INS_KEY });
}
