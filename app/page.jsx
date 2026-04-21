const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3001';

const highlights = [
  'App Router ist aktiv',
  'Bestehende Express-API bleibt nutzbar',
  'Frontend kann schrittweise von den HTML-Seiten migriert werden',
];

export default async function HomePage() {
  let health = 'unbekannt';

  try {
    const response = await fetch(`${apiBaseUrl}/api/health`, {
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      health = data.status || 'ok';
    } else {
      health = `HTTP ${response.status}`;
    }
  } catch {
    health = 'API nicht erreichbar';
  }

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">AzubiMatch x Next.js</p>
        <h1>Das Frontend läuft jetzt auf einer eigenen Next.js-Basis.</h1>
        <p className="intro">
          Die bestehende Plattform bleibt intakt. Du kannst Seiten jetzt schrittweise in den App Router
          überführen und parallel weiter gegen die lokale Express-API entwickeln.
        </p>
        <div className="actionsRow">
          <a className="actionButton" href="/register">
            Registrierung im Next-Frontend
          </a>
          <a className="actionGhost" href="/login">
            Login im Next-Frontend
          </a>
          <a className="actionGhost" href="/me">
            Geschützte Benutzeransicht öffnen
          </a>
        </div>
        <div className="statusRow">
          <div className="statusCard">
            <span className="label">API-Status</span>
            <strong>{health}</strong>
          </div>
          <div className="statusCard">
            <span className="label">API-Basis</span>
            <strong>{apiBaseUrl}</strong>
          </div>
        </div>
      </section>

      <section className="grid">
        {highlights.map((item) => (
          <article key={item} className="panel">
            <span className="dot" />
            <p>{item}</p>
          </article>
        ))}
      </section>

      <section className="panel roadmap">
        <h2>Nächste sinnvolle Migrationen</h2>
        <ol>
          <li>Anmeldung und Registrierung als Next-Routen mit Formular-Validierung übernehmen.</li>
          <li>Bewerber- und Firmenprofil als geschützte Dashboard-Seiten aufbauen.</li>
          <li>Legacy-HTML nur noch für WordPress-/Export-Pfade separat weiterführen.</li>
        </ol>
      </section>
    </main>
  );
}