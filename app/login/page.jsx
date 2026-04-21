'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiBaseUrl, authTokenKey, getDashboardPath } from '@/lib/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || 'Anmeldung fehlgeschlagen.');
        return;
      }

      if (!data.token) {
        setError('Token fehlt in der Serverantwort.');
        return;
      }

      localStorage.setItem(authTokenKey, data.token);
      router.push(getDashboardPath(data.user?.role));
    } catch {
      setError('API nicht erreichbar. Bitte Backend starten und erneut versuchen.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="shell authShell">
      <section className="authCard">
        <p className="eyebrow">Anmeldung</p>
        <h1>Login mit API-Token</h1>
        <p className="intro compact">
          Diese Seite nutzt direkt den Endpoint <strong>/api/auth/login</strong> und speichert das JWT lokal
          im Browser.
        </p>

        <form className="authForm" onSubmit={onSubmit}>
          <label className="inputLabel" htmlFor="login-email">
            E-Mail
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            className="inputField"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label className="inputLabel" htmlFor="login-password">
            Passwort
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            className="inputField"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          {error ? <p className="errorText">{error}</p> : null}

          <button className="actionButton full" type="submit" disabled={submitting}>
            {submitting ? 'Anmeldung läuft…' : 'Jetzt einloggen'}
          </button>
        </form>

        <div className="linkRow">
          <a href="/register">Noch kein Konto? Registrieren</a>
          <a href="/">Zur Startseite</a>
          <a href="/me">Geschützte Ansicht testen</a>
        </div>
      </section>
    </main>
  );
}