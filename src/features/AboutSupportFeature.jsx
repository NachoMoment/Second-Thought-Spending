import React from 'react';
import { ExternalLink, HeartHandshake, Mail, Settings, ShieldCheck } from 'lucide-react';
import { callGuard } from '../native/callGuard';
import { COMMUNITY_CONFIG } from '../config/communityConfig';

export function AboutSupportFeature({ onRunSetup }) {
  const policyReady = Boolean(COMMUNITY_CONFIG.privacyNoticeUrl);
  const emailReady = Boolean(COMMUNITY_CONFIG.supportEmail);
  const projectReady = Boolean(COMMUNITY_CONFIG.projectUrl);
  const supportMailto = `mailto:${COMMUNITY_CONFIG.supportEmail}?subject=${encodeURIComponent('Second Thought support')}`;

  return (
    <div className="about-panel">
      <section className="about-card about-identity">
        <HeartHandshake size={27} />
        <div>
          <strong>{COMMUNITY_CONFIG.appName}</strong>
          <span>{COMMUNITY_CONFIG.buildLabel} · {COMMUNITY_CONFIG.version}</span>
          <small>One pause between impulse and action.</small>
        </div>
      </section>

      <section className="about-card">
        <h2>Safety and medical information</h2>
        <p>
          Second Thought is not a medical device and does not diagnose, treat,
          cure, or prevent any medical condition. It is not a substitute for
          professional medical advice, diagnosis, or treatment. Consult a
          qualified healthcare professional about your care.
        </p>
        <p>
          Crisis links in this release are for the United States. If you may
          overdose or are in immediate danger, call <a href="tel:911">911</a>.
          For U.S. crisis support, call or text <a href="tel:988">988</a>.
        </p>
      </section>

      <section className="about-card">
        <h2>Your privacy</h2>
        <div className="about-icon-copy">
          <ShieldCheck size={21} />
          <p>
            Recovery information is kept on this device and encrypted at rest
            in the installed Android app. Second Thought has no account,
            advertising, analytics, or cloud sync in this release.
          </p>
        </div>
        {policyReady ? (
          <a className="about-link-button" href={COMMUNITY_CONFIG.privacyNoticeUrl} target="_blank" rel="noreferrer">
            Read the privacy notice <ExternalLink size={17} />
          </a>
        ) : (
          <p className="about-placeholder">
            Second Thought has no remote recovery-data service. The complete privacy notice is included with the project, and the essential promise is summarized above.
          </p>
        )}
      </section>

      <section className="about-card">
        <h2>Support</h2>
        {emailReady ? (
          <a className="about-link-button" href={supportMailto}>
            Email support <Mail size={17} />
          </a>
        ) : (
          <p className="about-placeholder">
            Support email is unavailable in this build. Use the project issue tracker for non-sensitive reports if one is listed below.
          </p>
        )}
        {projectReady && (
          <a className="about-link-button" href={COMMUNITY_CONFIG.projectUrl} target="_blank" rel="noreferrer">
            Open the project <ExternalLink size={17} />
          </a>
        )}
        <p className="technical-note">
          Free to use and independently maintained. Optional donations never unlock features, and no account is required.
        </p>
      </section>

      <button className="secondary-button settings-save-button" type="button" onClick={onRunSetup}>
        Run setup again
      </button>
      {callGuard.isNativeAndroid && (
        <button className="secondary-button settings-save-button" type="button" onClick={() => callGuard.openAppSettings()}>
          <Settings size={18} /> Open Android settings
        </button>
      )}
    </div>
  );
}
