import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  EyeOff,
  Home,
  Lock,
  Save,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { clearAllAppData } from '../native/clearAppData';
import { localReminders } from '../native/localReminders';
import { loadNotificationSettings } from '../native/notificationSettingsStore';
import {
  applyScreenProtection,
  DEFAULT_PRIVACY_SETTINGS,
  savePrivacySettings,
} from '../native/privacySettingsStore';

function SettingToggle({ icon: Icon, title, description, checked, onChange }) {
  return (
    <div className="setting-row">
      <div className="setting-copy-with-icon">
        <Icon size={20} />
        <span>
          <strong>{title}</strong>
          <small>{description}</small>
        </span>
      </div>
      <button
        className={`switch-control ${checked ? 'on' : ''}`}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </div>
  );
}

export function PrivacySettingsFeature({ settings, onSaved }) {
  const [draft, setDraft] = useState(settings ?? DEFAULT_PRIVACY_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearChecked, setClearChecked] = useState(false);

  useEffect(() => {
    setDraft(settings ?? DEFAULT_PRIVACY_SETTINGS);
  }, [settings]);

  const updateDraft = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage('');
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    const nextSettings = {
      ...draft,
      updatedAt: new Date().toISOString(),
    };

    setSaving(true);
    setMessage('');
    try {
      await applyScreenProtection(nextSettings.screenProtection);
      await savePrivacySettings(nextSettings);
      setDraft(nextSettings);
      onSaved(nextSettings);
      loadNotificationSettings()
        .then((notificationSettings) =>
          localReminders.applyDailyReminder(notificationSettings, nextSettings),
        )
        .catch(() => {
          // The privacy choice is still saved if an existing reminder cannot be refreshed.
        });
      setMessage('Your privacy settings were saved.');
    } catch {
      setMessage('Your privacy settings could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const clearData = async () => {
    if (!clearChecked) return;

    setSaving(true);
    setMessage('');
    try {
      await clearAllAppData();
      window.location.reload();
    } catch {
      setMessage('Some app data could not be cleared. Please try again.');
      setSaving(false);
    }
  };

  return (
    <form className="settings-panel privacy-panel" onSubmit={saveSettings}>
      <div className="settings-intro-card">
        <ShieldCheck size={25} />
        <div>
          <strong>Your data stays in your hands</strong>
          <span>These controls affect information stored on this device.</span>
        </div>
      </div>

      <section className="settings-card settings-toggle-list">
        <SettingToggle
          icon={Home}
          title="Show my personal reminder on Home"
          description="Display the intention from your profile beneath the logo."
          checked={draft.showHomeReminder}
          onChange={(value) => updateDraft('showHomeReminder', value)}
        />
        <SettingToggle
          icon={Lock}
          title="Use discreet notification wording"
          description="Keep recovery-specific wording out of notification previews."
          checked={draft.discreetNotifications}
          onChange={(value) => updateDraft('discreetNotifications', value)}
        />
        <SettingToggle
          icon={EyeOff}
          title="Protect the app screen"
          description="Hide app-switcher previews and block screenshots or recordings."
          checked={draft.screenProtection}
          onChange={(value) => updateDraft('screenProtection', value)}
        />
      </section>

      {message && (
        <div className={`settings-message ${message.includes('saved') ? 'success' : 'error'}`} role="status">
          {message.includes('saved') ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{message}</span>
        </div>
      )}

      <button className="primary-button settings-save-button" type="submit" disabled={saving}>
        <Save size={18} />
        <span>{saving ? 'Saving…' : 'Save privacy settings'}</span>
      </button>

      <section className="data-control-card">
        <div>
          <Trash2 size={20} />
          <span>
            <strong>Clear all app data</strong>
            <small>Remove your profile, reasons, contacts, check-ins, timer, settings, and risky contacts from this device.</small>
          </span>
        </div>

        {!confirmClear ? (
          <button className="danger-outline-button" type="button" onClick={() => setConfirmClear(true)}>
            Clear app data
          </button>
        ) : (
          <div className="clear-data-confirmation">
            <div className="clear-warning">
              <AlertTriangle size={20} />
              <span>
                <strong>This cannot be undone.</strong>
                <small>The app will return to its fresh-install state.</small>
              </span>
            </div>
            <label>
              <input
                type="checkbox"
                checked={clearChecked}
                onChange={(event) => setClearChecked(event.target.checked)}
              />
              <span>I understand that my local data will be deleted.</span>
            </label>
            <div>
              <button
                type="button"
                onClick={() => {
                  setConfirmClear(false);
                  setClearChecked(false);
                }}
              >
                Keep my data
              </button>
              <button className="confirm-delete-button" type="button" disabled={!clearChecked || saving} onClick={clearData}>
                Delete everything
              </button>
            </div>
          </div>
        )}
      </section>
    </form>
  );
}
