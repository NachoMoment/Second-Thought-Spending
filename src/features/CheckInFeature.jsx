import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Clock3,
  Heart,
  History,
  Save,
  Trash2,
  Users,
  Waves,
} from 'lucide-react';
import {
  clearCheckIns,
  loadCheckIns,
  saveCheckIns,
} from '../native/checkInsStore';

const FEELINGS = [
  'Grounded',
  'Hopeful',
  'Uneasy',
  'Lonely',
  'Overwhelmed',
  'Exhausted',
];

function createCheckInId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `check-in-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatCheckInDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return 'Recent check-in';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function CheckInFeature({ onOpenUrge, onOpenNeedPerson, onDone }) {
  const [checkIns, setCheckIns] = useState([]);
  const [feelings, setFeelings] = useState([]);
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stage, setStage] = useState('form');
  const [message, setMessage] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    let active = true;

    loadCheckIns()
      .then((storedCheckIns) => {
        if (active) {
          setCheckIns(storedCheckIns);
        }
      })
      .catch(() => {
        if (active) {
          setMessage('Your recent check-ins could not be loaded.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const toggleFeeling = (feeling) => {
    setFeelings((current) =>
      current.includes(feeling)
        ? current.filter((item) => item !== feeling)
        : [...current, feeling],
    );
    setMessage('');
  };

  const submitCheckIn = async (event) => {
    event.preventDefault();

    if (feelings.length === 0) {
      setMessage('Choose at least one feeling before saving.');
      return;
    }

    const nextCheckIn = {
      id: createCheckInId(),
      feelings,
      intensity,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };
    const nextCheckIns = [nextCheckIn, ...checkIns].slice(0, 30);

    setSaving(true);
    setMessage('');
    try {
      await saveCheckIns(nextCheckIns);
      setCheckIns(nextCheckIns);
      setStage('response');
    } catch {
      setMessage('This check-in could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const startAnother = () => {
    setFeelings([]);
    setIntensity(3);
    setNote('');
    setMessage('');
    setStage('form');
  };

  const clearHistory = async () => {
    setSaving(true);
    setMessage('');
    try {
      await clearCheckIns();
      setCheckIns([]);
      setConfirmClear(false);
      setMessage('Your check-in history was cleared from this device.');
    } catch {
      setMessage('Your check-in history could not be cleared.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="feature-loading" role="status">
        <Clock3 size={25} />
        <span>Loading your recent check-ins…</span>
      </div>
    );
  }

  const needsConnection = feelings.includes('Lonely') || feelings.includes('Overwhelmed');
  const latestCheckIn = checkIns[0];

  return (
    <div className="check-in-panel">
      {stage === 'form' ? (
        <form className="check-in-form" onSubmit={submitCheckIn}>
          <p className="feature-intro">
            This is a snapshot, not a grade. Choose what feels true right now.
          </p>

          <fieldset className="feeling-fieldset">
            <legend>How are you feeling?</legend>
            <span>Choose all that fit.</span>
            <div className="feeling-options">
              {FEELINGS.map((feeling) => (
                <button
                  className={feelings.includes(feeling) ? 'selected' : ''}
                  type="button"
                  aria-pressed={feelings.includes(feeling)}
                  key={feeling}
                  onClick={() => toggleFeeling(feeling)}
                >
                  {feeling}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="check-in-intensity">
            <div>
              <label htmlFor="check-in-intensity">How strong is the urge to use?</label>
              <output htmlFor="check-in-intensity">{intensity}</output>
            </div>
            <input
              id="check-in-intensity"
              type="range"
              min="1"
              max="10"
              step="1"
              value={intensity}
              onChange={(event) => setIntensity(Number(event.target.value))}
              aria-valuetext={`${intensity} out of 10`}
            />
            <div aria-hidden="true">
              <span>Quiet</span>
              <span>Overwhelming</span>
            </div>
          </div>

          <label className="field-label" htmlFor="check-in-note">
            Anything you want to name? <span>(optional)</span>
          </label>
          <textarea
            id="check-in-note"
            className="check-in-note"
            rows="3"
            maxLength="180"
            placeholder="A short note about what is happening…"
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setMessage('');
            }}
          />
          <div className="check-in-note-count">{note.length}/180</div>

          <button className="primary-button check-in-save" type="submit" disabled={saving}>
            <Save size={18} />
            <span>{saving ? 'Saving…' : 'Save check-in'}</span>
          </button>
        </form>
      ) : (
        <div className="check-in-response">
          <div className={`check-in-result ${intensity >= 7 ? 'needs-support' : ''}`}>
            <Heart size={29} />
            <strong>
              {intensity >= 7
                ? 'The urge is loud right now.'
                : needsConnection
                  ? 'It sounds like connection may help.'
                  : 'You took a moment to notice where you are.'}
            </strong>
            <p>
              {intensity >= 7
                ? 'You do not need to wait for it to get louder before using support.'
                : 'Nothing about this check-in needs to be fixed or judged.'}
            </p>
          </div>

          {intensity >= 7 && (
            <button className="primary-button routed-action" type="button" onClick={onOpenUrge}>
              <Waves size={18} />
              <span>Ride out this urge</span>
            </button>
          )}
          {(intensity >= 7 || needsConnection) && (
            <button className="secondary-button routed-action" type="button" onClick={onOpenNeedPerson}>
              <Users size={18} />
              <span>Reach someone safe</span>
            </button>
          )}
          <button className={intensity >= 7 || needsConnection ? 'text-button' : 'primary-button'} type="button" onClick={onDone}>
            Done for now
          </button>
          <button className="secondary-button" type="button" onClick={startAnother}>
            Start another check-in
          </button>
        </div>
      )}

      {message && (
        <div className="setup-message" role="status">
          <AlertCircle size={17} />
          <span>{message}</span>
        </div>
      )}

      {latestCheckIn && (
        <section className="recent-check-ins" aria-labelledby="recent-check-ins-title">
          <div className="feature-section-heading recent-heading">
            <span>
              <History size={18} />
              <strong id="recent-check-ins-title">Recent check-ins</strong>
            </span>
            <small>Showing up to five</small>
          </div>
          <div className="check-in-history-list">
            {checkIns.slice(0, 5).map((checkIn) => (
              <article key={checkIn.id}>
                <div>
                  <time dateTime={checkIn.createdAt}>{formatCheckInDate(checkIn.createdAt)}</time>
                  <strong>{checkIn.intensity}/10</strong>
                </div>
                <p>{checkIn.feelings.join(' · ')}</p>
                {checkIn.note && <blockquote>{checkIn.note}</blockquote>}
              </article>
            ))}
          </div>

          {confirmClear ? (
            <div className="clear-history-confirmation">
              <span>Clear every saved check-in?</span>
              <div>
                <button type="button" disabled={saving} onClick={() => setConfirmClear(false)}>
                  Keep them
                </button>
                <button className="confirm-clear" type="button" disabled={saving} onClick={clearHistory}>
                  {saving ? 'Clearing…' : 'Clear all'}
                </button>
              </div>
            </div>
          ) : (
            <button className="clear-history-button" type="button" onClick={() => setConfirmClear(true)}>
              <Trash2 size={15} />
              <span>Clear check-in history</span>
            </button>
          )}
        </section>
      )}

    </div>
  );
}
