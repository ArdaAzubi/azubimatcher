# Partner-Mailing-Projekt für AzubiMatch

Dieses Verzeichnis ist ein eigenständiges Miniprojekt für die Vorstellung von AzubiMatch gegenüber Schulen, Jobcentern und Trägern. Es ist bewusst von der Website getrennt und verwendet keine relativen Website-Pfade.

## Enthaltene Dateien

- `praesentation.html`
  - 4-seitige HTML-Präsentation
  - im Browser präsentierbar oder als PDF druckbar
  - mit Presenter-Leiste, Folien-Sprungnavigation und Pfeiltastensteuerung
- `mail-template.html`
  - HTML-Mail für Partneransprache, Netzwerkarbeit oder Mailing-Tools
- `mail-template.txt`
  - Textversion als Fallback
- `praesentation-schule.html`, `mail-template-schule.html`, `mail-template-schule.txt`
  - zugeschnitten auf Schulen, Lehrkräfte und schulische Berufsorientierung
- `praesentation-jobcenter.html`, `mail-template-jobcenter.html`, `mail-template-jobcenter.txt`
  - zugeschnitten auf Jobcenter, Vermittlung und Fallmanagement
- `praesentation-traeger.html`, `mail-template-traeger.html`, `mail-template-traeger.txt`
  - zugeschnitten auf Bildungsträger, Coaching und Übergangsbegleitung
- `README.md`
  - diese Projektbeschreibung

## Vor dem Einsatz anpassen

1. Die Links verweisen bereits auf den Livepfad `/home/` aus dem aktuellen WordPress-Export, da es aktuell keine separate Partner-Landingpage im Workspace gibt.
2. Betreff, Anrede und Grundtexte sind bereits auf AzubiMatch zugeschnitten.
3. Voreingestellte Absenderrolle ist `AzubiMatch | Partnerkommunikation`; die separaten Varianten nutzen zusätzlich `Schulkooperationen`, `Netzwerk & Vermittlung` und `Bildungspartnerschaften`.
4. Für den Mailversand die HTML-Datei in Ihr Tool übernehmen oder die TXT-Version nutzen.

## Nutzung

- `praesentation.html` im Browser öffnen.
- Mit `Pfeil links/rechts`, `Page Up/Page Down`, `Home` und `Ende` zwischen den Folien wechseln.
- `mail-template.html` in ein Versandtool kopieren.
- `mail-template.txt` nutzen, wenn nur reiner Text möglich ist.
- Für adressatenspezifische Ansprache die passenden Dateien für Schule, Jobcenter oder Träger verwenden.