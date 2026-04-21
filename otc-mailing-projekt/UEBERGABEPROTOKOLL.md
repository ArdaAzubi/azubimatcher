# Uebergabeprotokoll

Stand: 11.04.2026

## Kurzstatus

- Rechtstexte wurden getrennt: `nutzungsbedingungen.html` und `datenschutzerklaerung.html` sind jetzt eigenstaendig und auf AzubiMatch bezogen.
- Eine zentrale Privatsphaere- und Cookie-Oberflaeche wurde ueber `privacy-settings.js` eingefuehrt.
- Admin-, Auth- und Loeschpfade wurden gehaertet und browserseitig geprueft.

## Datenschutz und Privatsphaere

- Consent-Links in Registrierung und oeffentlichen Bereichen verweisen getrennt auf Datenschutz und Nutzungsbedingungen.
- Es gibt keine Analyse- oder Marketing-Cookies; sichtbar dokumentiert und steuerbar ist jetzt vor allem die technisch notwendige Browser-Speicherung.
- Nutzer- und Firmen-Logins koennen ueber die Privatsphaere-Einstellung nur fuer die laufende Sitzung oder browseruebergreifend gespeichert werden.
- Oeffentliche Seiten haben sichtbare Links zu "Privatsphaere & Cookies" in Navigation und/oder Footer.

## Auth und Admin

- Nutzerpasswoerter und Verifizierungscodes laufen ueber gehashte Secret-Records mit Legacy-Migration.
- Bewerbende und Firmen koennen Passwoerter jetzt ueber einen Reset-Code neu setzen; der Code wird in der aktuellen Demo als lokaler Mail-Preview-Eintrag erzeugt.
- Nutzer-Sessions sind zeitlich begrenzt; Admin-Sessions laufen tab-/sitzungsbasiert ueber `sessionStorage`.
- Admin-Zugang arbeitet ohne hart codiertes Passwort. Das Admin-Passwort wird browserlokal eingerichtet.
- `admin.html` bietet einen sichtbaren lokalen Reset fuer den Admin-Zugang.
- `admin.html` enthaelt jetzt auch die fruehere Nutzerverwaltung als eigenen Admin-Tab und zeigt dort bewusst nur reduzierte, nicht geheime Felder an.

## Datenbereinigung und Loeschung

- Konto- und Registrierungsloeschungen bereinigen jetzt auch verknuepfte Nebenstores und Legacy-Eintraege.
- Dazu gehoeren unter anderem Nachrichten, Kontaktanfragen, Mail-Previews, Lebenslaeufe und alte Browserreste.

## Verifikation

- Die kombinierte Smoke-Suite unter `.tmp_authflows/auth_flows_smoke.mjs` ist in den Standard-Check uebernommen.
- Der Lauf war zuletzt komplett gruen fuer Registrierung, Passwort-Reset, Passwort-/Logout-Flows, Inklusionsangaben, Admin-Matching, Deep-Linking und Loeschpfade.

## Offene Punkte vor Live-Betrieb

- Pflichtangaben zu Betreiber, Anschrift und Datenschutzkontakt in den Rechtstexten final ergaenzen.
- Einwilligungslogik fuer sensible Angaben rechtlich und fachlich final pruefen.
- Browser-lokale Datenspeicherung fuer einen echten Produktivbetrieb erneut bewerten und nach Moeglichkeit serverseitig absichern.