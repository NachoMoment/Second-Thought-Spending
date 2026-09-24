import React, { useEffect, useState } from 'react';
import { AlertCircle, Save, Shield, UserRound } from 'lucide-react';
import { saveProfile } from '../native/profileStore';

const RECOVERY_FOCUSES = [
  'Staying substance-free',
  'Reducing harm',
  'Protecting my recovery',
  'Something personal',
];

function getInitial(nickname) {
  return nickname.trim().charAt(0).toUpperCase() || '?';
}

export function ProfileFeature({ profile, loading, onSaved }) {
  const [nickname, setNickname] = useState('');
  const [recoveryFocus, setRecoveryFocus] = useState('');
  const [intention, setIntention] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setNickname(profile?.nickname ?? '');
    setRecoveryFocus(profile?.recoveryFocus ?? '');
    setIntention(profile?.intention ?? '');
  }, [profile]);

  const submitProfile = async (event) => {
    event.preventDefault();
    const cleanNickname = nickname.trim();

    if (!cleanNickname) {
      setMessage('Enter the name you would like Second Thought to use.');
      return;
    }

    if (!recoveryFocus) {
      setMessage('Choose the recovery focus that feels closest right now.');
      return;
    }

    const nextProfile = {
      nickname: cleanNickname,
      recoveryFocus,
      intention: intention.trim(),
      updatedAt: new Date().toISOString(),
    };

    setSaving(true);
    setMessage('');
    try {
      await saveProfile(nextProfile);
      onSaved(nextProfile);
      setMessage('Your profile was saved on this device.');
    } catch {
      setMessage('Your profile could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="feature-loading" role="status">
        <UserRound size={25} />
        <span>Loading your profile…</span>
      </div>
    );
  }

  return (
    <div className="profile-panel">
      <div className="profile-identity-card">
        <div className="profile-avatar" aria-hidden="true">
          {profile?.nickname ? getInitial(profile.nickname) : <UserRound size={27} />}
        </div>
        <div>
          <strong>{profile?.nickname || 'Your private profile'}</strong>
          <span>{profile?.recoveryFocus || 'Personalize how the app supports you.'}</span>
        </div>
      </div>

      <form className="profile-form" onSubmit={submitProfile}>
        <label className="field-label" htmlFor="profile-nickname">
          What should Second Thought call you?
        </label>
        <input
          id="profile-nickname"
          className="text-input"
          type="text"
          autoComplete="nickname"
          maxLength="40"
          placeholder="Name or nickname"
          value={nickname}
          onChange={(event) => {
            setNickname(event.target.value);
            setMessage('');
          }}
        />

        <fieldset className="profile-focus-fieldset">
          <legend>What are you working toward?</legend>
          <div>
            {RECOVERY_FOCUSES.map((focus) => (
              <button
                className={recoveryFocus === focus ? 'selected' : ''}
                type="button"
                aria-pressed={recoveryFocus === focus}
                key={focus}
                onClick={() => {
                  setRecoveryFocus(focus);
                  setMessage('');
                }}
              >
                {focus}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="field-label" htmlFor="profile-intention">
          A reminder for yourself <span>(optional)</span>
        </label>
        <textarea
          id="profile-intention"
          className="profile-intention"
          rows="3"
          maxLength="140"
          placeholder="Example: I want a life that feels steady and honest."
          value={intention}
          onChange={(event) => {
            setIntention(event.target.value);
            setMessage('');
          }}
        />
        <div className="profile-character-count">{intention.length}/140</div>

        {message && (
          <div className="setup-message" role="status">
            <AlertCircle size={17} />
            <span>{message}</span>
          </div>
        )}

        <button className="primary-button profile-save-button" type="submit" disabled={saving}>
          <Save size={18} />
          <span>{saving ? 'Saving…' : 'Save profile'}</span>
        </button>
      </form>

      <div className="profile-privacy-note">
        <Shield size={18} />
        <span>This profile stays on this device and is not a public account.</span>
      </div>
    </div>
  );
}
