// ...existing code...
import express from 'express';
// import fetch from 'node-fetch'; // removed — use global fetch available in Node 18+
 
const router = express.Router();
 
// Simple in-memory cache to reduce requests to Nominatim
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
 
router.get('/geocode', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Missing q parameter' });
 
  const key = q.toLowerCase();
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.t < CACHE_TTL) {
    return res.type('application/json').status(200).send(cached.body);
  }
 
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`;
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': process.env.GEOCODE_USER_AGENT || 'CNPM_GeoProxy/1.0 (dev@localhost)',
        'Referer': process.env.GEOCODE_REFERER || 'http://localhost:5500'
      },
    });
 
    const body = await upstream.text();
    if (upstream.ok) cache.set(key, { t: now, body });
 
    res.status(upstream.status)
      .type(upstream.headers.get('content-type') || 'application/json')
      .send(body);
  } catch (err) {
    console.error('Geocode proxy error:', err);
    res.status(500).json({ error: 'Geocode proxy failed' });
  }
});
 
export default router;
// ...existing code...