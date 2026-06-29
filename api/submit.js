const { getRoom, saveRoom, claimWinner, readJson } = require('./_store');
const { validWord } = require('./_game');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { roomId, playerId, word } = await readJson(req);
  const room = await getRoom(roomId);
  if (!room) return res.status(404).json({ error: 'Raum nicht gefunden.' });
  if (room.phase !== 'round') return res.json({ result: 'closed' });

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return res.status(400).json({ error: 'Spieler unbekannt.' });

  if (!validWord(word, room.letter)) {
    return res.json({ result: 'invalid', letter: room.letter });
  }

  // Atomar: nur der Erste setzt den Gewinner.
  const won = await claimWinner(roomId, room.round, playerId);
  if (!won) return res.json({ result: 'late' });

  const fresh = await getRoom(roomId);
  const pl = fresh.players.find((p) => p.id === playerId);
  pl.score += 1;
  fresh.phase = 'reveal';
  fresh.winnerId = playerId;
  fresh.winnerName = pl.name;
  fresh.winnerWord = String(word).trim();
  fresh.revealUntil = Date.now() + 3500;
  if (pl.score >= fresh.target) fresh.phase = 'finished';
  await saveRoom(fresh);
  res.json({ result: 'win' });
};
