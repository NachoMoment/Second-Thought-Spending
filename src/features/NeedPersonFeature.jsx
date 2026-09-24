import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  MessageCircle,
  Pencil,
  PhoneCall,
  Shield,
  Users,
} from 'lucide-react';
import { loadSafeContacts } from '../native/safeContactsStore';

const SUPPORT_MESSAGES = [
  'I’m having a hard time and could use someone to stay with me for a few minutes.',
  'I don’t need advice right now—just some company.',
  'Can you check in with me in 15 minutes?',
  'I used and I need someone safe to know.',
];

function getPhoneLinkValue(phone) {
  return phone.replace(/[^\d+*#,;]/g, '');
}

function getInitial(name) {
  return name.trim().charAt(0).toUpperCase() || '?';
}

export function NeedPersonFeature({ onManageContacts }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(SUPPORT_MESSAGES[0]);

  useEffect(() => {
    let active = true;

    loadSafeContacts()
      .then((storedContacts) => {
        if (active) {
          setContacts(storedContacts);
        }
      })
      .catch(() => {
        if (active) {
          setMessage('Your safe contacts could not be loaded right now.');
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

  if (loading) {
    return (
      <div className="feature-loading" role="status">
        <Users size={25} />
        <span>Gathering your safe contacts…</span>
      </div>
    );
  }

  return (
    <div className="support-panel">
      <p className="feature-intro">
        You do not need the perfect words. Choose one person and make the next
        step as small as possible.
      </p>

      {message && (
        <div className="setup-message" role="status">
          <AlertCircle size={17} />
          <span>{message}</span>
        </div>
      )}

      {contacts.length === 0 ? (
        <div className="support-empty">
          <div className="support-empty-icon">
            <Shield size={28} />
          </div>
          <strong>Your safe-contact list is empty.</strong>
          <p>
            Add one person you would feel comfortable calling or texting during
            a hard moment.
          </p>
          <button className="primary-button support-button" type="button" onClick={onManageContacts}>
            <Users size={18} />
            <span>Add a safe contact</span>
          </button>
        </div>
      ) : (
        <>
          <section className="message-starters" aria-labelledby="message-starters-title">
            <div className="feature-section-heading">
              <strong id="message-starters-title">What would help them know?</strong>
              <span>The message can be edited before you send it.</span>
            </div>
            <div className="message-starter-list">
              {SUPPORT_MESSAGES.map((supportMessage) => (
                <button
                  className={selectedMessage === supportMessage ? 'selected' : ''}
                  type="button"
                  aria-pressed={selectedMessage === supportMessage}
                  key={supportMessage}
                  onClick={() => setSelectedMessage(supportMessage)}
                >
                  {supportMessage}
                </button>
              ))}
            </div>
          </section>

          <div className="support-contact-list" aria-label="People you can reach">
            {contacts.map((contact) => {
              const phone = getPhoneLinkValue(contact.phone);
              const textHref = `sms:${phone}?body=${encodeURIComponent(selectedMessage)}`;

              return (
                <article className="support-contact-card" key={contact.id}>
                  <div className="support-contact-identity">
                    <div className="support-avatar" aria-hidden="true">
                      {getInitial(contact.name)}
                    </div>
                    <div>
                      <strong>{contact.name}</strong>
                      {contact.relationship && <span>{contact.relationship}</span>}
                    </div>
                  </div>
                  <div className="support-contact-actions">
                    <a href={`tel:${phone}`} aria-label={`Call ${contact.name}`}>
                      <PhoneCall size={18} />
                      <span>Call</span>
                    </a>
                    <a href={textHref} aria-label={`Text ${contact.name}`}>
                      <MessageCircle size={18} />
                      <span>Text</span>
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          <button className="text-button support-manage-button" type="button" onClick={onManageContacts}>
            <Pencil size={16} />
            <span>Edit safe contacts</span>
          </button>
        </>
      )}

      <div className="outside-support">
        <strong>Need support beyond your list?</strong>
        <p>Call or text 988 for immediate crisis support in the United States.</p>
        <div>
          <a href="tel:988">Call 988</a>
          <a href="sms:988">Text 988</a>
        </div>
      </div>
    </div>
  );
}
