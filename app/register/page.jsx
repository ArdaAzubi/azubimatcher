'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiBaseUrl, authTokenKey, getDashboardPath } from '@/lib/auth-client';

const roleOptions = [
  {
    value: 'student',
    title: 'Ich suche einen Ausbildungsplatz',
    description: 'Für Bewerberinnen und Bewerber, die ihr Profil anlegen und Matches erhalten möchten.',
  },
  {
    value: 'firm',
    title: 'Ich biete einen Ausbildungsplatz',
    description: 'Für Unternehmen, die Ausbildungsplätze veröffentlichen und passende Kandidaten finden möchten.',
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen haben.');
      setSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || 'Registrierung fehlgeschlagen.');
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
        <p className="eyebrow">Registrierung</p>
        <h1>Konto anlegen und direkt anmelden</h1>
        <p className="intro compact">
          Diese Seite nutzt den Endpoint <strong>/api/auth/register</strong> und speichert das JWT direkt nach
          erfolgreicher Registrierung im Browser.
        </p>

        <form className="authForm" onSubmit={onSubmit}>
          <fieldset className="roleFieldset">
            <legend className="inputLabel">Ich bin</legend>
            <div className="roleGrid">
              {roleOptions.map((option) => (
                <label
                  key={option.value}
                  className={`roleOption${role === option.value ? ' isActive' : ''}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={role === option.value}
                    onChange={(event) => setRole(event.target.value)}
                  />
                  <span className="roleTitle">{option.title}</span>
                  <span className="roleCopy">{option.description}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="inputLabel" htmlFor="register-email">
            E-Mail
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            className="inputField"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label className="inputLabel" htmlFor="register-password">
            Passwort
          </label>
          <input
            id="register-password"
            name="password"
            type="password"
            className="inputField"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
          <p className="helperText">Mindestens 6 Zeichen.</p>

          <label className="inputLabel" htmlFor="register-password-confirm">
            Passwort wiederholen
          </label>
          <input
            id="register-password-confirm"
            name="passwordConfirm"
            type="password"
            className="inputField"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />

          {error ? <p className="errorText">{error}</p> : null}

          <button className="actionButton full" type="submit" disabled={submitting}>
            {submitting ? 'Registrierung läuft…' : 'Konto erstellen'}
          </button>
        </form>

        <div className="linkRow">
          <a href="/login">Ich habe bereits ein Konto</a>
          <a href="/">Zur Startseite</a>
        </div>
      </section>
    </main>
  );
}