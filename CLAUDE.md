# Website Praxis Carina Schönfeld – Pflegeanleitung (für KI & Menschen)

Statische One-Page-Website für die Praxis für Psychotherapie Carina Schönfeld, Darmstadt.
Bewusst **ohne Build-Tool, ohne Framework, ohne Datenbank**: Jede Änderung ist eine direkte Bearbeitung der Dateien.

## Struktur

```
index.html                    ← die gesamte Seite (alle Inhalte)
impressum/index.html          ← Impressum (URL /impressum/ wie auf der alten Seite)
datenschutzerklarung/index.html
404.html
kontakt.php                   ← Formular-Versand per E-Mail (PHP ≥ 8.1, z. B. STRATO)
.htaccess                     ← HTTPS, 301-Weiterleitungen alter URLs, Caching, Security-Header
robots.txt, sitemap.xml
assets/css/styles.css         ← Design; Farben/Abstände als Variablen in :root
assets/js/main.js             ← Menü, Akkordeon-Anker, Formular, Einblendungen
assets/img/                   ← Fotos (WebP + JPG in 440/660/860 px)
assets/illustrations/         ← handgezeichnete SVG-Illustrationen + Favicon
assets/fonts/                 ← EB Garamond (Überschriften) & DM Sans (Text), lokal gehostet (DSGVO: kein Google-CDN)
assets/downloads/             ← PDFs für Patient*innen
```

## Abschnitte in index.html (Anker-IDs)

`#ueber-mich` · `#therapieangebot` (inkl. `#gruppentherapie`) · `#ablauf` · `#kosten` (inkl. `#unterlagen`) · `#faq` · `#kontakt` · `#notfall`

Jeder Abschnitt ist mit einem Kommentar `<!-- ============ NAME ============ -->` markiert.

## Regeln beim Ändern

- **Kontaktdaten/Öffnungszeiten kommen mehrfach vor.** Bei Änderung überall anpassen:
  Hero, Kontakt-Abschnitt, Footer, JSON-LD im `<head>`, Impressum, Datenschutz.
  Suche z. B. nach `1304085`, `07:00`, `Elisabethenstraße`.
- **FAQ doppelt pflegen:** Jede Frage steht sichtbar im `#faq`-Abschnitt UND als `FAQPage` im JSON-LD. Beides muss übereinstimmen.
- **Längere Texte gehören in Akkordeons** (`<details class="acc"><summary><h3>…</h3></summary><div class="acc-body">…</div></details>`). Inhalte darin werden von Google indexiert.
- **Genau eine `<h1>`** (Hero). Abschnitte nutzen `<h2>`, Unterpunkte `<h3>`/`<h4>`.
- Wichtige Suchbegriffe: „Psychotherapie Darmstadt“, „tiefenpsychologisch fundierte Psychotherapie“, „Psychotherapeutin Darmstadt“, „Erstgespräch“, „Gruppentherapie“. Natürlich einbauen, nicht stapeln.
- Neue Fotos: in 440/660/860 px Breite als `.webp` und `.jpg` ablegen, sprechende Dateinamen (`…-darmstadt-…`), immer `width`/`height` und `alt` setzen; unterhalb des sichtbaren Bereichs `loading="lazy"`.
- Nach inhaltlichen Änderungen `<lastmod>` in `sitemap.xml` aktualisieren.
- Keine externen Skripte, Fonts, Karten oder Tracker einbinden. Sonst wird ein Cookie-Banner nötig und die Datenschutzerklärung muss angepasst werden.
- **Nur relative Pfade** (`assets/…`, in Unterordnern `../assets/…`), nie `/assets/…`, damit die Seite auch unter GitHub Pages im Unterordner funktioniert.

## Designsprache

Wunsch der Kundin: **clean, ruhig, minimalistisch, Naturtöne & Materialien (Holz, Stein)**, nicht verspielt, nicht bunt, kein „Vanille“-Creme.
- Farben nur über die Variablen in `:root` (Steinweiß, Stein, Holz/Walnuss, Moos). Keine Pastellfarben, keine neuen Akzentfarben.
- Haarlinien statt Schatten, kleine Radien (6px, Buttons 3px), viel Weißraum. Keine Wellen, Blobs, Kursiv- oder Pinsel-Effekte.
- Rostrot (`--alert`) nur für den Notfall-Bereich.

## Illustrationsstil

Tuschelinie `#2b3533`, `stroke-width` 2–2.4, runde Enden; Flächen leicht versetzt dahinter (`transform="translate(3–6 3–5)"`).
Flächenfarben nur aus Stein/Holz/Moos: `#e7e3dc`, `#ddd8cf`, `#e4e1db`, `#dcdcd6`, `#e6dccf`, `#e6dccb`, `#d8c8b4`, Pflanzen `#b8b59d`.
Kein Wackel-Filter (`feDisplacementMap`): Er zerfasert die Linien auf Retina-Displays.

## Lokal ansehen

```
python3 -m http.server 8000   # dann http://localhost:8000
```
(Das Formular funktioniert nur auf einem Server mit PHP.)

## Deployment

Alle Dateien per FTP/SFTP in das Webroot des Hosters (STRATO) laden. In `kontakt.php` ggf. `SENDER` auf eine existierende Adresse der Domain setzen.

## Passwortgeschützte Vorschau (`docs/`)

`docs/` ist eine **generierte**, verschlüsselte Kopie der Seite für die Kunden-Vorschau (GitHub Pages: Branch `main`, Ordner `/docs`; Netlify: Publish directory `docs`).
Nie direkt in `docs/` arbeiten. Nach jeder Änderung neu bauen:

```
PREVIEW_PASSWORD='…' node scripts/build-preview.mjs
```

Das Passwort wird nirgends im Repo gespeichert. HTML ist AES-verschlüsselt und hat `noindex`; Bilder/PDFs in `docs/assets` sind nicht verschlüsselt.
Für den Livegang auf der echten Domain die Dateien aus dem Hauptordner hochladen (ohne `docs/`, `scripts/`).
