const { getRoom, publicRoom } = require('./_store');

module.exports = async (req, res) => {
  const roomId = (req.query && req.query.roomId) ||
    new URL(req.url, 'http://x').searchParams.get('roomId');
  const room = await getRoom(roomId);
  if (!room) return res.status(404).json({ error: 'Raum nicht gefunden.' });
  res.setHeader('Cache-Control', 'no-store');
  res.json({ room: publicRoom(room), now: Date.now() });
};
