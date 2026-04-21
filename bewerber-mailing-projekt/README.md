# Bewerber-Mailing-Projekt für AzubiMatch

Dieses Verzeichnis ist ein eigenständiges Miniprojekt für die Vorstellung von AzubiMatch gegenüber Bewerbenden. Es ist bewusst von der Website getrennt und verwendet keine relativen Website-Pfade.

## Enthaltene Dateien

- `praesentation.html`
  - 4-seitige HTML-Präsentation
  - im Browser präsentierbar oder als PDF druckbar
  - mit Presenter-Leiste, Folien-Sprungnavigation und Pfeiltastensteuerung
- `mail-template.html`
  - HTML-Mail für Newsletter- oder Mailing-Tools
- `mail-template.txt`
  - Textversion als Fallback
- `README.md`
  - diese Projektbeschreibung

## Vor dem Einsatz anpassen

1. Die Links verweisen bereits auf den Livepfad `/bewerber/` aus dem aktuellen WordPress-Export.
2. Betreff, Anrede und Grundtexte sind bereits auf AzubiMatch zugeschnitten.
3. Voreingestellte Absenderrolle ist `AzubiMatch | Bewerbendenservice`; bei Bedarf nur Feindetails für euren Versand anpassen.
4. Für den Mailversand die HTML-Datei in euer Tool übernehmen oder die TXT-Version nutzen.

## Nutzung

- `praesentation.html` im Browser öffnen.
- Mit `Pfeil links/rechts`, `Page Up/Page Down`, `Home` und `Ende` zwischen den Folien wechseln.
- `mail-template.html` in ein Versandtool kopieren.
- `mail-template.txt` nutzen, wenn nur reiner Text möglich ist.
