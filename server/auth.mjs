import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.AZUBIMATCH_JWT_SECRET ?? 'azubimatch-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.cookies?.azubimatch_token;

  if (!token) {
    return res.status(401).json({ error: 'Nicht angemeldet.' });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Sitzung abgelaufen. Bitte erneut anmelden.' });
  }
}
