// Spiel-Inhalt & Regeln (Schweizer Schreibweise, ss statt ß).

const CATEGORIES = [
  // Klassisch
  'Stadt', 'Land', 'Fluss oder See', 'Vorname', 'Tier', 'Pflanze', 'Beruf', 'Marke',
  'Essen', 'Getränk', 'Farbe', 'Körperteil', 'Film oder Serie', 'Promi',
  'Auto-Marke', 'Schulfach', 'Werkzeug', 'Verein oder Band',
  // Vollpfosten
  'Schlechte Ausrede', 'Peinliches Talent', 'Etwas im Kühlschrank', 'Mieses Passwort',
  'Schlechter Bandname', 'Würde ich nie googeln', 'Erfundenes Schimpfwort',
  'Nutzlose Superkraft', 'Geräusch in der Nacht', 'Schlechtes Geschenk',
  'Verdächtige Person', 'Etwas, das klebt', 'Schlechter Pizza-Belag',
  'Tier, das man nicht streichelt',
];

const LETTERS = 'ABCDEFGHIJKLMNOPRSTUVWZ'.split(''); // ohne Q, X, Y

const pick = (a) => a[Math.floor(Math.random() * a.length)];

function newCode() {
  const a = 'ABCDEFGHJKLMNPRSTUVWXYZ23456789'; // ohne 0/O/1/I/Q
  let s = '';
  for (let i = 0; i < 4; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}

function validWord(word, letter) {
  const w = (word || '').trim();
  if (w.length < 2) return false;
  return w[0].toUpperCase() === String(letter).toUpperCase();
}

module.exports = { CATEGORIES, LETTERS, pick, newCode, validWord };
