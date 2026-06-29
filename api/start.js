const { getRoom, saveRoom, claimStart, readJson, publicRoom } = require('./_store');
const { CATEGORIES, LETTERS, pick } = require('./_game');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { roomId, hostKey, auto } = await readJson(req);
  const room = await getRoom(roomId);
  if (!room) return res.status(404).json({ error: 'Raum nicht gefunden.' });
  if (room.phase === 'finished') return res.json({ ok: true, room: publicRoom(room) });

  const next = room.round + 1;

  if (auto) {
    // Auto-Advance nur erlaubt, wenn Reveal-Zeit abgelaufen ist.
    if (!(room.phase === 'reveal' && room.revealUntil && Date.now() >= room.revealUntil)) {
      return res.json({ ok: true, room: publicRoom(room) });
    }
  } else {
    if (room.hostKey !== hostKey) return res.status(403).json({ error: 'Kein Host.' });
  }

  // Idempotenz: nur der erste Aufruf erzeugt die Runde wirklich.
  if (!(await claimStart(roomId, next))) {
    const fresh = await getRoom(roomId);
    return res.json({ ok: true, room: publicRoom(fresh) });
  }

  let cat;
  do { cat = pick(CATEGORIES); } while (cat === room.category && CATEGORIES.length > 1);

  room.round = next;
  room.phase = 'round';
  room.category = cat;
  room.letter = pick(LETTERS);
  room.winnerId = room.winnerName = room.winnerWord = null;
  room.roundStartedAt = Date.now();
  room.revealUntil = null;
  await saveRoom(room);
  res.json({ ok: true, room: publicRoom(room) });
};
