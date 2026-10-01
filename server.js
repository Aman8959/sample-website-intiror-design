import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enquiries = [];
const limiter = new Map();

app.use(express.json({ limit: '30kb' }));
app.post('/api/enquiries', (req, res) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  if ((limiter.get(ip) || 0) > now - 60_000) return res.status(429).json({ message: 'Please wait a moment before trying again.' });
  const { name, email, phone, location, requirement, website } = req.body || {};
  if (website) return res.status(400).json({ message: 'Unable to submit this enquiry.' });
  if (![name, email, phone, location, requirement].every(value => typeof value === 'string' && value.trim())) {
    return res.status(400).json({ message: 'Please complete all required fields.' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email) || requirement.length > 3000) return res.status(400).json({ message: 'Please check your email and project details.' });
  limiter.set(ip, now);
  enquiries.push({ id: crypto.randomUUID(), name: name.trim(), email: email.trim(), phone: phone.trim(), location: location.trim(), requirement: requirement.trim(), receivedAt: new Date().toISOString() });
  // Connect this endpoint to Resend, Postmark, or your mail provider using environment variables before production deployment.
  res.status(201).json({ message: 'Thank you. We’ll be in touch within two business days.' });
});
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*splat', (_req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(process.env.PORT || 3000, () => console.log('Atelier North running'));
