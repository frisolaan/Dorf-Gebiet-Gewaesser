const { getRoom, saveRoom, readJson, redis } = require('./_store');

// Schiedsrichter-Entscheid im Reveal: Punkt geben (award) oder zuruecknehmen (revoke).
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { roomId, decision } = await readJson(req);
  const room = await getRoom(roomId);
  if (!room) return res.status(404).json({ error: 'Raum nicht gefunden.' });
  if (room.phase !== 'reveal' && room.phase !== 'finished') {
    return res.json({ ok: true, awarded: !!room.awarded });
  }
  const pl = room.players.find((p) => p.id === room.winnerId);
  if (!pl) return res.json({ ok: true, awarded: !!room.awarded });

  const key = `slv:award:${roomId}:${room.round}`;

  if (decision === 'award') {
    // Atomar gegen Doppelvergabe durch mehrere Schiedsrichter.
    const first = await redis(['SET', key, '1', 'NX', 'EX', '600']);
    if (first === 'OK' && !room.awarded) {
      pl.score += 1;
      room.awarded = true;
      if (pl.score >= room.target) room.phase = 'finished';
      await saveRoom(room);
    }
  } else if (decision === 'revoke') {
    await redis(['DEL', key]);
    if (room.awarded) {
      pl.score = Math.max(0, pl.score - 1);
      room.awarded = false;
      if (room.phase === 'finished') room.phase = 'reveal';
      await saveRoom(room);
    }
  }

  res.json({ ok: true, awarded: !!room.awarded });
};
