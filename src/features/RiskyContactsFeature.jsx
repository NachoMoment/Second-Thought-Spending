import React, { useCallback, useEffect, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  Pencil,
  PhoneCall,
  Plus,
  Settings,
  ShieldCheck,
  Smartphone,
  Trash2,
  X,
} from 'lucide-react';
import { callGuard } from '../native/callGuard';

const EMPTY_STATUS = {
  supported: callGuard.isNativeAndroid,
  roleHeld: false,
  notificationsGranted: false,
  riskyContacts: [],
};

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `risky-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function numberIsValid(number) {
  return number.replace(/\D/g, '').length >= 7;
}

export function RiskyContactsFeature({ interceptedNumber, onDone }) {
  const [status, setStatus] = useState(EMPTY_STATUS);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [draft, setDraft] = useState({ name: '', number: '' });
  const [message, setMessage] = useState('');

  const refreshStatus = useCallback(async () => {
    const nextStatus = await callGuard.getStatus();
    setStatus({ ...EMPTY_STATUS, ...nextStatus, riskyContacts: nextStatus.riskyContacts ?? [] });
    return nextStatus;
  }, []);

  useEffect(() => {
    let active = true;
    let appStateListener;

    refreshStatus()
      .catch(() => {
        if (active) setMessage('Your risky contacts could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) refreshStatus().catch(() => {});
    }).then((listener) => {
      appStateListener = listener;
    });

    return () => {
      active = false;
      appStateListener?.remove();
    };
  }, [refreshStatus]);

  const saveContacts = async (contacts, successMessage) => {
    setBusy(true);
    setMessage('');
    try {
      const result = await callGuard.saveRiskyContacts(contacts);
      setStatus((current) => ({
        ...current,
        ...result,
        riskyContacts: result.riskyContacts ?? contacts,
      }));
      setMessage(successMessage);
      return true;
    } catch {
      setMessage('That change could not be saved. Please try again.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const beginAdd = () => {
    setEditingId('new');
    setPendingDeleteId(null);
    setDraft({ name: '', number: '' });
    setMessage('');
  };

  const beginEdit = (contact) => {
    setEditingId(contact.id);
    setPendingDeleteId(null);
    setDraft({ name: contact.name, number: contact.number });
    setMessage('');
  };

  const submitContact = async (event) => {
    event.preventDefault();
    const name = draft.name.trim();
    const number = draft.number.trim();
    if (!name) {
      setMessage('Add a name or label for this contact.');
      return;
    }
    if (!numberIsValid(number)) {
      setMessage('Enter a complete phone number.');
      return;
    }

    const contacts =
      editingId === 'new'
        ? [...status.riskyContacts, { id: newId(), name, number, enabled: true }]
        : status.riskyContacts.map((contact) =>
            contact.id === editingId ? { ...contact, name, number } : contact,
          );

    if (await saveContacts(contacts, `${name} is now in your protected list.`)) {
      setEditingId(null);
      setDraft({ name: '', number: '' });
    }
  };

  const toggleContact = (contact) => {
    const contacts = status.riskyContacts.map((item) =>
      item.id === contact.id ? { ...item, enabled: !item.enabled } : item,
    );
    saveContacts(
      contacts,
      `${contact.name} protection is ${contact.enabled ? 'paused' : 'on'}.`,
    );
  };

  const removeContact = async (contact) => {
    const contacts = status.riskyContacts.filter((item) => item.id !== contact.id);
    if (await saveContacts(contacts, `${contact.name} was removed.`)) {
      setPendingDeleteId(null);
    }
  };

  const enableProtection = async () => {
    if (status.riskyContacts.length === 0) {
      setMessage('Add at least one risky contact before enabling protection.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await callGuard.prepareNotifications();
      await callGuard.requestRole();
      const nextStatus = await refreshStatus();
      setMessage(
        nextStatus.roleHeld
          ? 'Android call protection is on.'
          : 'Call protection was not enabled. You can try again or open Android settings.',
      );
    } catch {
      setMessage('Android could not enable call protection. Open settings and try again.');
    } finally {
      setBusy(false);
    }
  };

  const continueCall = async () => {
    setBusy(true);
    try {
      await callGuard.continueCall(interceptedNumber);
    } finally {
      setBusy(false);
    }
  };

  if (interceptedNumber) {
    return (
      <div className="intervention-panel">
        <p>You asked Second Thought to interrupt calls to this contact.</p>
        <div className="intercepted-number">
          <PhoneCall size={20} />
          <span>{interceptedNumber}</span>
        </div>
        <div className="pause-box">
          <strong>Take one pause</strong>
          <p>Put both feet on the floor and take three slow breaths before you decide what happens next.</p>
        </div>
        <button className="primary-button" type="button" onClick={onDone}>
          I’m choosing not to call
        </button>
        <button className="secondary-button" type="button" disabled={busy} onClick={continueCall}>
          Continue to the dialer
        </button>
        <p className="technical-note">Continuing creates a one-time 60-second bypass for this number.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="feature-loading">Loading protected contacts…</div>;
  }

  return (
    <div className="call-guard-panel risky-contacts-panel">
      <p className="feature-intro">
        Add the people you want a pause before calling. Each contact is encrypted on this Android device.
      </p>

      <div className={`native-status ${status.roleHeld ? 'ready' : ''}`}>
        {status.roleHeld ? <ShieldCheck size={21} /> : <Smartphone size={21} />}
        <div>
          <strong>{status.roleHeld ? 'Android call protection on' : 'Android call protection off'}</strong>
          <span>
            {!callGuard.isNativeAndroid
              ? 'Install the Android build to intercept outgoing calls.'
              : !status.supported
                ? 'Call interception requires Android 10 or newer.'
                : status.notificationsGranted
                  ? 'Call role and notification fallback are ready.'
                  : 'Call role status shown here; notification fallback is off.'}
          </span>
        </div>
      </div>

      {message && (
        <div className="setup-message" role="status">
          <AlertCircle size={17} />
          <span>{message}</span>
        </div>
      )}

      {editingId ? (
        <form className="contact-form" onSubmit={submitContact}>
          <div className="contact-form-heading">
            <Lock size={20} />
            <strong>{editingId === 'new' ? 'Add risky contact' : 'Edit risky contact'}</strong>
          </div>
          <label className="field-label" htmlFor="risky-contact-name">Name or label</label>
          <input
            id="risky-contact-name"
            className="text-input"
            value={draft.name}
            maxLength={60}
            autoComplete="off"
            placeholder="Example: Alex"
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          />
          <label className="field-label" htmlFor="risky-contact-number">Phone number</label>
          <input
            id="risky-contact-number"
            className="phone-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(555) 555-0123"
            value={draft.number}
            onChange={(event) => setDraft((current) => ({ ...current, number: event.target.value }))}
          />
          <div className="contact-form-actions">
            <button className="secondary-button" type="button" onClick={() => setEditingId(null)}>
              <X size={17} /> Cancel
            </button>
            <button className="primary-button" type="submit" disabled={busy}>Save contact</button>
          </div>
        </form>
      ) : (
        <button className="add-reason-button" type="button" onClick={beginAdd}>
          <Plus size={19} />
          <span>Add risky contact</span>
        </button>
      )}

      <div className="risky-contact-list">
        {status.riskyContacts.length === 0 ? (
          <div className="empty-reasons-card">
            <Lock size={25} />
            <strong>No risky contacts yet</strong>
            <p>Add as many as you need. Protection can be paused for each person without deleting them.</p>
          </div>
        ) : (
          status.riskyContacts.map((contact) => (
            <article className={`risky-contact-card ${contact.enabled ? '' : 'disabled'}`} key={contact.id}>
              <div className="risky-contact-copy">
                <strong>{contact.name}</strong>
                <span>{contact.number}</span>
              </div>
              <button
                className={`switch-control ${contact.enabled ? 'on' : ''}`}
                type="button"
                role="switch"
                aria-checked={contact.enabled}
                aria-label={`Protect calls to ${contact.name}`}
                disabled={busy}
                onClick={() => toggleContact(contact)}
              ><span /></button>
              <div className="risky-contact-actions">
                <button type="button" onClick={() => beginEdit(contact)} aria-label={`Edit ${contact.name}`}>
                  <Pencil size={17} /> Edit
                </button>
                <button type="button" onClick={() => setPendingDeleteId(contact.id)} aria-label={`Remove ${contact.name}`}>
                  <Trash2 size={17} /> Remove
                </button>
              </div>
              {pendingDeleteId === contact.id && (
                <div className="inline-delete-confirmation">
                  <span>Remove {contact.name} from this device?</span>
                  <div>
                    <button type="button" onClick={() => setPendingDeleteId(null)}>Keep</button>
                    <button type="button" disabled={busy} onClick={() => removeContact(contact)}>Remove</button>
                  </div>
                </div>
              )}
            </article>
          ))
        )}
      </div>

      {callGuard.isNativeAndroid && status.supported && !status.roleHeld && (
        <button className="primary-button" type="button" disabled={busy} onClick={enableProtection}>
          <ShieldCheck size={18} /> {busy ? 'Working…' : 'Enable call protection'}
        </button>
      )}
      {callGuard.isNativeAndroid && (!status.roleHeld || !status.notificationsGranted) && (
        <button className="secondary-button settings-save-button" type="button" onClick={() => callGuard.openAppSettings()}>
          <Settings size={18} /> Open Android settings
        </button>
      )}

      <p className="technical-note">
        Emergency calls are never handled by Android’s call-redirection service. Text messages are not intercepted.
      </p>
    </div>
  );
}
