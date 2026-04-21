'use client';

import { useEffect, useState } from 'react';
import { apiBaseUrl, authTokenKey, getDashboardPath } from '@/lib/auth-client';

export default function MePage() {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const token = localStorage.getItem(authTokenKey);
      if (!token) {
        if (active) {
          setStatus('missing-token');
        }
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (active) {
            setStatus('error');
            setError(data.error || 'Benutzerdaten konnten nicht geladen werden.');
          }
          return;
        }

        if (active) {
          setUser(data.user || null);
          setStatus('ready');
        }
      } catch {
        if (active) {
          setStatus('error');
          setError('API nicht erreichbar.');
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const onLogout = () => {
    localStorage.removeItem(authTokenKey);
    setUser(null);
    setStatus('missing-token');
    setError('');
  };

  return (
    <main className="shell authShell">
      <section className="authCard">
        <p className="eyebrow">Geschützte Route</p>
        <h1>Benutzerprofil aus /api/auth/me</h1>

        {status === 'loading' ? <p className="intro compact">Lade Benutzerdaten…</p> : null}

        {status === 'missing-token' ? (
          <p className="errorText">
            Kein Token gefunden. Bitte zuerst über <a href="/login">/login</a> anmelden oder über{' '}
            <a href="/register">/register</a> ein Konto anlegen.
          </p>
        ) : null}

        {status === 'error' ? <p className="errorText">{error}</p> : null}

        {status === 'ready' && user ? (
          <div className="profileGrid">
            <div className="profileItem">
              <span>ID</span>
              <strong>{user.id}</strong>
            </div>
            <div className="profileItem">
              <span>E-Mail</span>
              <strong>{user.email}</strong>
            </div>
            <div className="profileItem">
              <span>Rolle</span>
              <strong>{user.role}</strong>
            </div>
          </div>
        ) : null}

        <div className="actionsRow">
          {status === 'ready' && user ? (
            <a className="actionButton" href={getDashboardPath(user.role)}>
              Zum Dashboard
            </a>
          ) : null}
          <a className="actionGhost" href="/">
            Zur Startseite
          </a>
          <button type="button" className="actionButton" onClick={onLogout}>
            Token löschen
          </button>
        </div>
      </section>
    </main>
  );
}