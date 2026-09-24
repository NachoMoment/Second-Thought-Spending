import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Heart,
  LifeBuoy,
  PhoneCall,
  Shield,
  Users,
} from 'lucide-react';

const STAY_PROMPTS = [
  'Stay where you are if it is safe, and do not drive.',
  'Keep your phone nearby and let one safe person know where you are.',
  'Do not take anything else or mix substances.',
  'Notice your breathing and whether anything feels different or concerning.',
];

function formatTimer(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function AlreadyUsedFeature({ onOpenNeedPerson, onOpenReasons, onDone }) {
  const [stage, setStage] = useState('safety');
  const [secondsRemaining, setSecondsRemaining] = useState(300);
  const [timerEndsAt, setTimerEndsAt] = useState(null);

  useEffect(() => {
    if (stage !== 'stay' || !timerEndsAt) {
      return undefined;
    }

    const updateTimer = () => {
      setSecondsRemaining(
        Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000)),
      );
    };

    updateTimer();
    const timer = window.setInterval(updateTimer, 250);
    return () => window.clearInterval(timer);
  }, [stage, timerEndsAt]);

  const beginStay = () => {
    setSecondsRemaining(300);
    setTimerEndsAt(Date.now() + 300000);
    setStage('stay');
  };

  const promptIndex = Math.min(
    STAY_PROMPTS.length - 1,
    Math.floor((300 - secondsRemaining) / 75),
  );

  if (stage === 'safety') {
    return (
      <div className="used-panel">
        <div className="used-intro-card">
          <Heart size={30} />
          <strong>You are here. Let’s focus on keeping you safe right now.</strong>
          <p>This is not the moment to judge or explain what happened.</p>
        </div>

        <div className="safety-question">
          <strong>Are you awake, breathing normally, and physically okay?</strong>
          <button className="primary-button" type="button" onClick={() => setStage('safe')}>
            Yes, I’m physically okay
          </button>
          <button className="danger-button" type="button" onClick={() => setStage('urgent')}>
            <AlertTriangle size={18} />
            <span>I’m not sure or something feels wrong</span>
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'urgent') {
    return (
      <div className="used-panel">
        <div className="medical-alert-card">
          <AlertTriangle size={31} />
          <strong>Get medical help now.</strong>
          <p>
            Call 911 immediately for collapse, a seizure, trouble breathing,
            choking or gurgling sounds, or if someone cannot be awakened.
          </p>
        </div>

        <a className="emergency-call-action" href="tel:911">
          <PhoneCall size={20} />
          <span>Call 911</span>
        </a>
        <a className="poison-call-action" href="tel:18002221222">
          <LifeBuoy size={20} />
          <span>Call Poison Control</span>
          <small>1-800-222-1222</small>
        </a>

        <div className="naloxone-note">
          <Shield size={21} />
          <p>
            If opioids might be involved, give naloxone if it is available and
            still call 911. Stay with the person until help arrives.
          </p>
        </div>

        <button className="secondary-button routed-action" type="button" onClick={onOpenNeedPerson}>
          <Users size={18} />
          <span>Contact a safe person too</span>
        </button>
        <button className="text-button" type="button" onClick={() => setStage('safety')}>
          Go back
        </button>
      </div>
    );
  }

  if (stage === 'safe') {
    return (
      <div className="used-panel">
        <div className="right-now-card">
          <CheckCircle2 size={28} />
          <strong>For the next little while:</strong>
          <ul>
            <li>Do not take anything else or mix substances.</li>
            <li>Do not drive.</li>
            <li>Move somewhere physically safe.</li>
            <li>Tell one safe person what happened and stay near someone if possible.</li>
          </ul>
        </div>

        <div className="used-next-actions">
          <button type="button" onClick={onOpenNeedPerson}>
            <Users size={20} />
            <span>
              <strong>Call or text someone safe</strong>
              <small>Let another person know what happened.</small>
            </span>
          </button>
          <button type="button" onClick={beginStay}>
            <Clock3 size={20} />
            <span>
              <strong>Stay with me for five minutes</strong>
              <small>Slow the next decision down.</small>
            </span>
          </button>
          <button type="button" onClick={onOpenReasons}>
            <Heart size={20} />
            <span>
              <strong>Read My Reasons</strong>
              <small>Reconnect with what still matters.</small>
            </span>
          </button>
          <a href="tel:18002221222">
            <LifeBuoy size={20} />
            <span>
              <strong>Call Poison Control</strong>
              <small>Get expert help if you are unsure.</small>
            </span>
          </a>
        </div>

        <button className="primary-button" type="button" onClick={() => setStage('finish')}>
          I’ve taken the next safe step
        </button>
        <button className="urgent-shortcut" type="button" onClick={() => setStage('urgent')}>
          Something feels wrong
        </button>
      </div>
    );
  }

  if (stage === 'stay') {
    return (
      <div className="used-panel">
        <div className="used-stay-card">
          <Clock3 size={28} />
          <span className="used-timer" aria-label={`${secondsRemaining} seconds remaining`}>
            {formatTimer(secondsRemaining)}
          </span>
          <strong>For right now:</strong>
          <p aria-live="polite">{STAY_PROMPTS[promptIndex]}</p>
          <div className="urge-progress" aria-hidden="true">
            <span style={{ width: `${((300 - secondsRemaining) / 300) * 100}%` }} />
          </div>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={() => {
            setTimerEndsAt(null);
            setStage('finish');
          }}
        >
          {secondsRemaining === 0 ? 'Continue' : 'Continue when I’m ready'}
        </button>
        <button className="secondary-button routed-action" type="button" onClick={onOpenNeedPerson}>
          <Users size={18} />
          <span>Contact someone safe</span>
        </button>
        <button className="urgent-shortcut" type="button" onClick={() => setStage('urgent')}>
          Something feels wrong
        </button>
      </div>
    );
  }

  return (
    <div className="used-panel">
      <div className="used-finish-card">
        <div>
          <Heart size={31} />
        </div>
        <strong>What happened does not erase everything that came before it.</strong>
        <p>The next safe choice still counts. There is no decision you have to make about a timer or label right now.</p>
      </div>
      <button className="primary-button" type="button" onClick={onDone}>
        I’m safe for now
      </button>
      <button className="secondary-button routed-action" type="button" onClick={onOpenNeedPerson}>
        <Users size={18} />
        <span>Stay connected to someone</span>
      </button>
      <button className="text-button" type="button" onClick={onOpenReasons}>
        Read My Reasons
      </button>
    </div>
  );
}
