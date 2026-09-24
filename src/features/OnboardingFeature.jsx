import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Heart,
  Lock,
  Plus,
  Shield,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import { callGuard } from '../native/callGuard';
import { saveProfile } from '../native/profileStore';
import { loadSafeContacts, saveSafeContacts } from '../native/safeContactsStore';

const FOCUS_OPTIONS = [
  'Staying substance-free',
  'Reducing harm',
  'Protecting my recovery',
  'Something personal',
];

function id(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function OnboardingFeature({ initialProfile, onComplete }) {
  const [step, setStep] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState({
    nickname: initialProfile?.nickname ?? '',
    recoveryFocus: initialProfile?.recoveryFocus ?? '',
    intention: initialProfile?.intention ?? '',
  });
  const [safeDraft, setSafeDraft] = useState({ name: '', phone: '', relationship: '' });
  const [riskyDraft, setRiskyDraft] = useState({ name: '', number: '' });
  const [riskyContacts, setRiskyContacts] = useState([]);

  useEffect(() => {
    callGuard.getStatus().then((status) => setRiskyContacts(status.riskyContacts ?? [])).catch(() => {});
  }, []);

  const next = () => {
    setMessage('');
    setStep((current) => Math.min(4, current + 1));
  };

  const back = () => {
    setMessage('');
    setStep((current) => Math.max(0, current - 1));
  };

  const saveProfileStep = async () => {
    if (!profile.recoveryFocus) {
      setMessage('Choose what you are working toward.');
      return;
    }
    setBusy(true);
    try {
      const saved = { ...profile, nickname: profile.nickname.trim(), intention: profile.intention.trim(), updatedAt: new Date().toISOString() };
      await saveProfile(saved);
      setProfile(saved);
      next();
    } catch {
      setMessage('Your profile could not be saved. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const saveSafeStep = async () => {
    const name = safeDraft.name.trim();
    const phone = safeDraft.phone.trim();
    if (!name && !phone) {
      next();
      return;
    }
    if (!name || phone.replace(/\D/g, '').length < 7) {
      setMessage('Enter both a name and a complete phone number, or skip for now.');
      return;
    }
    setBusy(true);
    try {
      const current = await loadSafeContacts();
      const now = new Date().toISOString();
      await saveSafeContacts([...current, { id: id('safe'), name, phone, relationship: safeDraft.relationship.trim(), createdAt: now, updatedAt: now }]);
      next();
    } catch {
      setMessage('Your safe contact could not be saved. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const addRiskyContact = async () => {
    const name = riskyDraft.name.trim();
    const number = riskyDraft.number.trim();
    if (!name || number.replace(/\D/g, '').length < 7) {
      setMessage('Enter a name and complete phone number.');
      return;
    }
    const contacts = [...riskyContacts, { id: id('risky'), name, number, enabled: true }];
    setBusy(true);
    try {
      await callGuard.saveRiskyContacts(contacts);
      setRiskyContacts(contacts);
      setRiskyDraft({ name: '', number: '' });
      setMessage(`${name} added. You can add another or continue.`);
    } catch {
      setMessage('That risky contact could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const removeRiskyContact = async (contactId) => {
    const contacts = riskyContacts.filter((contact) => contact.id !== contactId);
    setBusy(true);
    try {
      await callGuard.saveRiskyContacts(contacts);
      setRiskyContacts(contacts);
    } finally {
      setBusy(false);
    }
  };

  const finishRiskyStep = async () => {
    setBusy(true);
    try {
      if (callGuard.isNativeAndroid && riskyContacts.length > 0) {
        await callGuard.prepareNotifications();
        await callGuard.requestRole();
      }
    } catch {
      // Permission recovery remains available from Risky Contacts and Settings.
    } finally {
      setBusy(false);
      next();
    }
  };

  return (
    <main className="onboarding-shell">
      <div className="onboarding-progress" aria-label={`Setup step ${step + 1} of 5`}>
        {[0, 1, 2, 3, 4].map((item) => <span key={item} className={item <= step ? 'active' : ''} />)}
      </div>

      <section className="onboarding-card">
        <div className="mini-logo onboarding-logo"><span>2nd</span><span>Thought</span></div>

        {step === 0 && (
          <div className="onboarding-content">
            <Sparkles size={30} />
            <h1>A pause that is ready when you need it</h1>
            <p>Second Thought helps adults slow down urges, reach safe people, remember personal reasons, and interrupt calls to risky contacts.</p>
            <div className="onboarding-notice">
              <strong>Know before you begin</strong>
              <p>This app is not a medical device or a substitute for professional care. Crisis and emergency links in this release are for the United States. Call 911 for immediate danger or possible overdose.</p>
            </div>
            <label className="onboarding-check">
              <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />
              <span>I understand what Second Thought can and cannot do.</span>
            </label>
            <button className="primary-button" type="button" disabled={!acknowledged} onClick={next}>Begin setup <ArrowRight size={18} /></button>
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-content">
            <Heart size={29} />
            <h1>Make it feel like yours</h1>
            <label className="field-label" htmlFor="setup-name">What should we call you? <small>(optional)</small></label>
            <input id="setup-name" className="text-input" maxLength={40} value={profile.nickname} placeholder="Name or nickname" onChange={(event) => setProfile((current) => ({ ...current, nickname: event.target.value }))} />
            <fieldset className="onboarding-focus">
              <legend>What are you working toward?</legend>
              {FOCUS_OPTIONS.map((option) => (
                <button key={option} className={profile.recoveryFocus === option ? 'selected' : ''} type="button" onClick={() => setProfile((current) => ({ ...current, recoveryFocus: option }))}>{option}</button>
              ))}
            </fieldset>
            <label className="field-label" htmlFor="setup-intention">A reminder for yourself <small>(optional)</small></label>
            <textarea id="setup-intention" className="text-area" maxLength={140} value={profile.intention} placeholder="I want a life that feels steady and honest." onChange={(event) => setProfile((current) => ({ ...current, intention: event.target.value }))} />
            {message && <p className="form-message" role="status">{message}</p>}
            <div className="onboarding-actions"><button type="button" onClick={back}><ArrowLeft size={17} /> Back</button><button className="primary-button" type="button" disabled={busy} onClick={saveProfileStep}>Save and continue</button></div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-content">
            <Users size={30} />
            <h1>Add a safe person</h1>
            <p>Choose someone you can call or text when a moment feels heavy. You can add more later.</p>
            <label className="field-label" htmlFor="setup-safe-name">Name</label>
            <input id="setup-safe-name" className="text-input" value={safeDraft.name} onChange={(event) => setSafeDraft((current) => ({ ...current, name: event.target.value }))} />
            <label className="field-label" htmlFor="setup-safe-phone">Phone number</label>
            <input id="setup-safe-phone" className="phone-input" type="tel" inputMode="tel" value={safeDraft.phone} onChange={(event) => setSafeDraft((current) => ({ ...current, phone: event.target.value }))} />
            <label className="field-label" htmlFor="setup-safe-relationship">Why they feel safe <small>(optional)</small></label>
            <input id="setup-safe-relationship" className="text-input" value={safeDraft.relationship} onChange={(event) => setSafeDraft((current) => ({ ...current, relationship: event.target.value }))} />
            {message && <p className="form-message" role="status">{message}</p>}
            <div className="onboarding-actions"><button type="button" onClick={back}><ArrowLeft size={17} /> Back</button><button className="primary-button" type="button" disabled={busy} onClick={saveSafeStep}>{safeDraft.name || safeDraft.phone ? 'Save and continue' : 'Skip for now'}</button></div>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-content">
            <Lock size={30} />
            <h1>Protect risky calls</h1>
            <p>Add one or more contacts. Android can cancel the first call attempt and open a deliberate pause.</p>
            {riskyContacts.map((contact) => (
              <div className="onboarding-contact" key={contact.id}><span><strong>{contact.name}</strong><small>{contact.number}</small></span><button type="button" aria-label={`Remove ${contact.name}`} onClick={() => removeRiskyContact(contact.id)}><Trash2 size={17} /></button></div>
            ))}
            <div className="onboarding-risky-form">
              <input className="text-input" value={riskyDraft.name} placeholder="Name or label" onChange={(event) => setRiskyDraft((current) => ({ ...current, name: event.target.value }))} />
              <input className="phone-input" type="tel" inputMode="tel" value={riskyDraft.number} placeholder="Phone number" onChange={(event) => setRiskyDraft((current) => ({ ...current, number: event.target.value }))} />
              <button className="secondary-button" type="button" disabled={busy} onClick={addRiskyContact}><Plus size={17} /> Add contact</button>
            </div>
            {message && <p className="form-message" role="status">{message}</p>}
            <p className="technical-note">Android will ask for call-redirection and notification access after Continue. You can recover either permission later in the app.</p>
            <div className="onboarding-actions"><button type="button" onClick={back}><ArrowLeft size={17} /> Back</button><button className="primary-button" type="button" disabled={busy} onClick={finishRiskyStep}>{riskyContacts.length ? 'Continue' : 'Skip for now'}</button></div>
          </div>
        )}

        {step === 4 && (
          <div className="onboarding-content onboarding-finish">
            <CheckCircle2 size={42} />
            <h1>Your pause is ready</h1>
            <p>You can change your profile, safe contacts, risky contacts, reminders, and privacy controls at any time from the menu.</p>
            <div className="onboarding-summary"><Shield size={21} /><span>Your recovery details are encrypted at rest in the installed Android app.</span></div>
            <button className="primary-button" type="button" onClick={() => onComplete(profile)}>Enter Second Thought</button>
            <button className="onboarding-back-link" type="button" onClick={back}>Back to risky contacts</button>
          </div>
        )}
      </section>
    </main>
  );
}
