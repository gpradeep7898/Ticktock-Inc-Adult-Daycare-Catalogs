import { put, head } from '@vercel/blob';
import seed from './_seed.js';

const PATH = 'adult-day-care/catalog.json';
const ok = (req) => !!process.env.EDIT_PASSWORD && req.headers['x-edit-password'] === process.env.EDIT_PASSWORD;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    try {
      const meta = await head(PATH);
      const r = await fetch(meta.url + '?t=' + Date.now(), { cache: 'no-store' });
      return res.status(200).json(await r.json());
    } catch (e) {
      return res.status(200).json(seed);
    }
  }
  if (req.method === 'PUT') {
    if (!ok(req)) return res.status(401).json({ error: 'password' });
    const b = req.body;
    if (!b || !b.catalog || !Array.isArray(b.catalog.items)) return res.status(400).json({ error: 'bad body' });
    const doc = { catalog: b.catalog, settings: b.settings || seed.settings, history: (b.history || []).slice(0, 60) };
    await put(PATH, JSON.stringify(doc), { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60 });
    return res.status(200).json({ ok: true });
  }
  res.status(405).end();
}
