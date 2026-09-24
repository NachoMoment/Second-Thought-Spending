import React from 'react';
import {
  ExternalLink,
  HeartHandshake,
  MessageCircleMore,
  MessagesSquare,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { COMMUNITY_CONFIG } from '../config/communityConfig';

const roadmapItems = [
  {
    icon: UsersRoadmapIcon,
    title: 'Groups, handled with care',
    status: 'Planned',
    copy: 'Find or connect with well-moderated support communities without Second Thought operating a database of private group conversations.',
  },
  {
    icon: MessageCircleMore,
    title: 'Text-message intercepts',
    status: 'Research',
    copy: 'Explore an Android-supported pause before risky outgoing texts without reading, uploading, or retaining the message itself.',
  },
  {
    icon: ShieldCheck,
    title: 'Signed, dependable releases',
    status: 'Next',
    copy: 'A stable signing and download process so updates can preserve private on-device data safely.',
  },
  {
    icon: Smartphone,
    title: 'More phones, more confidence',
    status: 'Ongoing',
    copy: 'Broader Android device, navigation-bar, accessibility, and real-world reliability testing.',
  },
  {
    icon: Sparkles,
    title: 'Gentler polish',
    status: 'Ongoing',
    copy: 'Accessibility improvements, translations, clearer onboarding, and thoughtful refinements based on user feedback.',
  },
];

function UsersRoadmapIcon(props) {
  return <MessagesSquare {...props} />;
}

export function SupportProjectFeature() {
  const donationReady = COMMUNITY_CONFIG.donationUrl.startsWith('https://');

  return (
    <div className="project-support-panel">
      <section className="support-hero-card">
        <span className="support-hero-icon"><HeartHandshake size={31} /></span>
        <div>
          <strong>Help grow the pause</strong>
          <p>
            Second Thought is free to use. If it helps and you want to support
            what comes next, an optional donation can help fund the work.
          </p>
        </div>
      </section>

      <section className="about-card donation-card">
        <h2>Support Second Thought</h2>
        <p>
          Donations help with test devices, release signing and distribution,
          documentation, accessibility work, and careful development of future
          features. They never unlock features or change the support you receive.
        </p>
        {donationReady ? (
          <a
            className="donation-button"
            href={COMMUNITY_CONFIG.donationUrl}
            target="_blank"
            rel="noreferrer"
          >
            Donate through {COMMUNITY_CONFIG.donationProvider}
            <ExternalLink size={18} />
          </a>
        ) : (
          <div className="donation-setup-note">
            <strong>Donation page setup is the final connection.</strong>
            <span>
              The maintainer can activate this button by adding the public
              {` ${COMMUNITY_CONFIG.donationProvider} `}page URL in the project config.
            </span>
          </div>
        )}
        <small className="donation-fine-print">
          Donations are voluntary and are not payment for medical care,
          counseling, crisis response, or guaranteed development work.
        </small>
      </section>

      <section className="about-card">
        <h2>What support can help build</h2>
        <div className="roadmap-list">
          {roadmapItems.map(({ icon: Icon, title, status, copy }) => (
            <article className="roadmap-item" key={title}>
              <Icon size={20} />
              <div>
                <span><strong>{title}</strong><small>{status}</small></span>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="about-card privacy-promise-card">
        <ShieldCheck size={24} />
        <div>
          <h2>The promise does not change</h2>
          <p>
            Second Thought will not collect or store your recovery data on a
            maintainer-owned server—whether the app is free, donation-supported,
            or proprietary. Information needed by the app stays encrypted on
            your device. The external donation provider receives only the
            information involved in the donation under its own privacy policy.
          </p>
        </div>
      </section>
    </div>
  );
}
