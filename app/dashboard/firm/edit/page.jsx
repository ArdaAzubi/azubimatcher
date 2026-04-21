'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiBaseUrl, authTokenKey } from '@/lib/auth-client';

export default function FirmEditPage() {
  const router = useRouter();
  const [status, setStatus] = useState('loading');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [saveError, setSaveError] = useState('');
  const [form, setForm] = useState({
    firmenname: '',
    stadt: '',
    plz: '',
    branche: '',
    ausbildungsberufe: '',
    match_umkreis: '25',
    beschreibung: '',
    website: '',
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

        if (!meRes.ok || meData.user?.role !== 'firm') {
          router.replace('/login');
          return;
        }

        const profileRes = await fetch(`${apiBaseUrl}/api/firm/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = await profileRes.json().catch(() => ({}));

        if (profileData.profile) {
          const p = profileData.profile;
          setForm({
            firmenname: p.firmenname ?? '',
            stadt: p.stadt ?? '',
            plz: p.plz ?? '',
            branche: p.branche ?? '',
            ausbildungsberufe: p.ausbildungsberufe ?? '',
            match_umkreis: String(p.match_umkreis ?? 25),
            beschreibung: p.beschreibung ?? '',
            website: p.website ?? '',
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
      const res = await fetch(`${apiBaseUrl}/api/firm/profile`, {
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
      setTimeout(() => router.push('/dashboard/firm'), 1200);
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
        <a className="actionGhost" href="/dashboard/firm">
          Zurück zum Dashboard
        </a>
      </main>
    );
  }

  return (
    <main className="shell authCard">
      <p className="eyebrow">Unternehmens-Profil</p>
      <h1>Profil bearbeiten</h1>
      <p className="helperText">Alle Felder sind optional. Vollständige Angaben verbessern euer Matching.</p>

      <form onSubmit={onSubmit} className="authForm" noValidate>
        <div className="formGroup">
          <label className="inputLabel" htmlFor="firmenname">
            Firmenname
          </label>
          <input
            id="firmenname"
            name="firmenname"
            type="text"
            className="inputControl"
            value={form.firmenname}
            onChange={onChange}
            autoComplete="organization"
            maxLength={200}
          />
        </div>

        <div className="inputRow">
          <div className="formGroup">
            <label className="inputLabel" htmlFor="stadt">
              Standort
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
          <label className="inputLabel" htmlFor="branche">
            Branche
          </label>
          <input
            id="branche"
            name="branche"
            type="text"
            className="inputControl"
            value={form.branche}
            onChange={onChange}
            placeholder="z. B. Handel, Handwerk, IT, Pflege"
            maxLength={200}
          />
        </div>

        <div className="formGroup">
          <label className="inputLabel" htmlFor="ausbildungsberufe">
            Ausbildungsberufe
          </label>
          <textarea
            id="ausbildungsberufe"
            name="ausbildungsberufe"
            className="inputControl inputTextarea"
            value={form.ausbildungsberufe}
            onChange={onChange}
            rows={3}
            placeholder="z. B. Kaufmann/-frau im Einzelhandel, Fachinformatiker/-in"
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
          <label className="inputLabel" htmlFor="beschreibung">
            Unternehmensbeschreibung
          </label>
          <textarea
            id="beschreibung"
            name="beschreibung"
            className="inputControl inputTextarea"
            value={form.beschreibung}
            onChange={onChange}
            rows={4}
            placeholder="Kurze Vorstellung des Unternehmens"
            maxLength={2000}
          />
        </div>

        <div className="formGroup">
          <label className="inputLabel" htmlFor="website">
            Website
          </label>
          <input
            id="website"
            name="website"
            type="url"
            className="inputControl"
            value={form.website}
            onChange={onChange}
            placeholder="https://www.beispiel.de"
            maxLength={500}
          />
        </div>

        {saveStatus === 'error' && <p className="errorText">{saveError}</p>}
        {saveStatus === 'success' && (
          <p className="successText">Profil gespeichert. Weiterleitung…</p>
        )}

        <div className="actionsRow">
          <a className="actionGhost" href="/dashboard/firm">
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
