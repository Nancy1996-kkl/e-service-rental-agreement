import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { validateRegister, validateLogin } from '../utils/validators.js';
import { findUserByEmail, findUserById, createUser, toPublicUser } from '../services/userService.js';

const COOKIE_NAME = 'token';

// Login token-ah httpOnly cookie-la vekkirom.
// httpOnly = JavaScript-aala read panna mudiyaadhu → hacker script token-ah thiruda mudiyaadhu.
function setAuthCookie(res, user) {
  const token = jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProduction, // production-la HTTPS mattum
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// POST /api/auth/register
export async function register(req, res) {
  const { data, errors, isValid } = validateRegister(req.body);
  if (!isValid) return res.status(400).json({ message: 'Please fix the errors', errors });

  if (await findUserByEmail(data.email)) {
    return res.status(409).json({ message: 'An account with this email already exists', errors: { email: 'Email already registered' } });
  }

  // Password-ah hash pannrom — plain text-ah store pannave maatom
  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await createUser({ ...data, passwordHash });

  setAuthCookie(res, user);
  res.status(201).json({ message: 'Account created successfully', user: toPublicUser(user) });
}

// POST /api/auth/login
export async function login(req, res) {
  const { data, errors, isValid } = validateLogin(req.body);
  if (!isValid) return res.status(400).json({ message: 'Please fix the errors', errors });

  const user = await findUserByEmail(data.email);
  const passwordOk = user && (await bcrypt.compare(data.password, user.passwordHash));

  // Email thappa, password thappa — rendukkum same message.
  // Appo dhaan "indha email register aagirukka" nu hacker kandupidikka mudiyaadhu.
  if (!passwordOk) return res.status(401).json({ message: 'Invalid email or password' });
  if (user.isActive === false) {
    return res.status(403).json({ message: 'Your account has been disabled. Please contact support.' });
  }

  setAuthCookie(res, user);
  res.json({ message: 'Logged in successfully', user: toPublicUser(user) });
}

// GET /api/auth/me — page refresh pannaalum yaar login-la irukkanga nu theriya
export async function me(req, res) {
  const user = await findUserById(req.user.id);
  if (!user) return res.status(401).json({ message: 'Session expired. Please log in again.' });
  res.json({ user: toPublicUser(user) });
}

// POST /api/auth/logout
export function logout(req, res) {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: env.isProduction, sameSite: 'lax' });
  res.json({ message: 'Logged out' });
}
