import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!process.env.EDIT_PASSWORD || req.headers['x-edit-password'] !== process.env.EDIT_PASSWORD) return res.status(401).json({ error: 'password' });
  const data = req.body && req.body.data;
  if (typeof data !== 'string' || data.length > 3_000_000) return res.status(400).json({ error: 'bad photo' });
  const buf = Buffer.from(data, 'base64');
  const blob = await put('adult-day-care/photos/' + Date.now() + '.jpg', buf, { access: 'public', contentType: 'image/jpeg', addRandomSuffix: true });
  res.status(200).json({ url: blob.url });
}
