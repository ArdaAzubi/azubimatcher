'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiBaseUrl, authTokenKey } from '@/lib/auth-client';

const SCHULABSCHLUSS_OPTIONS = [
  '',
  'Kein Abschluss',
  'Hauptschulabschluss',
  'Mittlere Reife',
  'Fachhochschulreife',
  'Abitur',
];

export default function StudentEditPage() {
  const router = useRouter();
  const [status, setStatus] = useState('loading');
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | success | error
  const [saveError, setSaveError] = useState('');
  const [form, setForm] = useState({
    name: '',
    stadt: '',
    plz: '',
    schulabschluss: '',
    beruf: '',
    match_umkreis: '25',
    sprachen: '',
    hinweis: '',
  });

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem(authTokenKey);
      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const meRes = await fetch(`${apiBaseUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const meData = await meRes.json().catch(() => ({}));

        if (!meRes.ok || meData.user?.role !== 'student') {
          router.replace('/login');
          return;
        }

        const profileRes = await fetch(`${apiBaseUrl}/api/student/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = await profileRes.json().catch(() => ({}));

        if (profileData.profile) {
          const p = profileData.profile;
          setForm({
            name: p.name ?? '',
            stadt: p.stadt ?? '',
            plz: p.plz ?? '',
            schulabschluss: p.schulabschluss ?? '',
            beruf: p.beruf ?? '',
            match_umkreis: String(p.match_umkreis ?? 25),
            sprachen: p.sprachen ?? '',
            hinweis: p.hinweis ?? '',
          });
        }

        setStatus('ready');
      } catch {
        setStatus('error');
      }
    };

    load();
  }, [router]);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus('saving');
    setSaveError('');

    const token = localStorage.getItem(authTokenKey);
    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/student/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          match_umkreis: parseInt(form.match_umkreis, 10) || 25,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSaveStatus('error');
        setSaveError(data.error || 'Profil konnte nicht gespeichert werden.');
        return;
      }

      setSaveStatus('success');
      setTimeout(() => router.push('/dashboard/student'), 1200);
    } catch {
      setSaveStatus('error');
      setSaveError('API nicht erreichbar. Bitte Backend starten und erneut versuchen.');
    }
  };

  if (status === 'loading') {
    return (
      <main className="shell authCard">
        <p className="helperText">Lade Profildaten…</p>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="shell authCard">
        <p className="errorText">Profil konnte nicht geladen werden. Bitte erneut versuchen.</p>
        <a className="actionGhost" href="/dashboard/student">
          Zurück zum Dashboard
        </a>
      </main>
    );
  }

  return (
    <main className="shell authCard">
      <p className="eyebrow">Bewerber-Profil</p>
      <h1>Profil bearbeiten</h1>
      <p className="helperText">Alle Felder sind optional. Deine Angaben helfen beim Matching.</p>

      <form onSubmit={onSubmit} className="authForm" noValidate>
        <div className="formGroup">
          <label className="inputLabel" htmlFor="name">
            Vollständiger Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className="inputControl"
            value={form.name}
            onChange={onChange}
            autoComplete="name"
            maxLength={200}
          />
        </div>

        <div className="inputRow">
          <div className="formGroup">
            <label className="inputLabel" htmlFor="stadt">
              Wohnort
            </label>
            <input
              id="stadt"
              name="stadt"
              type="text"
              className="inputControl"
              value={form.stadt}
              onChange={onChange}
              autoComplete="address-level2"
              maxLength={200}
            />
          </div>
          <div className="formGroup formGroupNarrow">
            <label className="inputLabel" htmlFor="plz">
              PLZ
            </label>
            <input
              id="plz"
              name="plz"
              type="text"
              className="inputControl"
              value={form.plz}
              onChange={onChange}
              autoComplete="postal-code"
              maxLength={10}
              inputMode="numeric"
            />
          </div>
        </div>

        <div className="formGroup">
          <label className="inputLabel" htmlFor="schulabschluss">
            Schulabschluss
          </label>
          <select
            id="schulabschluss"
            name="schulabschluss"
            className="inputControl"
            value={form.schulabschluss}
            onChange={onChange}
          >
            {SCHULABSCHLUSS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt || '— Bitte auswählen —'}
              </option>
            ))}
          </select>
        </div>

        <div className="formGroup">
          <label className="inputLabel" htmlFor="beruf">
            Berufswunsch
          </label>
          <input
            id="beruf"
            name="beruf"
            type="text"
            className="inputControl"
            value={form.beruf}
            onChange={onChange}
            placeholder="z. B. Kaufmann/-frau für Büromanagement"
            maxLength={200}
          />
        </div>

        <div className="formGroup">
          <label className="inputLabel" htmlFor="match_umkreis">
            Match-Umkreis: <strong>{form.match_umkreis} km</strong>
          </label>
          <input
            id="match_umkreis"
            name="match_umkreis"
            type="range"
            className="inputRange"
            min="5"
            max="100"
            step="5"
            value={form.match_umkreis}
            onChange={onChange}
          />
          <div className="rangeLabels">
            <span>5 km</span>
            <span>100 km</span>
          </div>
        </div>

        <div className="formGroup">
          <label className="inputLabel" htmlFor="sprachen">
            Sprachen
          </label>
          <input
            id="sprachen"
            name="sprachen"
            type="text"
            className="inputControl"
            value={form.sprachen}
            onChange={onChange}
            placeholder="z. B. Deutsch, Englisch, Türkisch"
            maxLength={300}
          />
        </div>

        <div className="formGroup">
          <label className="inputLabel" htmlFor="hinweis">
            Persönlicher Hinweis
          </label>
          <textarea
            id="hinweis"
            name="hinweis"
            className="inputControl inputTextarea"
            value={form.hinweis}
            onChange={onChange}
            rows={4}
            placeholder="Kurze Vorstellung, besondere Stärken o. ä."
            maxLength={1000}
          />
        </div>

        {saveStatus === 'error' && <p className="errorText">{saveError}</p>}
        {saveStatus === 'success' && (
          <p className="successText">Profil gespeichert. Weiterleitung…</p>
        )}

        <div className="actionsRow">
          <a className="actionGhost" href="/dashboard/student">
            Abbrechen
          </a>
          <button type="submit" className="actionButton" disabled={saveStatus === 'saving'}>
            {saveStatus === 'saving' ? 'Speichern…' : 'Profil speichern'}
          </button>
        </div>
      </form>
    </main>
  );
}
