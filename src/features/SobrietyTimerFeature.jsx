import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Pencil,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  clearSobrietyTimer,
  loadSobrietyTimer,
  saveSobrietyTimer,
} from '../native/sobrietyTimerStore';

const DAY_MS = 24 * 60 * 60 * 1000;
const MILESTONES = [
  { days: 1, label: 'One day' },
  { days: 7, label: 'One week' },
  { days: 30, label: 'One month' },
  { days: 90, label: 'Three months' },
  { days: 180, label: 'Six months' },
  { days: 365, label: 'One year' },
  { days: 730, label: 'Two years' },
  { days: 1825, label: 'Five years' },
];

function getLocalDateParts(date) {
  const pad = (value) => value.toString().padStart(2, '0');
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

function getDuration(startAt, now) {
  const totalSeconds = Math.max(0, Math.floor((now - startAt) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

function formatStartDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function SobrietyTimerFeature() {
  const initialParts = getLocalDateParts(new Date());
  const [timer, setTimer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState('My recovery');
  const [startDate, setStartDate] = useState(initialParts.date);
  const [startTime, setStartTime] = useState(initialParts.time);
  const [now, setNow] = useState(Date.now());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    let active = true;
    loadSobrietyTimer()
      .then((storedTimer) => {
        if (!active) {
          return;
        }
        setTimer(storedTimer);
        if (storedTimer) {
          const parts = getLocalDateParts(new Date(storedTimer.startAt));
          setLabel(storedTimer.label);
          setStartDate(parts.date);
          setStartTime(parts.time);
        } else {
          setEditing(true);
        }
      })
      .catch(() => {
        if (active) {
          setMessage('Your sobriety timer could not be loaded.');
          setEditing(true);
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

  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(clock);
  }, []);

  const beginEditing = () => {
    if (timer) {
      const parts = getLocalDateParts(new Date(timer.startAt));
      setLabel(timer.label);
      setStartDate(parts.date);
      setStartTime(parts.time);
    }
    setMessage('');
    setConfirmClear(false);
    setEditing(true);
  };

  const saveTimer = async (event) => {
    event.preventDefault();
    const cleanLabel = label.trim();
    const startAt = new Date(`${startDate}T${startTime}`);

    if (!cleanLabel) {
      setMessage('Enter a name for what you are tracking.');
      return;
    }

    if (Number.isNaN(startAt.getTime())) {
      setMessage('Choose a valid start date and time.');
      return;
    }

    if (startAt.getTime() > Date.now()) {
      setMessage('The start date cannot be in the future.');
      return;
    }

    const nextTimer = {
      label: cleanLabel,
      startAt: startAt.toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSaving(true);
    setMessage('');
    try {
      await saveSobrietyTimer(nextTimer);
      setTimer(nextTimer);
      setEditing(false);
      setNow(Date.now());
      setMessage('Your timer was saved on this device.');
    } catch {
      setMessage('Your timer could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const clearTimer = async () => {
    setSaving(true);
    setMessage('');
    try {
      await clearSobrietyTimer();
      const parts = getLocalDateParts(new Date());
      setTimer(null);
      setLabel('My recovery');
      setStartDate(parts.date);
      setStartTime(parts.time);
      setConfirmClear(false);
      setEditing(true);
      setMessage('The timer was cleared from this device.');
    } catch {
      setMessage('The timer could not be cleared.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="feature-loading" role="status">
        <Clock3 size={25} />
        <span>Loading your timer…</span>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="sobriety-panel">
        <p className="feature-intro">
          Track a date that matters to you. You choose the wording, and the app
          will never reset it automatically.
        </p>
        <form className="sobriety-form" onSubmit={saveTimer}>
          <label className="field-label" htmlFor="timer-label">
            What are you tracking?
          </label>
          <input
            id="timer-label"
            className="text-input"
            type="text"
            maxLength="40"
            placeholder="Example: Alcohol-free"
            value={label}
            onChange={(event) => {
              setLabel(event.target.value);
              setMessage('');
            }}
          />
          <div className="timer-date-fields">
            <label>
              <span>Start date</span>
              <input
                type="date"
                value={startDate}
                max={getLocalDateParts(new Date()).date}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  setMessage('');
                }}
              />
            </label>
            <label>
              <span>Start time</span>
              <input
                type="time"
                value={startTime}
                onChange={(event) => {
                  setStartTime(event.target.value);
                  setMessage('');
                }}
              />
            </label>
          </div>

          {message && (
            <div className="setup-message" role="status">
              <AlertCircle size={17} />
              <span>{message}</span>
            </div>
          )}

          <div className="timer-form-actions">
            {timer && (
              <button className="secondary-button" type="button" disabled={saving} onClick={() => setEditing(false)}>
                Cancel
              </button>
            )}
            <button className="primary-button timer-save-button" type="submit" disabled={saving}>
              <Save size={18} />
              <span>{saving ? 'Saving…' : 'Save timer'}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  const startAt = new Date(timer.startAt).getTime();
  const duration = getDuration(startAt, now);
  const elapsedDays = (now - startAt) / DAY_MS;
  const achievedMilestones = MILESTONES.filter((milestone) => elapsedDays >= milestone.days);
  const nextMilestone = MILESTONES.find((milestone) => elapsedDays < milestone.days);

  return (
    <div className="sobriety-panel">
      <div className="sobriety-clock-card">
        <span className="sobriety-label">{timer.label}</span>
        <div className="sobriety-duration">
          <div className="sobriety-days">
            <strong>{duration.days}</strong>
            <span>{duration.days === 1 ? 'day' : 'days'}</span>
          </div>
          <div className="sobriety-time-parts">
            <span><strong>{duration.hours}</strong> hr</span>
            <span><strong>{duration.minutes}</strong> min</span>
            <span><strong>{duration.seconds}</strong> sec</span>
          </div>
        </div>
        <div className="sobriety-start-date">
          <CalendarDays size={16} />
          <span>Since {formatStartDate(timer.startAt)}</span>
        </div>
      </div>

      {nextMilestone ? (
        <div className="next-milestone-card">
          <Sparkles size={22} />
          <div>
            <strong>Next: {nextMilestone.label}</strong>
            <span>{Math.max(1, Math.ceil(nextMilestone.days - elapsedDays))} days away</span>
          </div>
        </div>
      ) : (
        <div className="next-milestone-card">
          <Sparkles size={22} />
          <div>
            <strong>Your time keeps growing.</strong>
            <span>Every day beyond this is its own milestone.</span>
          </div>
        </div>
      )}

      {achievedMilestones.length > 0 && (
        <section className="milestone-list" aria-labelledby="milestones-title">
          <strong id="milestones-title">Milestones reached</strong>
          <div>
            {achievedMilestones.map((milestone) => (
              <span key={milestone.days}>
                <CheckCircle2 size={16} />
                {milestone.label}
              </span>
            ))}
          </div>
        </section>
      )}

      {message && (
        <div className="setup-message" role="status">
          <AlertCircle size={17} />
          <span>{message}</span>
        </div>
      )}

      <button className="secondary-button timer-edit-button" type="button" onClick={beginEditing}>
        <Pencil size={17} />
        <span>Edit timer details</span>
      </button>

      {confirmClear ? (
        <div className="timer-clear-confirmation">
          <span>Clear this timer from the device?</span>
          <div>
            <button type="button" disabled={saving} onClick={() => setConfirmClear(false)}>
              Keep it
            </button>
            <button className="confirm-clear" type="button" disabled={saving} onClick={clearTimer}>
              {saving ? 'Clearing…' : 'Clear timer'}
            </button>
          </div>
        </div>
      ) : (
        <button className="clear-timer-button" type="button" onClick={() => setConfirmClear(true)}>
          <Trash2 size={15} />
          <span>Clear timer</span>
        </button>
      )}
    </div>
  );
}
