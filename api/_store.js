// Geteilter Speicher. Nutzt Upstash Redis (REST) wenn ENV gesetzt ist,
// sonst In-Memory (nur fuer lokales `node dev-server.js` – NICHT fuer Vercel-Prod).
// Dateien in /api mit "_" am Anfang werden von Vercel nicht als Endpunkt behandelt.

const URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const useUpstash = !!(URL && TOKEN);

const mem = global.__slvMem || (global.__slvMem = new Map());
const expired = (e) => e.exp && Date.now() > e.exp;

async function redis(args) {
  if (useUpstash) {
    const r = await fetch(URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args.map(String)),
    });
    const j = await r.json();
    if (j.error) throw new Error(j.error);
    return j.result;
  }
  // --- lokaler Fallback ---
  const [cmd, ...rest] = args.map(String);
  const C = cmd.toUpperCase();
  if (C === 'GET') {
    const e = mem.get(rest[0]);
    if (!e || expired(e)) { mem.delete(rest[0]); return null; }
    return e.val;
  }
  if (C === 'SET') {
    const key = rest[0], val = rest[1];
    let nx = false, ex = null;
    for (let i = 2; i < rest.length; i++) {
      const o = rest[i].toUpperCase();
      if (o === 'NX') nx = true;
      else if (o === 'EX') ex = parseInt(rest[++i], 10);
    }
    const cur = mem.get(key);
    if (nx && cur && !expired(cur)) return null;
    mem.set(key, { val, exp: ex ? Date.now() + ex * 1000 : null });
    return 'OK';
  }
  if (C === 'DEL') { return mem.delete(rest[0]) ? 1 : 0; }
  throw new Error('unsupported cmd ' + C);
}

const TTL = 21600; // 6h

async function getRoom(id) {
  if (!id) return null;
  const s = await redis(['GET', `slv:room:${id}`]);
  return s ? JSON.parse(s) : null;
}
async function saveRoom(room) {
  await redis(['SET', `slv:room:${room.id}`, JSON.stringify(room), 'EX', String(TTL)]);
}
// Atomar: nur der erste gueltige Submit pro Runde gewinnt.
async function claimWinner(id, round, playerId) {
  const r = await redis(['SET', `slv:win:${id}:${round}`, playerId, 'NX', 'EX', '600']);
  return r === 'OK';
}
// Atomar: eine Runde wird nur einmal gestartet (auch wenn mehrere Clients triggern).
async function claimStart(id, round) {
  const r = await redis(['SET', `slv:start:${id}:${round}`, '1', 'NX', 'EX', String(TTL)]);
  return r === 'OK';
}
async function lockCode(id) {
  const r = await redis(['SET', `slv:code:${id}`, '1', 'NX', 'EX', String(TTL)]);
  return r === 'OK';
}

function readJson(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let d = '';
    req.on('data', (c) => (d += c));
    req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

function publicRoom(room) {
  const { hostKey, ...rest } = room;
  return rest;
}

module.exports = { redis, getRoom, saveRoom, claimWinner, claimStart, lockCode, readJson, publicRoom };
