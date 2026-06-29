# Stadt · Land · Vollpfosten — Echtzeit-Multiplayer

Schnelles Reaktionsspiel für 2–8 Spieler:innen, jede:r am eigenen Gerät.
Pro Runde erscheinen bei allen gleichzeitig **Kategorie + Buchstabe**. Wer zuerst
ein Wort mit dem richtigen Anfangsbuchstaben abschickt, kriegt den Punkt.
Erster auf der Zielpunktzahl gewinnt. Live-Punktestand für alle.

Kontrolliert wird **nur der Anfangsbuchstabe** – ob «Berlin» wirklich eine Stadt
ist, entscheidet wie beim Papier-Spiel der Tisch (das Gewinnerwort wird allen
angezeigt).

## Stack

- **Frontend:** eine `index.html`, Vanilla JS, kein Build-Schritt.
- **Backend:** Vercel Serverless Functions in `/api` (Node, keine Dependencies).
- **Geteilter Zustand:** Upstash Redis (REST). Atomar entschiedener Gewinner pro
  Runde → fair, egal wie schnell die Geräte pollen.

## Lokal testen (ohne Upstash)

```bash
node dev-server.js        # -> http://localhost:3000
```

Ohne gesetzte ENV-Variablen läuft ein **In-Memory-Store** (nur im lokalen
Prozess). Mehrere Browser-Tabs öffnen, Spiel erstellen, Spieler-Links in andere
Tabs kopieren → durchspielen.

> Wichtig: In-Memory funktioniert **nur lokal**. Auf Vercel sind die Funktionen
> zustandslos – dort wird Upstash gebraucht (siehe unten).

Logik-Test:

```bash
node test.js
```

## Deploy auf Vercel (5 Minuten)

1. **Repo zu GitHub pushen.**

   ```bash
   git init && git add . && git commit -m "init"
   git branch -M main
   git remote add origin <DEIN-REPO>
   git push -u origin main
   ```

2. **Auf vercel.com** → *Add New… → Project* → das GitHub-Repo importieren.
   Framework-Preset: **Other**. Direkt deployen (es gibt nichts zu bauen).

3. **Upstash Redis anhängen** (Gratis-Tier):
   Im Vercel-Projekt → *Storage* → *Create Database* → **Upstash for Redis** →
   erstellen und mit dem Projekt verbinden. Vercel legt dann automatisch
   `UPSTASH_REDIS_REST_URL` und `UPSTASH_REDIS_REST_TOKEN` als Umgebungs-
   variablen an.

   *Alternativ manuell:* Datenbank direkt bei upstash.com anlegen, die beiden
   Werte («REST URL» und «REST TOKEN») kopieren und in Vercel unter
   *Settings → Environment Variables* eintragen.

4. **Neu deployen** (damit die ENV-Variablen greifen): *Deployments → Redeploy*.

5. Fertig. Die Vercel-URL aufrufen, Namen eingeben, Links verteilen.

## Ablauf im Spiel

- **Host:** öffnet die URL, gibt Namen + Zielpunktzahl ein → bekommt pro Person
  einen Link (mit QR-Code) und einen Startknopf. **Host-Tab offen lassen** – er
  hilft beim Weiterschalten der Runden (jeder Client stösst das aber auch an,
  serverseitig idempotent).
- **Spieler:** öffnen ihren Link am eigenen Gerät, sehen Kategorie + Buchstabe,
  tippen los, Enter zum Abschicken.

## Stellschrauben

- **Kategorien & Buchstaben:** `api/_game.js`
- **Reveal-Dauer (Pause zwischen Runden):** `submit.js`, `revealUntil = Date.now() + 3500`
- **Poll-Intervall:** `index.html`, Funktion `poll()`
- **Gleicher Buchstabe für alle** (Standard) vs. eigener pro Spieler: aktuell
  zieht `start.js` einen Buchstaben pro Runde für alle. Für private Buchstaben
  müsste man pro Spieler einen ziehen und im State pro `playerId` ablegen.

## Kosten / Limit

Upstash-Gratis-Tier = 10’000 Kommandos/Tag. Reicht für ein paar lockere Runden.
Bei intensivem Einsatz (z. B. Schulklasse, ganzer Nachmittag) das Poll-Intervall
erhöhen oder bei Upstash «Pay as you go» aktivieren (Pfennigbeträge).

Für echte Push-Updates ohne Polling wären **Supabase Realtime** oder **PartyKit**
(WebSockets) die nächste Ausbaustufe – dann aber mit etwas mehr Setup.
