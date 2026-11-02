import { put, list } from '@vercel/blob';
import seed from './_main-seed.js';

const ok = (req) => !!process.env.EDIT_PASSWORD && req.headers['x-edit-password'] === process.env.EDIT_PASSWORD;
const P = 'main/';
const PATH_RE = /^(catalogs|web)\/[A-Za-z0-9_-]{1,80}$/;

async function readStored() {
  const out = { catalogs: {}, web: {}, settings: null, history: null };
  const { blobs } = await list({ prefix: P, limit: 1000 });
  await Promise.all(blobs.map(async (b) => {
    const rel = b.pathname.slice(P.length).replace(/\.json$/, '');
    try {
      const r = await fetch(b.url + '?t=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return;
      const j = await r.json();
      if (rel === 'settings') out.settings = j;
      else if (rel === 'history') out.history = j;
      else if (rel.startsWith('catalogs/')) out.catalogs[rel.slice(9)] = j;
      else if (rel.startsWith('web/')) out.web[rel.slice(4)] = j;
    } catch (e) {}
  }));
  return out;
}
const write = (rel, doc) => put(P + rel + '.json', JSON.stringify(doc), { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60 });

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    let st = { catalogs: {}, web: {}, settings: null, history: null };
    try { st = await readStored(); } catch (e) {}
    return res.status(200).json({
      catalogs: { ...seed.catalogs, ...st.catalogs },
      web: { ...seed.web, ...st.web },
      settings: st.settings || seed.settings,
      history: st.history || [],
    });
  }
  if (req.method === 'PUT') {
    if (!ok(req)) return res.status(401).json({ error: 'password' });
    const b = req.body || {};
    try {
      for (const w of b.writes || []) {
        const path = String(w.path || '');
        const data = w.data;
        if (!data || typeof data !== 'object') return res.status(400).json({ error: 'bad data' });
        if (path === 'settings/main') {
          let cur = seed.settings;
          try { const s = await readStored(); if (s.settings) cur = s.settings; } catch (e) {}
          await write('settings', { ...cur, ...data });
        } else if (PATH_RE.test(path)) {
          const [kind, id] = path.split('/');
          let cur = seed[kind][id] || {};
          try {
            const { blobs } = await list({ prefix: P + path + '.json', limit: 1 });
            if (blobs[0]) cur = await (await fetch(blobs[0].url + '?t=' + Date.now(), { cache: 'no-store' })).json();
          } catch (e) {}
          if (kind === 'catalogs' && data.items && !Array.isArray(data.items)) return res.status(400).json({ error: 'items' });
          if (kind === 'web' && data.rows && !Array.isArray(data.rows)) return res.status(400).json({ error: 'rows' });
          await write(path, { ...cur, ...data });
        } else return res.status(400).json({ error: 'bad path' });
      }
      if (b.history && typeof b.history === 'object') {
        let h = [];
        try { const s = await readStored(); if (Array.isArray(s.history)) h = s.history; } catch (e) {}
        h.unshift({ at: String(b.history.at || new Date().toISOString()), text: String(b.history.text || '').slice(0, 300), catalog: String(b.history.catalog || '') });
        await write('history', h.slice(0, 200));
      }
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: String(e && e.message || e) });
    }
  }
  res.status(405).end();
}
