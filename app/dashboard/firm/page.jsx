'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiBaseUrl, authTokenKey, getDashboardPath } from '@/lib/auth-client';

const profileFields = [
  { label: 'Firmenname', valueKey: 'firmenname', fallback: 'Noch nicht hinterlegt' },
  { label: 'Stadt', valueKey: 'stadt', fallback: 'Noch nicht hinterlegt' },
  { label: 'PLZ', valueKey: 'plz', fallback: 'Noch nicht hinterlegt' },
  { label: 'Branche', valueKey: 'branche', fallback: 'Noch nicht hinterlegt' },
  { label: 'Ausbildungsberufe', valueKey: 'ausbildungsberufe', fallback: 'Noch nicht hinterlegt' },
  { label: 'Match-Umkreis', valueKey: 'match_umkreis', suffix: ' km', fallback: '25 km' },
];

export default function FirmDashboardPage() {
  const router = useRouter();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const token = localStorage.getItem(authTokenKey);
      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const meResponse = await fetch(`${apiBaseUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const meData = await meResponse.json().catch(() => ({}));

        if (!meResponse.ok || !meData.user) {
          localStorage.removeItem(authTokenKey);
          router.replace('/login');
          return;
        }

        if (meData.user.role !== 'firm') {
          router.replace(getDashboardPath(meData.user.role));
          return;
        }

        const profileResponse = await fetch(`${apiBaseUrl}/api/firm/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = await profileResponse.json().catch(() => ({}));

        if (!profileResponse.ok) {
          if (active) {
            setStatus('error');
            setError(profileData.error || 'Unternehmensprofil konnte nicht geladen werden.');
          }
          return;
        }

        if (active) {
          setUser(meData.user);
          setProfile(profileData.profile || null);
          setStatus('ready');
        }
      } catch {
        if (active) {
          setStatus('error');
          setError('API nicht erreichbar. Bitte Backend starten und erneut versuchen.');
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [router]);

  const onLogout = () => {
    localStorage.removeItem(authTokenKey);
    router.replace('/login');
  };

  return (
    <main className="shell dashboardShell">
      <section className="dashboardHero">
        <p className="eyebrow">Unternehmens-Dashboard</p>
        <h1>Dein Ausbildungsangebot auf einen Blick</h1>
        <p className="intro compact">
          Hier landet der Firmen-Flow jetzt direkt nach Login oder Registrierung. Die Daten kommen aus
          <strong> /api/firm/profile</strong>.
        </p>

        {status === 'loading' ? <p className="helperText">Lade Dashboard…</p> : null}
        {status === 'error' ? <p className="errorText">{error}</p> : null}

        {status === 'ready' && user ? (
          <div className="dashboardMeta">
            <div className="statusCard">
              <span className="label">E-Mail</span>
              <strong>{user.email}</strong>
            </div>
            <div className="statusCard">
              <span className="label">Rolle</span>
              <strong>Unternehmen</strong>
            </div>
          </div>
        ) : null}

        <div className="actionsRow">
          <a className="actionGhost" href="/me">
            Benutzeransicht öffnen
          </a>
          <a className="actionButton" href="/dashboard/firm/edit">
            Profil bearbeiten
          </a>
          <button type="button" className="actionGhost" onClick={onLogout}>
            Abmelden
          </button>
        </div>
      </section>

      {status === 'ready' ? (
        <section className="dashboardGrid">
          <article className="dataCard dataCardWide">
            <h2>Profilstatus</h2>
            {profile ? (
              <div className="stackList">
                {profileFields.map((field) => {
                  const rawValue = profile[field.valueKey];
                  const value = rawValue ? `${rawValue}${field.suffix || ''}` : field.fallback;
                  return (
                    <div key={field.valueKey} className="profileItem">
                      <span>{field.label}</span>
                      <strong>{value}</strong>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="emptyState">
                <h2>Profil noch leer</h2>
                <p>Trag jetzt eure Daten ein, damit Bewerber euer Unternehmen finden können.</p>
                <a className="actionButton" href="/dashboard/firm/edit">
                  Profil jetzt anlegen
                </a>
              </div>
            )}
          </article>

          <article className="dataCard">
            <h2>Nächste Umsetzung</h2>
            <ul className="stackListPlain">
              <li>Passende Bewerber als Vorschläge anzeigen</li>
              <li>Match-Einstellungen verfeinern</li>
              <li>Bewerbungseingang im Dashboard verwalten</li>
            </ul>
          </article>
        </section>
      ) : null}
    </main>
  );
}