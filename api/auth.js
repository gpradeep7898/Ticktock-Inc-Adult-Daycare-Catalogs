export default function handler(req, res) {
  const good = !!process.env.EDIT_PASSWORD && req.headers['x-edit-password'] === process.env.EDIT_PASSWORD;
  res.status(good ? 200 : 401).json({ ok: good });
}
