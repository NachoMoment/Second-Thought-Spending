import { securePreferences } from './securePreferences';

const REASONS_KEY = 'second-thought-my-reasons';

function normalizeReason(reason) {
  if (
    !reason ||
    typeof reason.id !== 'string' ||
    typeof reason.text !== 'string'
  ) {
    return null;
  }

  const text = reason.text.trim();
  if (!text) {
    return null;
  }

  const createdAt =
    typeof reason.createdAt === 'string'
      ? reason.createdAt
      : new Date().toISOString();

  return {
    id: reason.id,
    text,
    createdAt,
    updatedAt:
      typeof reason.updatedAt === 'string'
        ? reason.updatedAt
        : createdAt,
  };
}

export async function loadReasons() {
  const { value } = await securePreferences.get({ key: REASONS_KEY });

  if (!value) {
    return [];
  }

  const storedReasons = JSON.parse(value);
  if (!Array.isArray(storedReasons)) {
    throw new Error('Stored reasons are not in the expected format.');
  }

  return storedReasons.map(normalizeReason).filter(Boolean);
}

export async function saveReasons(reasons) {
  await securePreferences.set({
    key: REASONS_KEY,
    value: JSON.stringify(reasons),
  });
}
