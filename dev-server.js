// Lokaler Test-Server: `node dev-server.js` -> http://localhost:3000
// Bildet die Vercel-Funktionen in /api nach. NICHT fuer Produktion noetig.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const apiDir = path.join(__dirname, 'api');

function handler(name) {
  delete require.cache[require.resolve(path.join(apiDir, name + '.js'))];
  return require(path.join(apiDir, name + '.js'));
}

const server = http.createServer(async (req, res) => {
  // res helpers wie bei @vercel/node
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };

  const u = new URL(req.url, 'http://localhost');
  req.query = Object.fromEntries(u.searchParams.entries());

  if (u.pathname.startsWith('/api/')) {
    const name = u.pathname.slice(5);
    // Body fuer POST lesen und als req.body bereitstellen
    if (req.method === 'POST') {
      let d = '';
      req.on('data', c => (d += c));
      await new Promise(r => req.on('end', r));
      try { req.body = d ? JSON.parse(d) : {}; } catch { req.body = {}; }
    }
    try {
      const fn = handler(name);
      await fn(req, res);
    } catch (e) {
      res.status(500).json({ error: String(e.message || e) });
    }
    return;
  }

  // statisch: index.html fuer alles andere
  let file = u.pathname === '/' ? '/index.html' : u.pathname;
  const fp = path.join(__dirname, file);
  if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
    const ext = path.extname(fp);
    const ct = ext === '.html' ? 'text/html' : ext === '.js' ? 'text/javascript' : 'text/plain';
    res.setHeader('Content-Type', ct + '; charset=utf-8');
    res.end(fs.readFileSync(fp));
  } else {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
  }
});

server.listen(PORT, () => console.log('Stadt-Land-Vollpfosten dev-server: http://localhost:' + PORT));
