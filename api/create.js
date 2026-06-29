const { saveRoom, lockCode, readJson } = require('./_store');
const { newCode } = require('./_game');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const body = await readJson(req);
  const names = (body.names || []).map((s) => String(s).trim()).filter(Boolean).slice(0, 8);
  const target = Math.max(3, Math.min(20, parseInt(body.target, 10) || 7));
  if (names.length < 2) return res.status(400).json({ error: 'Mindestens 2 Namen.' });

  let id = null;
  for (let t = 0; t < 8; t++) {
    const c = newCode();
    if (await lockCode(c)) { id = c; break; }
  }
  if (!id) return res.status(500).json({ error: 'Code-Generierung fehlgeschlagen.' });

  const hostKey = Math.random().toString(36).slice(2, 12);
  const players = names.map((n, i) => ({ id: 'p' + (i + 1), name: n, score: 0 }));
  const room = {
    id, hostKey, createdAt: Date.now(), phase: 'lobby', players,
    round: 0, category: null, letter: null,
    winnerId: null, winnerName: null, winnerWord: null,
    roundStartedAt: null, revealUntil: null, target,
  };
  await saveRoom(room);
  res.json({ roomId: id, hostKey, target, players: players.map((p) => ({ id: p.id, name: p.name })) });
};
