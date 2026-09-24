import { securePreferences } from './securePreferences';

const SAFE_CONTACTS_KEY = 'second-thought-safe-contacts';

function normalizeContact(contact) {
  if (
    !contact ||
    typeof contact.id !== 'string' ||
    typeof contact.name !== 'string' ||
    typeof contact.phone !== 'string'
  ) {
    return null;
  }

  const name = contact.name.trim();
  const phone = contact.phone.trim();

  if (!name || !phone) {
    return null;
  }

  const createdAt =
    typeof contact.createdAt === 'string'
      ? contact.createdAt
      : new Date().toISOString();

  return {
    id: contact.id,
    name,
    phone,
    relationship:
      typeof contact.relationship === 'string'
        ? contact.relationship.trim()
        : '',
    createdAt,
    updatedAt:
      typeof contact.updatedAt === 'string' ? contact.updatedAt : createdAt,
  };
}

export async function loadSafeContacts() {
  const { value } = await securePreferences.get({ key: SAFE_CONTACTS_KEY });

  if (!value) {
    return [];
  }

  const storedContacts = JSON.parse(value);
  if (!Array.isArray(storedContacts)) {
    throw new Error('Stored safe contacts are not in the expected format.');
  }

  return storedContacts.map(normalizeContact).filter(Boolean);
}

export async function saveSafeContacts(contacts) {
  await securePreferences.set({
    key: SAFE_CONTACTS_KEY,
    value: JSON.stringify(contacts),
  });
}
