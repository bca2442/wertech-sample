const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');

const app = express();

const PASSWORD_HASH_PREFIX = 'pbkdf2_sha512';
const PASSWORD_ITERATIONS = 120000;
const PASSWORD_KEYLEN = 64;
const PASSWORD_DIGEST = 'sha512';
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const JWT_SECRET = process.env.JWT_SECRET || 'wertech_dev_secret_change_me';
const PORT = Number(process.env.PORT || 5000);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wertech_db';
const DEFAULT_MONGODB_DB_NAME = 'wertech_db';
const CORS_ORIGINS = String(
  process.env.CORS_ORIGINS
  || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);
const APP_ENV = process.env.NODE_ENV || 'development';

function resolveMongoUri(inputUri) {
  const raw = String(inputUri || '').trim();
  if (!raw) return raw;
  const isMongoProtocol = raw.startsWith('mongodb://') || raw.startsWith('mongodb+srv://');
  if (!isMongoProtocol) return raw;
  try {
    const parsed = new URL(raw);
    const dbNameFromPath = String(parsed.pathname || '').replace(/^\//, '').trim();
    if (dbNameFromPath) return raw;
    parsed.pathname = `/${DEFAULT_MONGODB_DB_NAME}`;
    return parsed.toString();
  } catch (err) {
    return raw;
  }
}

function generateRequestId() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return crypto.randomBytes(16).toString('hex');
}

function logStructured(level, event, payload = {}) {
  const row = {
    ts: new Date().toISOString(),
    level,
    event,
    env: APP_ENV,
    ...payload
  };
  const line = JSON.stringify(row);
  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hashPassword(plainPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto
    .pbkdf2Sync(String(plainPassword), salt, PASSWORD_ITERATIONS, PASSWORD_KEYLEN, PASSWORD_DIGEST)
    .toString('hex');
  return `${PASSWORD_HASH_PREFIX}$${PASSWORD_ITERATIONS}$${salt}$${derived}`;
}

function verifyPassword(plainPassword, storedPassword) {
  const stored = String(storedPassword || '');
  if (!stored.startsWith(`${PASSWORD_HASH_PREFIX}$`)) {
    // Legacy plain-text fallback (for migration only).
    return stored === String(plainPassword);
  }

  const parts = stored.split('$');
  if (parts.length !== 4) return false;

  const iterations = Number(parts[1]);
  const salt = parts[2];
  const savedHash = parts[3];
  if (!iterations || !salt || !savedHash) return false;

  const calculatedHash = crypto
    .pbkdf2Sync(String(plainPassword), salt, iterations, PASSWORD_KEYLEN, PASSWORD_DIGEST)
    .toString('hex');
  return crypto.timingSafeEqual(Buffer.from(savedHash, 'hex'), Buffer.from(calculatedHash, 'hex'));
}

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input) {
  const normalized = String(input || '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padLength = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(`${normalized}${'='.repeat(padLength)}`, 'base64').toString('utf8');
}

function signJwt(payload, expiresInSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + Number(expiresInSeconds || 0)
  };
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerPart = base64UrlEncode(JSON.stringify(header));
  const payloadPart = base64UrlEncode(JSON.stringify(fullPayload));
  const signingInput = `${headerPart}.${payloadPart}`;
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signingInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${signingInput}.${signature}`;
}

function verifyJwt(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed token');
  }
  const [headerPart, payloadPart, receivedSignature] = parts;
  const signingInput = `${headerPart}.${payloadPart}`;
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signingInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const receivedBuf = Buffer.from(receivedSignature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (receivedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(receivedBuf, expectedBuf)) {
    throw new Error('Invalid signature');
  }

  const payloadRaw = base64UrlDecode(payloadPart);
  const payload = JSON.parse(payloadRaw);
  const now = Math.floor(Date.now() / 1000);
  if (!payload || typeof payload !== 'object' || Number(payload.exp || 0) <= now) {
    throw new Error('Token expired');
  }
  return payload;
}

function getBearerToken(req) {
  const header = String(req.headers?.authorization || '');
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  const path = String(req.path || '');
  if (!path.startsWith('/events/')) return '';
  const queryToken = String(req.query?.access_token || '').trim();
  return queryToken;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function issueAccessToken(user) {
  return signJwt(
    {
      sub: String(user._id),
      username: String(user.username || ''),
      role: String(user.role || 'user'),
      token_type: 'access'
    },
    ACCESS_TOKEN_TTL_SECONDS
  );
}

function issueRefreshToken(user) {
  return signJwt(
    {
      sub: String(user._id),
      username: String(user.username || ''),
      role: String(user.role || 'user'),
      token_type: 'refresh'
    },
    REFRESH_TOKEN_TTL_SECONDS
  );
}

class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = Number(status || 500);
    this.code = String(code || 'INTERNAL_ERROR');
    this.details = details || null;
  }
}

function isObjectId(value) {
  return mongoose.Types.ObjectId.isValid(String(value || '').trim());
}

function statusToCode(status) {
  const s = Number(status || 500);
  if (s === 400) return 'BAD_REQUEST';
  if (s === 401) return 'UNAUTHORIZED';
  if (s === 403) return 'FORBIDDEN';
  if (s === 404) return 'NOT_FOUND';
  if (s === 409) return 'CONFLICT';
  if (s === 422) return 'VALIDATION_ERROR';
  if (s >= 500) return 'INTERNAL_ERROR';
  return 'REQUEST_FAILED';
}

function ensureSelfOrAdmin(req, targetUsername) {
  const auth = req.auth || {};
  if (String(auth.role || '') === 'admin') return true;
  return String(auth.username || '') === String(targetUsername || '');
}

function getPagination(req, options = {}) {
  const maxLimit = Number(options.maxLimit || 100);
  const defaultLimit = Number(options.defaultLimit || 20);
  const rawPage = Number(req.query?.page);
  const rawLimit = Number(req.query?.limit);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const limitBase = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : defaultLimit;
  const limit = Math.min(Math.max(limitBase, 1), maxLimit);
  const skip = (page - 1) * limit;
  const explicit = req.query?.page !== undefined || req.query?.limit !== undefined;
  return { page, limit, skip, explicit };
}

function buildPaginationResponse(items, total, page, limit) {
  const totalItems = Number(total || 0);
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  return {
    items,
    pagination: {
      page,
      limit,
      total_items: totalItems,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1
    }
  };
}

const readCache = new Map();
function getCache(key) {
  const row = readCache.get(key);
  if (!row) return null;
  if (Date.now() >= row.expiresAt) {
    readCache.delete(key);
    return null;
  }
  return row.value;
}

function setCache(key, value, ttlMs = 15000) {
  readCache.set(key, {
    value,
    expiresAt: Date.now() + Number(ttlMs || 0)
  });
}

function invalidateCachePrefix(prefix) {
  for (const key of readCache.keys()) {
    if (key.startsWith(prefix)) {
      readCache.delete(key);
    }
  }
}

function invalidateRealtimeCachesForUser(username) {
  const key = String(username || '').trim();
  if (!key) return;
  invalidateCachePrefix(`msg-unread-count:${key}`);
  invalidateCachePrefix(`notif-unread-count:${key}`);
}

async function removeListingNotifications({ listingIds = [], ownerUsername = '' } = {}) {
  const ids = Array.isArray(listingIds)
    ? listingIds.map((v) => String(v || '').trim()).filter(Boolean)
    : [];
  const owner = String(ownerUsername || '').trim();
  const orFilters = [];
  if (ids.length > 0) {
    orFilters.push({ 'meta.listing_id': { $in: ids } });
  }
  if (owner) {
    orFilters.push({ 'meta.owner_username': owner });
    orFilters.push({ actor_username: owner });
  }
  if (orFilters.length === 0) {
    return { deleted: 0, recipients: [] };
  }

  const query = { type: 'listing', $or: orFilters };
  const recipients = await Notification.distinct('recipient_username', query);
  const result = await Notification.deleteMany(query);
  const recipientList = recipients.map((v) => String(v || '').trim()).filter(Boolean);
  if (recipientList.length > 0) {
    recipientList.forEach((u) => invalidateRealtimeCachesForUser(u));
    pushEventToMany(recipientList, 'notification_update', {
      reason: 'listing_removed',
      owner_username: owner || null
    });
  }
  return { deleted: Number(result?.deletedCount || 0), recipients: recipientList };
}

const eventClientsByUser = new Map();
function addEventClient(username, res) {
  const key = String(username || '');
  if (!eventClientsByUser.has(key)) {
    eventClientsByUser.set(key, new Set());
  }
  eventClientsByUser.get(key).add(res);
}

function removeEventClient(username, res) {
  const key = String(username || '');
  const set = eventClientsByUser.get(key);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) {
    eventClientsByUser.delete(key);
  }
}

function pushEvent(username, type, payload = {}) {
  const set = eventClientsByUser.get(String(username || ''));
  if (!set || set.size === 0) return;
  const eventName = String(type || 'update');
  const data = JSON.stringify({
    type: eventName,
    payload,
    sent_at: new Date().toISOString()
  });
  for (const res of set) {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${data}\n\n`);
  }
}

function pushEventToMany(usernames = [], type, payload = {}) {
  const uniq = Array.from(new Set((Array.isArray(usernames) ? usernames : []).filter(Boolean)));
  uniq.forEach((username) => pushEvent(username, type, payload));
}

function normalizeErrorPayload(status, payload) {
  if (payload && typeof payload === 'object' && payload.code && payload.message !== undefined && Object.prototype.hasOwnProperty.call(payload, 'details')) {
    return payload;
  }

  const message = typeof payload === 'string'
    ? payload
    : String(payload?.message || 'Request failed');
  const details =
    payload && typeof payload === 'object'
      ? (payload.details || payload.error || null)
      : null;

  return {
    code: statusToCode(status),
    message,
    details
  };
}

function createValidationHelpers(req, errors) {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const query = req.query && typeof req.query === 'object' ? req.query : {};

  const requireString = (source, key, label) => {
    const container = source === 'query' ? query : body;
    const value = container[key];
    if (typeof value !== 'string' || !value.trim()) {
      errors.push({ field: key, issue: `${label || key} is required` });
      return '';
    }
    return value.trim();
  };

  const optionalEnum = (source, key, allowedValues) => {
    const container = source === 'query' ? query : body;
    if (container[key] === undefined || container[key] === null || String(container[key]).trim() === '') {
      return;
    }
    const value = String(container[key]).trim();
    if (!allowedValues.includes(value)) {
      errors.push({ field: key, issue: `Invalid value. Allowed: ${allowedValues.join(', ')}` });
    }
  };

  const optionalPositiveInt = (source, key) => {
    const container = source === 'query' ? query : body;
    if (container[key] === undefined || container[key] === null || String(container[key]).trim() === '') {
      return;
    }
    const value = Number(container[key]);
    if (!Number.isFinite(value) || value <= 0 || Math.floor(value) !== value) {
      errors.push({ field: key, issue: `${key} must be a positive integer` });
    }
  };

  const optionalObjectIdPath = (regex, fieldName) => {
    const match = req.path.match(regex);
    if (!match) return;
    const idValue = String(match[1] || '').trim();
    if (!isObjectId(idValue)) {
      errors.push({ field: fieldName, issue: 'Invalid id format' });
    }
  };

  return { requireString, optionalEnum, optionalObjectIdPath, optionalPositiveInt };
}

function validateApiRequest(req, res, next) {
  const errors = [];
  const method = String(req.method || '').toUpperCase();
  const path = String(req.path || '');
  const { requireString, optionalEnum, optionalObjectIdPath, optionalPositiveInt } = createValidationHelpers(req, errors);

  if ((method === 'POST' || method === 'PATCH' || method === 'PUT') && (!req.body || typeof req.body !== 'object')) {
    errors.push({ field: 'body', issue: 'JSON request body is required' });
  }

  if (method === 'POST' && path === '/auth/register') {
    requireString('body', 'username', 'username');
    requireString('body', 'email', 'email');
    requireString('body', 'password', 'password');
    optionalEnum('body', 'profile_visibility', ['public', 'private']);
  }
  if (method === 'POST' && path === '/auth/login') {
    requireString('body', 'email', 'email or username');
    requireString('body', 'password', 'password');
  }
  if (method === 'GET' && path === '/auth/username-available') {
    requireString('query', 'username', 'username');
  }
  if (method === 'GET' && path === '/messages') {
    requireString('query', 'username', 'username');
  }
  if (method === 'POST' && path === '/auth/refresh') {
    requireString('body', 'refresh_token', 'refresh_token');
  }
  if (method === 'POST' && /^\/users\/[^/]+\/subscribe$/.test(path)) {
    // username is validated by route shape; no extra body fields needed.
  }
  if (method === 'POST' && path === '/admin/profiles') {
    requireString('body', 'username', 'username');
  }
  if (method === 'PATCH' && /^\/admin\/users\/[^/]+\/account-status$/.test(path)) {
    optionalEnum('body', 'status', ['ACTIVE', 'PENDING', 'SUSPENDED', 'INACTIVE', 'BANNED']);
  }
  if (method === 'PATCH' && /^\/users\/[^/]+\/profile$/.test(path)) {
    // At least one profile field should be provided.
    const keys = Object.keys(req.body || {});
    if (keys.length === 0) {
      errors.push({ field: 'body', issue: 'At least one profile field is required' });
    }
  }
  if (method === 'POST' && path === '/friends/request') {
    requireString('body', 'from_username', 'from_username');
    requireString('body', 'to_username', 'to_username');
  }
  if (method === 'POST' && path === '/friends/accept') {
    requireString('body', 'recipient_username', 'recipient_username');
    requireString('body', 'requester_username', 'requester_username');
  }
  if (method === 'POST' && path === '/friends/reject') {
    requireString('body', 'recipient_username', 'recipient_username');
    requireString('body', 'requester_username', 'requester_username');
  }
  if (method === 'POST' && path === '/friends/unfriend') {
    requireString('body', 'username', 'username');
    requireString('body', 'target_username', 'target_username');
  }
  if (method === 'POST' && path === '/barters') {
    requireString('body', 'sender_username', 'sender_username');
    requireString('body', 'receiver_username', 'receiver_username');
    requireString('body', 'item', 'item');
  }
  if (method === 'PATCH' && /^\/barters\/[^/]+\/status$/.test(path)) {
    requireString('body', 'requester_username', 'requester_username');
    optionalEnum('body', 'status', ['PENDING', 'ACCEPTED', 'DECLINED', 'IN_PROGRESS', 'AWAITING_PICKUP', 'COMPLETED']);
  }
  if (method === 'POST' && path === '/transactions/apply') {
    requireString('body', 'username', 'username');
    requireString('body', 'type', 'type');
    requireString('body', 'title', 'title');
  }
  if (method === 'POST' && path === '/messages') {
    requireString('body', 'sender_username', 'sender_username');
    requireString('body', 'receiver_username', 'receiver_username');
    requireString('body', 'text', 'text');
  }
  if (method === 'PATCH' && /^\/messages\/[^/]+\/read$/.test(path)) {
    requireString('body', 'requester_username', 'requester_username');
  }
  if (method === 'PATCH' && /^\/notifications\/[^/]+\/read$/.test(path)) {
    requireString('body', 'requester_username', 'requester_username');
  }
  if (method === 'POST' && path === '/users/block') {
    requireString('body', 'blocker_username', 'blocker_username');
    requireString('body', 'target_username', 'target_username');
  }
  if (method === 'POST' && path === '/users/unblock') {
    requireString('body', 'blocker_username', 'blocker_username');
    requireString('body', 'target_username', 'target_username');
  }
  if (method === 'POST' && path === '/reports/user') {
    requireString('body', 'reporter_username', 'reporter_username');
    requireString('body', 'reported_username', 'reported_username');
    requireString('body', 'reason', 'reason');
  }
  if (method === 'GET' && path === '/admin/reports') {
    optionalEnum('query', 'status', ['open', 'reviewed', 'dismissed']);
  }
  if (method === 'PATCH' && /^\/admin\/reports\/[^/]+\/status$/.test(path)) {
    requireString('body', 'status', 'status');
    optionalEnum('body', 'status', ['open', 'reviewed', 'dismissed']);
  }
  if (method === 'POST' && path === '/listings') {
    requireString('body', 'owner_username', 'owner_username');
    requireString('body', 'title', 'title');
    requireString('body', 'location', 'location');
  }

  if (method === 'GET') {
    optionalPositiveInt('query', 'page');
    optionalPositiveInt('query', 'limit');
  }

  optionalObjectIdPath(/^\/barters\/([^/]+)\/status$/, 'id');
  optionalObjectIdPath(/^\/messages\/([^/]+)$/, 'id');
  optionalObjectIdPath(/^\/messages\/([^/]+)\/read$/, 'id');
  optionalObjectIdPath(/^\/notifications\/([^/]+)\/read$/, 'id');
  optionalObjectIdPath(/^\/admin\/reports\/([^/]+)\/status$/, 'reportId');
  optionalObjectIdPath(/^\/listings\/([^/]+)$/, 'id');

  if (errors.length > 0) {
    return next(new ApiError(422, 'VALIDATION_ERROR', 'Request validation failed', errors));
  }
  return next();
}

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
  const inboundRequestId = String(req.headers['x-request-id'] || '').trim();
  const requestId = inboundRequestId || generateRequestId();
  const start = Date.now();

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  logStructured('info', 'request_start', {
    request_id: requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    user_agent: req.headers['user-agent'] || ''
  });

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    logStructured(res.statusCode >= 500 ? 'error' : 'info', 'request_end', {
      request_id: requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration_ms: durationMs,
      auth_user: req.auth?.username || null
    });
  });

  return next();
});
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (payload) => {
    if (res.statusCode >= 400) {
      const normalized = normalizeErrorPayload(res.statusCode, payload);
      if (normalized && typeof normalized === 'object') {
        if (normalized.details && typeof normalized.details === 'object') {
          normalized.details = { ...normalized.details, request_id: req.requestId || null };
        } else {
          normalized.details = { request_id: req.requestId || null };
        }
      }
      return originalJson(normalized);
    }
    return originalJson(payload);
  };
  return next();
});
app.use('/api', validateApiRequest);

let mongoConnectionPromise = null;
function connectDatabase() {
  if (!mongoConnectionPromise) {
    const effectiveMongoUri = resolveMongoUri(MONGODB_URI);
    mongoConnectionPromise = mongoose.connect(effectiveMongoUri)
      .then(() => {
        logStructured('info', 'mongodb_connected', {
          host: mongoose.connection?.host || null,
          name: mongoose.connection?.name || null,
          default_db_name: DEFAULT_MONGODB_DB_NAME
        });
        return mongoose.connection;
      })
      .catch((err) => {
        logStructured('error', 'mongodb_connection_error', {
          message: err?.message || 'MongoDB connection error',
          stack: err?.stack ? String(err.stack) : undefined
        });
        mongoConnectionPromise = null;
        throw err;
      });
  }
  return mongoConnectionPromise;
}

// 2. User Schema & Model
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, 
  role: { type: String, default: 'user' },
  wtk_balance: { type: Number, default: 1000 },
  status: { type: String, default: 'Verified' },
  account_state: { type: String, enum: ['ACTIVE', 'PENDING', 'SUSPENDED', 'INACTIVE', 'BANNED'], default: 'ACTIVE' },
  location: { type: String, default: 'Kalamassery, Kochi' },
  skills: { type: [String], default: ['Web Design', 'Gardening', 'Plumbing'] },
  radius: { type: Number, default: 15 },
  profile_image: { type: String, default: '' },
  profile_visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  friends: { type: [String], default: [] },
  incoming_friend_requests: { type: [String], default: [] },
  outgoing_friend_requests: { type: [String], default: [] },
  dm_approved_users: { type: [String], default: [] },
  blocked_users: { type: [String], default: [] },
  username_last_changed_at: { type: Date, default: null },
  email_last_changed_at: { type: Date, default: null },
  has_subscribed: { type: Boolean, default: false },
  subscription_paid: { type: Number, default: 0 },
  refresh_token_hash: { type: String, default: '' },
  refresh_token_expires_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now }
});

const User = mongoose.model('users', UserSchema);

const ListingSchema = new mongoose.Schema({
  owner_username: { type: String, required: true },
  title: { type: String, required: true },
  wtk: { type: Number, required: true },
  location: { type: String, required: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  type: { type: String, enum: ['item', 'skill'], default: 'item' },
  date: { type: String, default: () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
  created_at: { type: Date, default: Date.now }
});

const Listing = mongoose.model('listings', ListingSchema);

const TransactionSchema = new mongoose.Schema({
  username: { type: String, required: true },
  type: { type: String, enum: ['spent', 'requested', 'earned'], required: true },
  title: { type: String, required: true },
  wtk: { type: Number, required: true },
  status: { type: String, default: 'Completed' },
  date: { type: String, default: 'Just now' },
  created_at: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('transactions', TransactionSchema);

const MessageSchema = new mongoose.Schema({
  sender_username: { type: String, required: true, index: true },
  receiver_username: { type: String, required: true, index: true },
  text: { type: String, required: true, trim: true },
  message_type: { type: String, enum: ['text', 'listing_share'], default: 'text', index: true },
  shared_listing: {
    listing_id: { type: String, default: '' },
    title: { type: String, default: '' },
    owner_username: { type: String, default: '' },
    wtk: { type: Number, default: 0 },
    type: { type: String, enum: ['item', 'skill'], default: 'item' },
    image: { type: String, default: '' },
    location: { type: String, default: '' }
  },
  delivery_type: { type: String, enum: ['direct', 'request'], default: 'direct', index: true },
  request_status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'accepted', index: true },
  read_by_receiver: { type: Boolean, default: false, index: true },
  created_at: { type: Date, default: Date.now, index: true }
});
MessageSchema.index({ receiver_username: 1, request_status: 1, read_by_receiver: 1, created_at: -1 });
MessageSchema.index({ sender_username: 1, receiver_username: 1, created_at: -1 });
MessageSchema.index({ receiver_username: 1, sender_username: 1, created_at: -1 });
MessageSchema.index({ sender_username: 1, request_status: 1, created_at: -1 });

const Message = mongoose.model('messages', MessageSchema);

const BarterSchema = new mongoose.Schema({
  sender_username: { type: String, required: true, index: true },
  receiver_username: { type: String, required: true, index: true },
  item: { type: String, required: true, trim: true },
  wtk: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'IN_PROGRESS', 'AWAITING_PICKUP', 'COMPLETED'],
    default: 'PENDING',
    index: true
  },
  created_at: { type: Date, default: Date.now, index: true }
});

const Barter = mongoose.model('barters', BarterSchema);

const NotificationSchema = new mongoose.Schema({
  recipient_username: { type: String, required: true, index: true },
  actor_username: { type: String, required: true },
  type: { type: String, enum: ['listing', 'friend_request', 'friend_accept', 'barter_request', 'barter_accept', 'message_request'], default: 'listing', index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  meta: { type: Object, default: {} },
  read: { type: Boolean, default: false, index: true },
  created_at: { type: Date, default: Date.now, index: true }
});
NotificationSchema.index({ recipient_username: 1, read: 1, created_at: -1 });
NotificationSchema.index({ recipient_username: 1, type: 1, read: 1, created_at: -1 });

const Notification = mongoose.model('notifications', NotificationSchema);

const UserReportSchema = new mongoose.Schema({
  reporter_username: { type: String, required: true, index: true },
  reported_username: { type: String, required: true, index: true },
  reason: { type: String, required: true, trim: true },
  details: { type: String, default: '', trim: true },
  status: { type: String, enum: ['open', 'reviewed', 'dismissed'], default: 'open', index: true },
  created_at: { type: Date, default: Date.now, index: true }
});
UserReportSchema.index({ status: 1, created_at: -1 });
UserReportSchema.index({ reporter_username: 1, reported_username: 1, reason: 1, status: 1 });

const UserReport = mongoose.model('user_reports', UserReportSchema);

// 3. REGISTRATION ROUTE (Save to DB)
app.post('/api/auth/register', async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const profileVisibilityRaw = String(req.body?.profile_visibility || 'public').trim().toLowerCase();
    const profileVisibility = profileVisibilityRaw === 'private' ? 'private' : 'public';
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }

    const usernameRegex = new RegExp(`^${escapeRegex(username)}$`, 'i');
    const emailRegex = new RegExp(`^${escapeRegex(email)}$`, 'i');
    const existingUser = await User.findOne({ $or: [{ email: emailRegex }, { username: usernameRegex }] });
    if (existingUser) {
      if (String(existingUser.email || '').toLowerCase() === email.toLowerCase()) {
        return res.status(409).json({ message: "Email already registered" });
      }
      return res.status(409).json({ message: "Username already taken" });
    }

    const newUser = new User({
      username,
      email,
      password: hashPassword(password),
      role: 'user',
      wtk_balance: 1000,
      status: 'Verified',
      profile_visibility: profileVisibility,
      has_subscribed: true,
      subscription_paid: 0
    });
    await newUser.save();
    console.log(`👤 New user saved: ${username}`);
    res.status(201).json({ message: "User saved successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Error saving user", error: err.message });
  }
});

// 4. LOGIN ROUTE (Verify from DB)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const identifier = String(email || '').trim();
    const identifierRegex = new RegExp(`^${escapeRegex(identifier)}$`, 'i');
    const user = await User.findOne({
      $or: [{ email: identifierRegex }, { username: identifierRegex }]
    });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!verifyPassword(password, user.password)) return res.status(401).json({ message: "Invalid credentials" });

    // Migrate very old plain-text passwords to hashed format after successful login.
    if (!String(user.password || '').startsWith(`${PASSWORD_HASH_PREFIX}$`)) {
      user.password = hashPassword(password);
      await user.save();
    }

    // Backfill missing metadata on very old accounts.
    if (!user.created_at) {
      user.has_subscribed = true;
      user.subscription_paid = 0;
      user.created_at = new Date();
      await user.save();
    }

    // Ensure every user starts with 1000 WTK.
    // If an old account still has 0 and has never transacted, initialize once to 1000.
    if (typeof user.wtk_balance !== 'number' || Number.isNaN(user.wtk_balance)) {
      user.wtk_balance = 1000;
      await user.save();
    } else if (user.wtk_balance <= 0) {
      const txCount = await Transaction.countDocuments({ username: user.username });
      if (txCount === 0) {
        user.wtk_balance = 1000;
        await user.save();
      }
    }

    const accessToken = issueAccessToken(user);
    const refreshToken = issueRefreshToken(user);
    user.refresh_token_hash = hashToken(refreshToken);
    user.refresh_token_expires_at = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);
    await user.save();

    res.status(200).json({
      message: "Login successful",
      role: user.role,
      username: user.username,
      profile_image: user.profile_image || '',
      location: user.location || '',
      skills: Array.isArray(user.skills) ? user.skills : [],
      radius: Number(user.radius || 15),
      wtk_balance: user.wtk_balance || 0,
      has_subscribed: !!user.has_subscribed,
      access_token: accessToken,
      refresh_token: refreshToken
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.get('/api/auth/username-available', async (req, res) => {
  try {
    const username = String(req.query?.username || '').trim();
    if (!username) {
      return res.status(400).json({ message: "Username is required", available: false });
    }

    const usernameRegex = new RegExp(`^${escapeRegex(username)}$`, 'i');
    const exists = await User.exists({ username: usernameRegex });
    return res.json({ available: !exists });
  } catch (err) {
    return res.status(500).json({ message: "Could not verify username availability", available: false });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const refreshToken = String(req.body?.refresh_token || '').trim();
    if (!refreshToken) {
      return res.status(400).json({ message: "Missing refresh token" });
    }

    let payload;
    try {
      payload = verifyJwt(refreshToken);
    } catch (err) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    if (String(payload.token_type || '') !== 'refresh') {
      return res.status(401).json({ message: "Invalid token type" });
    }

    const user = await User.findById(payload.sub);
    if (!user || String(user.username || '') !== String(payload.username || '')) {
      return res.status(401).json({ message: "User not found for token" });
    }

    const tokenHash = hashToken(refreshToken);
    const isExpired = !user.refresh_token_expires_at || new Date(user.refresh_token_expires_at).getTime() < Date.now();
    if (!user.refresh_token_hash || user.refresh_token_hash !== tokenHash || isExpired) {
      return res.status(401).json({ message: "Refresh token expired or revoked" });
    }

    const accessToken = issueAccessToken(user);
    const nextRefreshToken = issueRefreshToken(user);
    user.refresh_token_hash = hashToken(nextRefreshToken);
    user.refresh_token_expires_at = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);
    await user.save();

    return res.json({
      access_token: accessToken,
      refresh_token: nextRefreshToken
    });
  } catch (err) {
    return res.status(500).json({ message: "Could not refresh token", error: err.message });
  }
});

app.get('/api/health', async (req, res) => {
  const readyState = mongoose.connection?.readyState ?? 0;
  const readyMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  const dbStatus = readyMap[readyState] || 'unknown';
  const healthy = dbStatus === 'connected';
  const payload = {
    status: healthy ? 'ok' : 'degraded',
    service: 'wertech-api',
    env: APP_ENV,
    uptime_seconds: Math.floor(process.uptime()),
    db: {
      status: dbStatus,
      ready_state: readyState
    },
    request_id: req.requestId || null,
    now: new Date().toISOString()
  };
  return res.status(healthy ? 200 : 503).json(payload);
});

app.use('/api', async (req, res, next) => {
  const publicPaths = new Set([
    '/auth/register',
    '/auth/login',
    '/auth/username-available',
    '/auth/refresh',
    '/health'
  ]);
  if (publicPaths.has(req.path)) {
    return next();
  }

  const accessToken = getBearerToken(req);
  if (!accessToken) {
    return res.status(401).json({ message: "Missing authorization token" });
  }

  let payload;
  try {
    payload = verifyJwt(accessToken);
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
  if (String(payload.token_type || '') !== 'access') {
    return res.status(401).json({ message: "Invalid token type" });
  }

  const authUser = await User.findById(payload.sub).select('username role account_state').lean();
  if (!authUser || String(authUser.username || '') !== String(payload.username || '')) {
    return res.status(401).json({ message: "Token user not found" });
  }
  if (['SUSPENDED', 'INACTIVE', 'BANNED'].includes(String(authUser.account_state || '').toUpperCase())) {
    return res.status(403).json({ message: "Account is not allowed to access this resource" });
  }

  req.auth = {
    user_id: String(payload.sub),
    username: String(authUser.username || ''),
    role: String(authUser.role || 'user')
  };

  if (req.path.startsWith('/admin') && req.auth.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }

  if (req.auth.role !== 'admin') {
    const method = String(req.method || '').toUpperCase();
    const path = String(req.path || '');

    const pathMatches = (regex) => {
      const matched = path.match(regex);
      if (!matched) return '';
      return decodeURIComponent(matched[1] || '');
    };

    let strictUsername = '';
    if (method === 'POST') strictUsername = strictUsername || pathMatches(/^\/users\/([^/]+)\/subscribe$/);
    strictUsername = strictUsername || pathMatches(/^\/users\/([^/]+)\/wallet$/);
    if (method === 'PATCH') strictUsername = strictUsername || pathMatches(/^\/users\/([^/]+)\/profile$/);
    strictUsername = strictUsername || pathMatches(/^\/users\/([^/]+)\/blocked$/);
    strictUsername = strictUsername || pathMatches(/^\/transactions\/user\/([^/]+)$/);
    strictUsername = strictUsername || pathMatches(/^\/chat\/users\/([^/]+)$/);
    strictUsername = strictUsername || pathMatches(/^\/barters\/user\/([^/]+)$/);
    strictUsername = strictUsername || pathMatches(/^\/messages\/thread\/([^/]+)\/[^/]+$/);
    strictUsername = strictUsername || pathMatches(/^\/messages\/unread-count\/([^/]+)$/);
    strictUsername = strictUsername || pathMatches(/^\/messages\/unread\/([^/]+)$/);
    strictUsername = strictUsername || pathMatches(/^\/messages\/read-thread\/([^/]+)\/[^/]+$/);
    strictUsername = strictUsername || pathMatches(/^\/messages\/read-all\/([^/]+)$/);
    strictUsername = strictUsername || pathMatches(/^\/messages\/requests\/([^/]+)(?:\/.*)?$/);
    strictUsername = strictUsername || pathMatches(/^\/events\/([^/]+)$/);
    strictUsername = strictUsername || pathMatches(/^\/notifications\/([^/]+)$/);
    strictUsername = strictUsername || pathMatches(/^\/notifications\/unread-count\/([^/]+)$/);
    strictUsername = strictUsername || pathMatches(/^\/notifications\/read-all\/([^/]+)$/);

    if (strictUsername && strictUsername !== req.auth.username) {
      return res.status(403).json({ message: "Forbidden for current user identity" });
    }

    if (method === 'GET' && path === '/messages') {
      const requestedUsername = String(req.query?.username || '').trim();
      if (requestedUsername && requestedUsername !== req.auth.username) {
        return res.status(403).json({ message: "Forbidden for current user identity" });
      }
    }

    const bodyBoundFields = [
      'username',
      'owner_username',
      'sender_username',
      'requester_username',
      'reporter_username',
      'blocker_username'
    ];
    for (const field of bodyBoundFields) {
      const value = req.body?.[field];
      if (value && String(value).trim() !== req.auth.username) {
        return res.status(403).json({ message: `Body field "${field}" must match authenticated user` });
      }
    }

    const viewerUsername = String(req.query?.viewer_username || '').trim();
    if (viewerUsername && viewerUsername !== req.auth.username) {
      return res.status(403).json({ message: "viewer_username must match authenticated user" });
    }
  }

  return next();
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const user = await User.findById(req.auth.user_id)
      .select('username role profile_image location skills radius wtk_balance has_subscribed')
      .lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({
      username: user.username,
      role: user.role,
      profile_image: user.profile_image || '',
      location: user.location || '',
      skills: Array.isArray(user.skills) ? user.skills : [],
      radius: Number(user.radius || 15),
      wtk_balance: Number(user.wtk_balance || 0),
      has_subscribed: !!user.has_subscribed
    });
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch current user", error: err.message });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const user = await User.findById(req.auth.user_id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.refresh_token_hash = '';
    user.refresh_token_expires_at = null;
    await user.save();
    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Could not logout", error: err.message });
  }
});

app.get('/api/events/:username', async (req, res) => {
  try {
    const username = String(req.params?.username || '').trim();
    if (!username) {
      return res.status(400).json({ message: "Missing username" });
    }
    if (!ensureSelfOrAdmin(req, username)) {
      return res.status(403).json({ message: "Not allowed to subscribe for this user" });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    addEventClient(username, res);
    res.write('event: connected\n');
    res.write(`data: ${JSON.stringify({ type: 'connected', username, sent_at: new Date().toISOString() })}\n\n`);

    const keepAlive = setInterval(() => {
      res.write('event: ping\n');
      res.write(`data: ${JSON.stringify({ ts: Date.now() })}\n\n`);
    }, 25000);

    req.on('close', () => {
      clearInterval(keepAlive);
      removeEventClient(username, res);
      res.end();
    });
  } catch (err) {
    return res.status(500).json({ message: "Could not open event stream", error: err.message });
  }
});

// 5. ONE-TIME SUBSCRIPTION: pay 100 to get 1000 WTK
app.post('/api/users/:username/subscribe', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.has_subscribed) return res.status(400).json({ message: "Subscription already active" });

    user.has_subscribed = true;
    user.subscription_paid = 100;
    user.wtk_balance += 1000;
    await user.save();

    res.status(200).json({
      message: "Subscription successful",
      wtk_balance: user.wtk_balance,
      has_subscribed: true
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 6. GET USERS ROUTE (For Admin Dashboard)
app.get('/api/users', async (req, res) => {
  try {
    const allUsers = await User.find();
    res.json(allUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const search = String(req.query?.search || '').trim();
    const query = { role: { $ne: 'admin' } };
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('username email wtk_balance account_state created_at')
      .sort({ created_at: -1 })
      .lean();

    const mapped = users.map((u) => ({
      username: u.username,
      email: u.email,
      wtk_balance: Number(u.wtk_balance || 0),
      account_state: ['ACTIVE', 'PENDING', 'SUSPENDED', 'INACTIVE', 'BANNED'].includes(String(u.account_state || '').toUpperCase())
        ? String(u.account_state).toUpperCase()
        : 'ACTIVE',
      created_at: u.created_at
    }));

    return res.json(mapped);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch admin users", error: err.message });
  }
});

app.get('/api/admin/profiles', async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('username email created_at')
      .sort({ created_at: -1 })
      .lean();

    return res.json(
      admins.map((u) => ({
        username: u.username,
        email: u.email,
        role: 'ADMIN',
        created_at: u.created_at
      }))
    );
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch admin profiles", error: err.message });
  }
});

app.post('/api/admin/profiles', async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim();
    if (!username) return res.status(400).json({ message: "Missing username" });

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (String(user.role || 'user') === 'admin') {
      return res.status(409).json({ message: "User is already an admin" });
    }

    user.role = 'admin';
    await user.save();

    return res.status(201).json({
      message: "Admin invited successfully",
      user: {
        username: user.username,
        email: user.email,
        role: 'ADMIN'
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Could not invite admin", error: err.message });
  }
});

app.delete('/api/admin/profiles/:username', async (req, res) => {
  try {
    const username = String(req.params?.username || '').trim();
    if (!username) return res.status(400).json({ message: "Missing username" });

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (String(user.role || 'user') !== 'admin') {
      return res.status(400).json({ message: "User is not an admin" });
    }

    user.role = 'user';
    await user.save();

    return res.json({ message: "Admin removed", user: { username: user.username, role: 'USER' } });
  } catch (err) {
    return res.status(500).json({ message: "Could not remove admin", error: err.message });
  }
});

app.patch('/api/admin/users/:username/account-status', async (req, res) => {
  try {
    const username = String(req.params?.username || '').trim();
    const requested = String(req.body?.status || '').trim().toUpperCase();
    if (!username) return res.status(400).json({ message: "Missing username" });

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (String(user.role || 'user') === 'admin') {
      return res.status(403).json({ message: "Cannot change admin account status" });
    }

    const allowed = new Set(['ACTIVE', 'PENDING', 'SUSPENDED', 'INACTIVE', 'BANNED']);
    const current = allowed.has(String(user.account_state || '').toUpperCase())
      ? String(user.account_state).toUpperCase()
      : 'ACTIVE';
    const next = requested && allowed.has(requested)
      ? requested
      : current === 'ACTIVE'
        ? 'PENDING'
        : 'ACTIVE';

    user.account_state = next;
    await user.save();

    if (next === 'INACTIVE' || next === 'BANNED') {
      const listings = await Listing.find({ owner_username: username }).select('_id').lean();
      const listingIds = listings.map((l) => String(l._id || '')).filter(Boolean);
      if (listingIds.length > 0) {
        await Listing.deleteMany({ owner_username: username });
        await removeListingNotifications({ listingIds, ownerUsername: username });
        invalidateCachePrefix('listings:');
        pushEvent(username, 'listing_update', {
          reason: 'bulk_deleted',
          owner_username: username,
          count: listingIds.length
        });
      }
    }

    return res.json({
      message: "User status updated",
      user: {
        username: user.username,
        email: user.email,
        wtk_balance: Number(user.wtk_balance || 0),
        account_state: String(user.account_state || 'ACTIVE').toUpperCase()
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Could not update user status", error: err.message });
  }
});

app.delete('/api/admin/users/:username', async (req, res) => {
  try {
    const username = String(req.params?.username || '').trim();
    if (!username) return res.status(400).json({ message: "Missing username" });

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (String(user.role || 'user') === 'admin') {
      return res.status(403).json({ message: "Cannot delete admin account" });
    }

    const listings = await Listing.find({ owner_username: username }).select('_id').lean();
    const listingIds = listings.map((l) => String(l._id || '')).filter(Boolean);

    await Promise.all([
      Listing.deleteMany({ owner_username: username }),
      Transaction.deleteMany({ username }),
      Message.deleteMany({ $or: [{ sender_username: username }, { receiver_username: username }] }),
      Barter.deleteMany({ $or: [{ sender_username: username }, { receiver_username: username }] }),
      Notification.deleteMany({ $or: [{ recipient_username: username }, { actor_username: username }] }),
      UserReport.deleteMany({ $or: [{ reporter_username: username }, { reported_username: username }] }),
      User.updateMany({}, {
        $pull: {
          friends: username,
          incoming_friend_requests: username,
          outgoing_friend_requests: username,
          dm_approved_users: username,
          blocked_users: username
        }
      }),
      User.deleteOne({ username })
    ]);
    if (listingIds.length > 0) {
      await removeListingNotifications({ listingIds, ownerUsername: username });
      invalidateCachePrefix('listings:');
    }

    return res.json({ message: "User deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Could not delete user", error: err.message });
  }
});

app.get('/api/chat/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const messages = await Message.find({
      $or: [
        {
          $and: [
            { $or: [{ sender_username: username }, { receiver_username: username }] },
            { request_status: 'accepted' }
          ]
        },
        { sender_username: username, request_status: 'pending' }
      ]
    })
      .sort({ created_at: -1 })
      .lean();

    const byUser = new Map();
    for (const msg of messages) {
      const otherUsername =
        msg.sender_username === username ? msg.receiver_username : msg.sender_username;
      if (!byUser.has(otherUsername)) {
        const user = await User.findOne({ username: otherUsername }).select('username status created_at profile_image').lean();
        if (!user) continue;
        byUser.set(otherUsername, {
          ...user,
          unread_count: 0,
          last_message_at: null,
          last_message_text: ''
        });
      }
      const row = byUser.get(otherUsername);

      if (!row.last_message_at) {
        row.last_message_at = msg.created_at;
        row.last_message_text = msg.text;
      }

      if (
        msg.receiver_username === username &&
        msg.sender_username === otherUsername &&
        msg.read_by_receiver !== true
      ) {
        row.unread_count += 1;
      }
    }

    const sorted = Array.from(byUser.values()).sort((a, b) => {
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      if (bTime !== aTime) return bTime - aTime;
      return a.username.localeCompare(b.username);
    });

    return res.json(sorted);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch chat users", error: err.message });
  }
});

app.get('/api/users/:username/wallet', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (typeof user.wtk_balance !== 'number' || Number.isNaN(user.wtk_balance)) {
      user.wtk_balance = 1000;
      await user.save();
    } else if (user.wtk_balance <= 0) {
      const txCount = await Transaction.countDocuments({ username: user.username });
      if (txCount === 0) {
        user.wtk_balance = 1000;
        await user.save();
      }
    }

    return res.json({ username: user.username, wtk_balance: user.wtk_balance });
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch wallet", error: err.message });
  }
});

app.get('/api/users/:username/profile', async (req, res) => {
  try {
    const { username } = req.params;
    const viewerUsername = String(req.query.viewer_username || '').trim();
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });
    const viewer = viewerUsername ? await User.findOne({ username: viewerUsername }).select('blocked_users').lean() : null;
    const isBlockedByViewer = viewerUsername
      ? Array.isArray(viewer?.blocked_users) && viewer.blocked_users.includes(username)
      : false;
    const hasBlockedViewer = viewerUsername
      ? Array.isArray(user.blocked_users) && user.blocked_users.includes(viewerUsername)
      : false;
    const isOwnProfile = viewerUsername && viewerUsername === user.username;
    const isFriend = viewerUsername
      ? Array.isArray(user.friends) && user.friends.includes(viewerUsername)
      : false;
    const isPublicProfile = (user.profile_visibility || 'public') === 'public';
    const canViewListings = !isBlockedByViewer && !hasBlockedViewer && (isOwnProfile || isPublicProfile || isFriend);
    let friendshipStatus = 'none';
    if (isOwnProfile) friendshipStatus = 'self';
    else if (isBlockedByViewer || hasBlockedViewer) friendshipStatus = 'blocked';
    else if (isFriend) friendshipStatus = 'friends';
    else if (viewerUsername && Array.isArray(user.incoming_friend_requests) && user.incoming_friend_requests.includes(viewerUsername)) friendshipStatus = 'request_sent';
    else if (viewerUsername && Array.isArray(user.outgoing_friend_requests) && user.outgoing_friend_requests.includes(viewerUsername)) friendshipStatus = 'request_received';

    const last = user.username_last_changed_at ? new Date(user.username_last_changed_at).getTime() : null;
    const monthMs = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const canChangeUsername = !last || now - last >= monthMs;
    const nextUsernameChangeAt = last ? new Date(last + monthMs) : null;
    const lastEmail = user.email_last_changed_at ? new Date(user.email_last_changed_at).getTime() : null;
    const canChangeEmail = !lastEmail || now - lastEmail >= monthMs;
    const nextEmailChangeAt = lastEmail ? new Date(lastEmail + monthMs) : null;

    return res.json({
      username: user.username,
      email: user.email,
      profile_image: user.profile_image || '',
      location: user.location || '',
      skills: Array.isArray(user.skills) ? user.skills : [],
      radius: Number(user.radius || 15),
      friends_count: Array.isArray(user.friends) ? user.friends.length : 0,
      profile_visibility: isPublicProfile ? 'public' : 'private',
      can_view_listings: canViewListings,
      friendship_status: friendshipStatus,
      is_blocked_by_viewer: isBlockedByViewer,
      has_blocked_viewer: hasBlockedViewer,
      can_change_username: canChangeUsername,
      next_username_change_at: nextUsernameChangeAt,
      can_change_email: canChangeEmail,
      next_email_change_at: nextEmailChangeAt
    });
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch profile", error: err.message });
  }
});

app.get('/api/users/:username/friends', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('friends').lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const friendUsernames = Array.isArray(user.friends) ? user.friends : [];
    if (friendUsernames.length === 0) {
      return res.json({ count: 0, friends: [] });
    }

    const friends = await User.find({ username: { $in: friendUsernames } })
      .select('username profile_image status')
      .lean();

    const byUsername = new Map(friends.map((f) => [f.username, f]));
    const ordered = friendUsernames
      .map((name) => byUsername.get(name))
      .filter(Boolean)
      .map((f) => ({
        username: f.username,
        profile_image: f.profile_image || '',
        status: f.status || 'Verified'
      }));

    return res.json({ count: ordered.length, friends: ordered });
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch friends", error: err.message });
  }
});

app.patch('/api/users/:username/profile', async (req, res) => {
  try {
    const { username } = req.params;
    const {
      username: newUsernameRaw,
      email: newEmailRaw,
      profile_image,
      location,
      skills,
      radius,
      profile_visibility
    } = req.body || {};

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!ensureSelfOrAdmin(req, username)) {
      return res.status(403).json({ message: "Not allowed to edit this profile" });
    }

    const nextUsername = String(newUsernameRaw || '').trim();
    const nextEmail = String(newEmailRaw || '').trim();
    const wantsUsernameChange = nextUsername && nextUsername !== user.username;
    const wantsEmailChange = nextEmail && nextEmail !== user.email;

    if (wantsUsernameChange) {
      const last = user.username_last_changed_at ? new Date(user.username_last_changed_at).getTime() : null;
      const monthMs = 30 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      if (last && now - last < monthMs) {
        const nextAt = new Date(last + monthMs);
        return res.status(400).json({
          message: "Username can be changed only once every 30 days",
          next_username_change_at: nextAt
        });
      }

      const conflict = await User.findOne({ username: nextUsername });
      if (conflict) {
        return res.status(409).json({ message: "Username already taken" });
      }
    }

    if (wantsEmailChange) {
      const last = user.email_last_changed_at ? new Date(user.email_last_changed_at).getTime() : null;
      const monthMs = 30 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      if (last && now - last < monthMs) {
        const nextAt = new Date(last + monthMs);
        return res.status(400).json({
          message: "Email can be changed only once every 30 days",
          next_email_change_at: nextAt
        });
      }

      const conflictEmail = await User.findOne({ email: nextEmail });
      if (conflictEmail) {
        return res.status(409).json({ message: "Email already registered" });
      }
    }

    const oldUsername = user.username;
    if (typeof location === 'string') user.location = location.trim();
    if (typeof profile_image === 'string') user.profile_image = profile_image;
    if (Array.isArray(skills)) user.skills = skills.map((s) => String(s).trim()).filter(Boolean);
    if (radius !== undefined) {
      const parsed = Number(radius);
      if (!Number.isNaN(parsed) && parsed > 0) user.radius = parsed;
    }
    if (profile_visibility === 'public' || profile_visibility === 'private') {
      user.profile_visibility = profile_visibility;
    }

    if (wantsUsernameChange) {
      user.username = nextUsername;
      user.username_last_changed_at = new Date();
    }
    if (wantsEmailChange) {
      user.email = nextEmail;
      user.email_last_changed_at = new Date();
    }
    await user.save();

    if (wantsUsernameChange) {
      await Promise.all([
        Listing.updateMany({ owner_username: oldUsername }, { $set: { owner_username: user.username } }),
        Transaction.updateMany({ username: oldUsername }, { $set: { username: user.username } }),
        Message.updateMany({ sender_username: oldUsername }, { $set: { sender_username: user.username } }),
        Message.updateMany({ receiver_username: oldUsername }, { $set: { receiver_username: user.username } }),
        Barter.updateMany({ sender_username: oldUsername }, { $set: { sender_username: user.username } }),
        Barter.updateMany({ receiver_username: oldUsername }, { $set: { receiver_username: user.username } }),
        User.updateMany({ friends: oldUsername }, { $set: { "friends.$[u]": user.username } }, { arrayFilters: [{ u: oldUsername }] }),
        User.updateMany({ incoming_friend_requests: oldUsername }, { $set: { "incoming_friend_requests.$[u]": user.username } }, { arrayFilters: [{ u: oldUsername }] }),
        User.updateMany({ outgoing_friend_requests: oldUsername }, { $set: { "outgoing_friend_requests.$[u]": user.username } }, { arrayFilters: [{ u: oldUsername }] }),
        User.updateMany({ blocked_users: oldUsername }, { $set: { "blocked_users.$[u]": user.username } }, { arrayFilters: [{ u: oldUsername }] }),
        UserReport.updateMany({ reporter_username: oldUsername }, { $set: { reporter_username: user.username } }),
        UserReport.updateMany({ reported_username: oldUsername }, { $set: { reported_username: user.username } }),
        Notification.updateMany({ recipient_username: oldUsername }, { $set: { recipient_username: user.username } }),
        Notification.updateMany({ actor_username: oldUsername }, { $set: { actor_username: user.username } })
      ]);
    }

    const last = user.username_last_changed_at ? new Date(user.username_last_changed_at).getTime() : null;
    const monthMs = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const canChangeUsername = !last || now - last >= monthMs;
    const nextUsernameChangeAt = last ? new Date(last + monthMs) : null;
    const lastEmail = user.email_last_changed_at ? new Date(user.email_last_changed_at).getTime() : null;
    const canChangeEmail = !lastEmail || now - lastEmail >= monthMs;
    const nextEmailChangeAt = lastEmail ? new Date(lastEmail + monthMs) : null;

    return res.json({
      message: "Profile updated",
      username: user.username,
      email: user.email,
      profile_image: user.profile_image || '',
      location: user.location || '',
      skills: Array.isArray(user.skills) ? user.skills : [],
      radius: Number(user.radius || 15),
      profile_visibility: (user.profile_visibility || 'public') === 'private' ? 'private' : 'public',
      can_change_username: canChangeUsername,
      next_username_change_at: nextUsernameChangeAt,
      can_change_email: canChangeEmail,
      next_email_change_at: nextEmailChangeAt
    });
  } catch (err) {
    return res.status(500).json({ message: "Could not update profile", error: err.message });
  }
});

app.post('/api/friends/request', async (req, res) => {
  try {
    const fromUsername = String(req.body?.from_username || '').trim();
    const toUsername = String(req.body?.to_username || '').trim();
    if (!fromUsername || !toUsername) {
      return res.status(400).json({ message: "Missing usernames" });
    }
    if (fromUsername === toUsername) {
      return res.status(400).json({ message: "Cannot send request to yourself" });
    }

    const [fromUser, toUser] = await Promise.all([
      User.findOne({ username: fromUsername }),
      User.findOne({ username: toUsername })
    ]);
    if (!fromUser || !toUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const isBlockedEitherWay =
      (Array.isArray(fromUser.blocked_users) && fromUser.blocked_users.includes(toUsername)) ||
      (Array.isArray(toUser.blocked_users) && toUser.blocked_users.includes(fromUsername));
    if (isBlockedEitherWay) {
      return res.status(403).json({ message: "Friend request not allowed due to block settings" });
    }

    if (Array.isArray(fromUser.friends) && fromUser.friends.includes(toUsername)) {
      return res.status(400).json({ message: "Already friends" });
    }
    if (Array.isArray(fromUser.outgoing_friend_requests) && fromUser.outgoing_friend_requests.includes(toUsername)) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    fromUser.outgoing_friend_requests = Array.from(new Set([...(fromUser.outgoing_friend_requests || []), toUsername]));
    toUser.incoming_friend_requests = Array.from(new Set([...(toUser.incoming_friend_requests || []), fromUsername]));
    await Promise.all([fromUser.save(), toUser.save()]);

    const exists = await Notification.findOne({
      recipient_username: toUsername,
      actor_username: fromUsername,
      type: 'friend_request',
      read: { $ne: true }
    });

    if (!exists) {
      await Notification.create({
        recipient_username: toUsername,
        actor_username: fromUsername,
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${fromUsername} sent you a friend request.`,
        meta: { requester_username: fromUsername }
      });
      invalidateRealtimeCachesForUser(toUsername);
      pushEvent(toUsername, 'notification_update', {
        reason: 'friend_request',
        actor_username: fromUsername
      });
    }

    return res.status(201).json({ message: "Friend request sent" });
  } catch (err) {
    return res.status(500).json({ message: "Could not send friend request", error: err.message });
  }
});

app.post('/api/friends/accept', async (req, res) => {
  try {
    const recipientUsername = String(req.body?.recipient_username || '').trim();
    const requesterUsername = String(req.body?.requester_username || '').trim();
    if (!recipientUsername || !requesterUsername) {
      return res.status(400).json({ message: "Missing usernames" });
    }

    const [recipient, requester] = await Promise.all([
      User.findOne({ username: recipientUsername }),
      User.findOne({ username: requesterUsername })
    ]);
    if (!recipient || !requester) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!Array.isArray(recipient.incoming_friend_requests) || !recipient.incoming_friend_requests.includes(requesterUsername)) {
      return res.status(400).json({ message: "No pending request from this user" });
    }

    recipient.incoming_friend_requests = (recipient.incoming_friend_requests || []).filter((u) => u !== requesterUsername);
    requester.outgoing_friend_requests = (requester.outgoing_friend_requests || []).filter((u) => u !== recipientUsername);

    recipient.friends = Array.from(new Set([...(recipient.friends || []), requesterUsername]));
    requester.friends = Array.from(new Set([...(requester.friends || []), recipientUsername]));

    recipient.dm_approved_users = Array.from(new Set([...(recipient.dm_approved_users || []), requesterUsername]));
    requester.dm_approved_users = Array.from(new Set([...(requester.dm_approved_users || []), recipientUsername]));

    await Promise.all([recipient.save(), requester.save()]);

    await Message.updateMany(
      {
        $or: [
          {
            sender_username: requesterUsername,
            receiver_username: recipientUsername,
            request_status: 'pending'
          },
          {
            sender_username: recipientUsername,
            receiver_username: requesterUsername,
            request_status: 'pending'
          }
        ]
      },
      {
        $set: {
          request_status: 'accepted',
          delivery_type: 'direct'
        }
      }
    );

    await Notification.updateMany(
      {
        recipient_username: recipientUsername,
        actor_username: requesterUsername,
        type: 'friend_request',
        read: { $ne: true }
      },
      { $set: { read: true } }
    );

    await Notification.create({
      recipient_username: requesterUsername,
      actor_username: recipientUsername,
      type: 'friend_accept',
      title: 'Friend Request Accepted',
      message: `${recipientUsername} accepted your friend request.`,
      meta: { accepter_username: recipientUsername }
    });
    invalidateRealtimeCachesForUser(requesterUsername);
    pushEvent(requesterUsername, 'notification_update', {
      reason: 'friend_accept',
      actor_username: recipientUsername
    });

    return res.json({ message: "Friend request accepted" });
  } catch (err) {
    return res.status(500).json({ message: "Could not accept friend request", error: err.message });
  }
});

app.post('/api/friends/reject', async (req, res) => {
  try {
    const recipientUsername = String(req.body?.recipient_username || '').trim();
    const requesterUsername = String(req.body?.requester_username || '').trim();
    if (!recipientUsername || !requesterUsername) {
      return res.status(400).json({ message: "Missing usernames" });
    }

    const [recipient, requester] = await Promise.all([
      User.findOne({ username: recipientUsername }),
      User.findOne({ username: requesterUsername })
    ]);
    if (!recipient || !requester) {
      return res.status(404).json({ message: "User not found" });
    }

    recipient.incoming_friend_requests = (recipient.incoming_friend_requests || []).filter((u) => u !== requesterUsername);
    requester.outgoing_friend_requests = (requester.outgoing_friend_requests || []).filter((u) => u !== recipientUsername);

    await Promise.all([recipient.save(), requester.save()]);

    await Notification.updateMany(
      {
        recipient_username: recipientUsername,
        actor_username: requesterUsername,
        type: 'friend_request',
        read: { $ne: true }
      },
      { $set: { read: true } }
    );

    return res.json({ message: "Friend request rejected" });
  } catch (err) {
    return res.status(500).json({ message: "Could not reject friend request", error: err.message });
  }
});

app.post('/api/friends/unfriend', async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim();
    const targetUsername = String(req.body?.target_username || '').trim();
    if (!username || !targetUsername) {
      return res.status(400).json({ message: "Missing usernames" });
    }
    if (username === targetUsername) {
      return res.status(400).json({ message: "Invalid unfriend target" });
    }

    const [user, target] = await Promise.all([
      User.findOne({ username }),
      User.findOne({ username: targetUsername })
    ]);
    if (!user || !target) {
      return res.status(404).json({ message: "User not found" });
    }

    user.friends = (user.friends || []).filter((u) => u !== targetUsername);
    target.friends = (target.friends || []).filter((u) => u !== username);
    user.incoming_friend_requests = (user.incoming_friend_requests || []).filter((u) => u !== targetUsername);
    user.outgoing_friend_requests = (user.outgoing_friend_requests || []).filter((u) => u !== targetUsername);
    target.incoming_friend_requests = (target.incoming_friend_requests || []).filter((u) => u !== username);
    target.outgoing_friend_requests = (target.outgoing_friend_requests || []).filter((u) => u !== username);

    await Promise.all([user.save(), target.save()]);

    return res.json({ message: "Unfriended successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Could not unfriend user", error: err.message });
  }
});

app.post('/api/barters', async (req, res) => {
  try {
    const senderUsername = String(req.body?.sender_username || '').trim();
    const receiverUsername = String(req.body?.receiver_username || '').trim();
    const item = String(req.body?.item || '').trim();
    const wtk = Number(req.body?.wtk || 0);

    if (!senderUsername || !receiverUsername || !item) {
      return res.status(400).json({ message: "Missing barter fields" });
    }
    if (senderUsername === receiverUsername) {
      return res.status(400).json({ message: "Cannot create barter with yourself" });
    }

    const [sender, receiver] = await Promise.all([
      User.findOne({ username: senderUsername }),
      User.findOne({ username: receiverUsername })
    ]);
    if (!sender || !receiver) {
      return res.status(404).json({ message: "Sender or receiver not found" });
    }
    const isBlockedEitherWay =
      (Array.isArray(sender.blocked_users) && sender.blocked_users.includes(receiverUsername)) ||
      (Array.isArray(receiver.blocked_users) && receiver.blocked_users.includes(senderUsername));
    if (isBlockedEitherWay) {
      return res.status(403).json({ message: "Barter request not allowed due to block settings" });
    }

    const created = await Barter.create({
      sender_username: senderUsername,
      receiver_username: receiverUsername,
      item,
      wtk: Number.isFinite(wtk) ? wtk : 0,
      status: 'PENDING'
    });

    await Notification.create({
      recipient_username: receiverUsername,
      actor_username: senderUsername,
      type: 'barter_request',
      title: 'New Barter Request',
      message: `${senderUsername} sent a barter request for "${item}".`,
      meta: {
        barter_id: String(created._id),
        item,
        sender_username: senderUsername,
        receiver_username: receiverUsername
      }
    });
    invalidateRealtimeCachesForUser(receiverUsername);
    pushEvent(receiverUsername, 'notification_update', {
      reason: 'barter_request',
      actor_username: senderUsername
    });

    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ message: "Could not create barter", error: err.message });
  }
});

app.get('/api/barters/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const activeOnly = String(req.query.active_only || '').toLowerCase() === 'true';
    const filter = {
      $or: [{ sender_username: username }, { receiver_username: username }]
    };
    if (activeOnly) {
      filter.status = { $in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'AWAITING_PICKUP'] };
    }
    const barters = await Barter.find(filter).sort({ created_at: -1 });
    return res.json(barters);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch barters", error: err.message });
  }
});

app.patch('/api/barters/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const requesterUsername = String(req.body?.requester_username || '').trim();
    const nextStatus = String(req.body?.status || '').trim().toUpperCase();
    const allowed = new Set(['PENDING', 'ACCEPTED', 'DECLINED', 'IN_PROGRESS', 'AWAITING_PICKUP', 'COMPLETED']);

    if (!requesterUsername || !allowed.has(nextStatus)) {
      return res.status(400).json({ message: "Invalid status update payload" });
    }

    const barter = await Barter.findById(id);
    if (!barter) return res.status(404).json({ message: "Barter not found" });

    if (barter.sender_username !== requesterUsername && barter.receiver_username !== requesterUsername) {
      return res.status(403).json({ message: "Not allowed" });
    }

    barter.status = nextStatus;
    await barter.save();

    if (nextStatus === 'ACCEPTED') {
      const recipient =
        requesterUsername === barter.receiver_username
          ? barter.sender_username
          : barter.receiver_username;

      await Notification.create({
        recipient_username: recipient,
        actor_username: requesterUsername,
        type: 'barter_accept',
        title: 'Barter Request Accepted',
        message: `${requesterUsername} accepted your barter request for "${barter.item}".`,
        meta: {
          barter_id: String(barter._id),
          item: barter.item,
          sender_username: barter.sender_username,
          receiver_username: barter.receiver_username
        }
      });
      invalidateRealtimeCachesForUser(recipient);
      pushEvent(recipient, 'notification_update', {
        reason: 'barter_accept',
        actor_username: requesterUsername
      });
    }

    return res.json(barter);
  } catch (err) {
    return res.status(500).json({ message: "Could not update barter status", error: err.message });
  }
});

// 7. TRANSACTIONS ROUTES
app.post('/api/transactions/apply', async (req, res) => {
  try {
    const { username, type, selectedUser, wtk } = req.body;
    const amount = Number(wtk);

    if (!username || !selectedUser || !type || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid transaction payload" });
    }

    const sender = await User.findOne({ username });
    if (!sender) return res.status(404).json({ message: "User not found" });
    if (selectedUser === username) return res.status(400).json({ message: "You cannot send WTK to yourself" });

    const receiver = await User.findOne({ username: selectedUser });
    if (!receiver) return res.status(404).json({ message: "Recipient user not found" });

    if (type === 'spent' && sender.wtk_balance < amount) {
      return res.status(400).json({ message: "Insufficient Balance!" });
    }

    const title = type === 'spent'
      ? `WTK Sent to ${selectedUser}`
      : `WTK Request sent to ${selectedUser}`;
    const status = type === 'spent' ? 'Completed' : 'Pending';
    const nowLabel = new Date().toLocaleString();
    let senderTx;

    if (type === 'spent') {
      sender.wtk_balance -= amount;
      receiver.wtk_balance += amount;
      await sender.save();
      await receiver.save();

      const created = await Transaction.insertMany([
        {
          username,
          type: 'spent',
          title: `WTK Sent to ${selectedUser}`,
          wtk: amount,
          status: 'Completed',
          date: nowLabel
        },
        {
          username: selectedUser,
          type: 'earned',
          title: `WTK Received from ${username}`,
          wtk: amount,
          status: 'Completed',
          date: nowLabel
        }
      ]);
      senderTx = created[0];
    } else {
      const created = await Transaction.insertMany([
        {
          username,
          type,
          title,
          wtk: amount,
          status,
          date: nowLabel
        },
        {
          username: selectedUser,
          type: 'requested',
          title: `WTK Request from ${username}`,
          wtk: amount,
          status: 'Pending',
          date: nowLabel
        }
      ]);
      senderTx = created[0];
    }

    return res.status(201).json({
      message: type === 'spent' ? 'WTK sent successfully!' : 'WTK request sent successfully!',
      wtk_balance: sender.wtk_balance,
      transaction: senderTx
    });
  } catch (err) {
    return res.status(500).json({ message: "Could not save transaction", error: err.message });
  }
});

app.get('/api/transactions/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const transactions = await Transaction.find({ username }).sort({ created_at: -1 });
    return res.json(transactions);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch transactions", error: err.message });
  }
});

app.get('/api/messages/thread/:username/:otherUsername', async (req, res) => {
  try {
    const { username, otherUsername } = req.params;
    const { page, limit, skip, explicit } = getPagination(req, { defaultLimit: 50, maxLimit: 200 });
    const query = {
      $or: [
        {
          $and: [
            {
              $or: [
                { sender_username: username, receiver_username: otherUsername },
                { sender_username: otherUsername, receiver_username: username }
              ]
            },
            { request_status: 'accepted' }
          ]
        },
        { sender_username: username, receiver_username: otherUsername, request_status: 'pending' },
        { sender_username: otherUsername, receiver_username: username, request_status: 'pending' }
      ]
    };
    const [messages, total] = await Promise.all([
      Message.find(query).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
      Message.countDocuments(query)
    ]);
    const ordered = messages.slice().reverse();
    return res.json(explicit ? buildPaginationResponse(ordered, total, page, limit) : ordered);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch messages", error: err.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { sender_username, receiver_username, text, message_type, meta } = req.body;
    const normalizedType = message_type === 'listing_share' ? 'listing_share' : 'text';
    const cleanText = String(text || '').trim();

    if (!sender_username || !receiver_username) {
      return res.status(400).json({ message: "Invalid message payload" });
    }
    if (normalizedType === 'text' && !cleanText) {
      return res.status(400).json({ message: "Message text is required" });
    }
    if (sender_username === receiver_username) {
      return res.status(400).json({ message: "Cannot message yourself" });
    }

    const [senderUser, receiverUser] = await Promise.all([
      User.findOne({ username: sender_username }),
      User.findOne({ username: receiver_username })
    ]);

    if (!senderUser || !receiverUser) {
      return res.status(404).json({ message: "Sender or receiver not found" });
    }
    const isBlockedEitherWay =
      (Array.isArray(senderUser.blocked_users) && senderUser.blocked_users.includes(receiver_username)) ||
      (Array.isArray(receiverUser.blocked_users) && receiverUser.blocked_users.includes(sender_username));
    if (isBlockedEitherWay) {
      return res.status(403).json({ message: "You cannot message this user" });
    }

    const areFriends =
      Array.isArray(senderUser.friends) &&
      senderUser.friends.includes(receiver_username) &&
      Array.isArray(receiverUser.friends) &&
      receiverUser.friends.includes(sender_username);

    const dmApproved =
      (Array.isArray(senderUser.dm_approved_users) && senderUser.dm_approved_users.includes(receiver_username)) ||
      (Array.isArray(receiverUser.dm_approved_users) && receiverUser.dm_approved_users.includes(sender_username));

    const receiverIsPrivate = (receiverUser.profile_visibility || 'public') === 'private';
    if (receiverIsPrivate && !areFriends && !dmApproved) {
      const alreadyRequested =
        Array.isArray(senderUser.outgoing_friend_requests) &&
        senderUser.outgoing_friend_requests.includes(receiver_username);
      if (alreadyRequested) {
        return res.status(403).json({
          code: 'PRIVATE_PROFILE_PENDING_REQUEST',
          message: "This account is private. Wait until your friend request is accepted."
        });
      }
      return res.status(403).json({
        code: 'PRIVATE_PROFILE_REQUEST_REQUIRED',
        message: "This account is private. Send a friend request first."
      });
    }

    const isDirect = areFriends || dmApproved;
    let sharedListing = null;
    let finalText = cleanText;
    if (normalizedType === 'listing_share') {
      const listingId = String(meta?.listing_id || '').trim();
      if (!listingId) {
        return res.status(400).json({ message: "Missing listing_id for share" });
      }
      const listing = await Listing.findById(listingId).lean();
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      sharedListing = {
        listing_id: String(listing._id),
        title: String(listing.title || ''),
        owner_username: String(listing.owner_username || ''),
        wtk: Number(listing.wtk || 0),
        type: listing.type === 'skill' ? 'skill' : 'item',
        image: String(listing.image || ''),
        location: String(listing.location || '')
      };
      if (!finalText) {
        finalText = `Shared a ${sharedListing.type === 'skill' ? 'skill' : 'product'}.`;
      }
    }

    const message = new Message({
      sender_username,
      receiver_username,
      text: finalText,
      message_type: normalizedType,
      shared_listing: sharedListing,
      delivery_type: isDirect ? 'direct' : 'request',
      request_status: isDirect ? 'accepted' : 'pending',
      read_by_receiver: false
    });
    await message.save();

    if (!isDirect) {
      const existingReqNotification = await Notification.findOne({
        recipient_username: receiver_username,
        actor_username: sender_username,
        type: 'message_request',
        read: { $ne: true }
      });

      if (existingReqNotification) {
        existingReqNotification.title = 'New Message Request';
        existingReqNotification.message = `${sender_username}: ${cleanText}`;
        existingReqNotification.meta = {
          sender_username,
          receiver_username,
          message_id: String(message._id)
        };
        existingReqNotification.created_at = new Date();
        await existingReqNotification.save();
      } else {
        await Notification.create({
          recipient_username: receiver_username,
          actor_username: sender_username,
          type: 'message_request',
          title: 'New Message Request',
          message: `${sender_username}: ${cleanText}`,
          meta: {
            sender_username,
            receiver_username,
            message_id: String(message._id)
          }
        });
      }
    }

    invalidateRealtimeCachesForUser(sender_username);
    invalidateRealtimeCachesForUser(receiver_username);
    pushEventToMany([sender_username, receiver_username], 'message_update', {
      sender_username,
      receiver_username
    });
    if (!isDirect) {
      pushEvent(receiver_username, 'notification_update', {
        reason: 'message_request',
        actor_username: sender_username
      });
    }

    return res.status(201).json(message);
  } catch (err) {
    return res.status(500).json({ message: "Could not send message", error: err.message });
  }
});

app.delete('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const requesterUsername = String(req.auth?.username || '').trim();
    const isAdmin = String(req.auth?.role || '') === 'admin';

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (!isAdmin && message.sender_username !== requesterUsername) {
      return res.status(403).json({ message: "Only sender can delete this message" });
    }

    await Message.findByIdAndDelete(id);
    invalidateRealtimeCachesForUser(String(message.sender_username || ''));
    invalidateRealtimeCachesForUser(String(message.receiver_username || ''));
    pushEventToMany([message.sender_username, message.receiver_username], 'message_update', {
      reason: 'deleted',
      message_id: String(id)
    });
    return res.json({ message: "Message deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Could not delete message", error: err.message });
  }
});

app.get('/api/messages/unread-count/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const cacheKey = `msg-unread-count:${username}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);
    const unread = await Message.countDocuments({
      receiver_username: username,
      request_status: 'accepted',
      read_by_receiver: { $ne: true }
    });
    const payload = { username, unread };
    setCache(cacheKey, payload, 5000);
    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch unread count", error: err.message });
  }
});

app.get('/api/messages/unread/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { page, limit, skip, explicit } = getPagination(req, { defaultLimit: 25, maxLimit: 100 });
    const query = {
      receiver_username: username,
      request_status: 'accepted',
      read_by_receiver: { $ne: true }
    };
    const [unread, total] = await Promise.all([
      Message.find(query).sort({ created_at: -1 }).skip(skip).limit(limit),
      Message.countDocuments(query)
    ]);
    return res.json(explicit ? buildPaginationResponse(unread, total, page, limit) : unread);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch unread messages", error: err.message });
  }
});

app.get('/api/messages', async (req, res) => {
  try {
    const username = String(req.query?.username || '').trim();
    const otherUsername = String(req.query?.other_username || '').trim();
    const mode = String(req.query?.mode || 'inbox').trim().toLowerCase();
    const { page, limit, skip } = getPagination(req, { defaultLimit: 25, maxLimit: 100 });

    const query = {};
    if (mode === 'thread' && otherUsername) {
      query.$or = [
        { sender_username: username, receiver_username: otherUsername },
        { sender_username: otherUsername, receiver_username: username }
      ];
    } else if (mode === 'sent') {
      query.sender_username = username;
    } else {
      query.$or = [{ sender_username: username }, { receiver_username: username }];
    }

    const [rows, total] = await Promise.all([
      Message.find(query).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
      Message.countDocuments(query)
    ]);
    return res.json(buildPaginationResponse(rows, total, page, limit));
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch messages", error: err.message });
  }
});

app.patch('/api/messages/read-thread/:username/:otherUsername', async (req, res) => {
  try {
    const { username, otherUsername } = req.params;
    if (!ensureSelfOrAdmin(req, username)) {
      return res.status(403).json({ message: "Not allowed to modify this thread" });
    }
    const result = await Message.updateMany(
      {
        receiver_username: username,
        sender_username: otherUsername,
        request_status: 'accepted',
        read_by_receiver: { $ne: true }
      },
      { $set: { read_by_receiver: true } }
    );
    invalidateRealtimeCachesForUser(username);
    pushEventToMany([username, otherUsername], 'message_update', {
      reason: 'read_thread',
      username,
      other_username: otherUsername
    });
    return res.json({ updated: result.modifiedCount || 0 });
  } catch (err) {
    return res.status(500).json({ message: "Could not mark thread as read", error: err.message });
  }
});

app.patch('/api/messages/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const requesterUsername = String(req.auth?.username || '').trim();
    const isAdmin = String(req.auth?.role || '') === 'admin';

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: "Message not found" });
    if (!isAdmin && message.receiver_username !== requesterUsername) {
      return res.status(403).json({ message: "Not allowed" });
    }
    if (message.request_status === 'rejected') {
      return res.status(400).json({ message: "Rejected message cannot be marked as read" });
    }
    if (message.read_by_receiver === true) {
      return res.json({ message: "Already read" });
    }

    message.read_by_receiver = true;
    await message.save();
    invalidateRealtimeCachesForUser(String(message.receiver_username || ''));
    pushEventToMany([message.sender_username, message.receiver_username], 'message_update', {
      reason: 'read_single',
      message_id: String(id)
    });
    return res.json({ message: "Message marked as read" });
  } catch (err) {
    return res.status(500).json({ message: "Could not mark message as read", error: err.message });
  }
});

app.patch('/api/messages/read-all/:username', async (req, res) => {
  try {
    const { username } = req.params;
    if (!ensureSelfOrAdmin(req, username)) {
      return res.status(403).json({ message: "Not allowed to modify this inbox" });
    }
    const result = await Message.updateMany(
      {
        receiver_username: username,
        request_status: 'accepted',
        read_by_receiver: { $ne: true }
      },
      { $set: { read_by_receiver: true } }
    );
    invalidateRealtimeCachesForUser(username);
    pushEvent(username, 'message_update', { reason: 'read_all', username });
    return res.json({ updated: result.modifiedCount || 0 });
  } catch (err) {
    return res.status(500).json({ message: "Could not mark all messages as read", error: err.message });
  }
});

app.get('/api/messages/requests/:username', async (req, res) => {
  try {
    const { username } = req.params;
    if (!ensureSelfOrAdmin(req, username)) {
      return res.status(403).json({ message: "Not allowed to access these message requests" });
    }
    const pending = await Message.find({
      receiver_username: username,
      request_status: 'pending'
    })
      .sort({ created_at: -1 })
      .lean();

    const grouped = new Map();
    for (const msg of pending) {
      const key = msg.sender_username;
      if (!grouped.has(key)) {
        grouped.set(key, {
          sender_username: key,
          count: 0,
          latest_text: msg.text,
          latest_at: msg.created_at
        });
      }
      const row = grouped.get(key);
      row.count += 1;
      if (new Date(msg.created_at).getTime() > new Date(row.latest_at).getTime()) {
        row.latest_text = msg.text;
        row.latest_at = msg.created_at;
      }
    }

    return res.json(Array.from(grouped.values()).sort((a, b) => new Date(b.latest_at) - new Date(a.latest_at)));
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch message requests", error: err.message });
  }
});

app.patch('/api/messages/requests/:username/:senderUsername/accept', async (req, res) => {
  try {
    const { username, senderUsername } = req.params;
    if (!ensureSelfOrAdmin(req, username)) {
      return res.status(403).json({ message: "Not allowed to accept these message requests" });
    }
    const [receiverUser, senderUser] = await Promise.all([
      User.findOne({ username }),
      User.findOne({ username: senderUsername })
    ]);
    if (!receiverUser || !senderUser) {
      return res.status(404).json({ message: "User not found" });
    }

    receiverUser.dm_approved_users = Array.from(
      new Set([...(receiverUser.dm_approved_users || []), senderUsername])
    );
    senderUser.dm_approved_users = Array.from(
      new Set([...(senderUser.dm_approved_users || []), username])
    );
    await Promise.all([receiverUser.save(), senderUser.save()]);

    const result = await Message.updateMany(
      {
        $or: [
          {
            sender_username: senderUsername,
            receiver_username: username,
            request_status: 'pending'
          },
          {
            sender_username: username,
            receiver_username: senderUsername,
            request_status: 'pending'
          }
        ]
      },
      {
        $set: {
          request_status: 'accepted',
          delivery_type: 'direct'
        }
      }
    );
    await Notification.updateMany(
      {
        recipient_username: username,
        actor_username: senderUsername,
        type: 'message_request',
        read: { $ne: true }
      },
      { $set: { read: true } }
    );
    invalidateRealtimeCachesForUser(username);
    invalidateRealtimeCachesForUser(senderUsername);
    pushEventToMany([username, senderUsername], 'message_update', {
      reason: 'request_accepted',
      username,
      sender_username: senderUsername
    });
    pushEvent(username, 'notification_update', { reason: 'request_accepted' });
    return res.json({ updated: result.modifiedCount || 0 });
  } catch (err) {
    return res.status(500).json({ message: "Could not accept message request", error: err.message });
  }
});

app.patch('/api/messages/requests/:username/:senderUsername/reject', async (req, res) => {
  try {
    const { username, senderUsername } = req.params;
    if (!ensureSelfOrAdmin(req, username)) {
      return res.status(403).json({ message: "Not allowed to reject these message requests" });
    }
    const result = await Message.updateMany(
      {
        sender_username: senderUsername,
        receiver_username: username,
        request_status: 'pending'
      },
      {
        $set: {
          request_status: 'rejected'
        }
      }
    );
    await Notification.updateMany(
      {
        recipient_username: username,
        actor_username: senderUsername,
        type: 'message_request',
        read: { $ne: true }
      },
      { $set: { read: true } }
    );
    invalidateRealtimeCachesForUser(username);
    invalidateRealtimeCachesForUser(senderUsername);
    pushEventToMany([username, senderUsername], 'message_update', {
      reason: 'request_rejected',
      username,
      sender_username: senderUsername
    });
    pushEvent(username, 'notification_update', { reason: 'request_rejected' });
    return res.json({ updated: result.modifiedCount || 0 });
  } catch (err) {
    return res.status(500).json({ message: "Could not reject message request", error: err.message });
  }
});

app.get('/api/notifications/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { page, limit, skip, explicit } = getPagination(req, { defaultLimit: 25, maxLimit: 100 });
    const query = {
      recipient_username: username,
      read: { $ne: true }
    };
    const [items, total] = await Promise.all([
      Notification.find(query).sort({ created_at: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(query)
    ]);
    return res.json(explicit ? buildPaginationResponse(items, total, page, limit) : items);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch notifications", error: err.message });
  }
});

app.get('/api/notifications/unread-count/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const cacheKey = `notif-unread-count:${username}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);
    const unread = await Notification.countDocuments({
      recipient_username: username,
      read: { $ne: true }
    });
    const payload = { username, unread };
    setCache(cacheKey, payload, 5000);
    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch notification count", error: err.message });
  }
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { requester_username } = req.body || {};
    if (!requester_username) {
      return res.status(400).json({ message: "Missing requester_username" });
    }

    const item = await Notification.findById(id);
    if (!item) return res.status(404).json({ message: "Notification not found" });
    if (item.recipient_username !== requester_username) {
      return res.status(403).json({ message: "Not allowed" });
    }

    item.read = true;
    await item.save();
    invalidateRealtimeCachesForUser(String(item.recipient_username || ''));
    pushEvent(String(item.recipient_username || ''), 'notification_update', {
      reason: 'read_single',
      notification_id: String(id)
    });
    return res.json({ message: "Notification marked as read" });
  } catch (err) {
    return res.status(500).json({ message: "Could not mark notification as read", error: err.message });
  }
});

app.patch('/api/notifications/read-all/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const result = await Notification.updateMany(
      { recipient_username: username, read: { $ne: true } },
      { $set: { read: true } }
    );
    invalidateRealtimeCachesForUser(username);
    pushEvent(username, 'notification_update', { reason: 'read_all', username });
    return res.json({ updated: result.modifiedCount || 0 });
  } catch (err) {
    return res.status(500).json({ message: "Could not mark all notifications as read", error: err.message });
  }
});

app.post('/api/users/block', async (req, res) => {
  try {
    const blockerUsername = String(req.body?.blocker_username || '').trim();
    const targetUsername = String(req.body?.target_username || '').trim();
    if (!blockerUsername || !targetUsername) {
      return res.status(400).json({ message: "Missing usernames" });
    }
    if (blockerUsername === targetUsername) {
      return res.status(400).json({ message: "Cannot block yourself" });
    }

    const [blocker, target] = await Promise.all([
      User.findOne({ username: blockerUsername }),
      User.findOne({ username: targetUsername })
    ]);
    if (!blocker || !target) {
      return res.status(404).json({ message: "User not found" });
    }

    blocker.blocked_users = Array.from(new Set([...(blocker.blocked_users || []), targetUsername]));

    blocker.friends = (blocker.friends || []).filter((u) => u !== targetUsername);
    target.friends = (target.friends || []).filter((u) => u !== blockerUsername);
    blocker.incoming_friend_requests = (blocker.incoming_friend_requests || []).filter((u) => u !== targetUsername);
    blocker.outgoing_friend_requests = (blocker.outgoing_friend_requests || []).filter((u) => u !== targetUsername);
    target.incoming_friend_requests = (target.incoming_friend_requests || []).filter((u) => u !== blockerUsername);
    target.outgoing_friend_requests = (target.outgoing_friend_requests || []).filter((u) => u !== blockerUsername);
    blocker.dm_approved_users = (blocker.dm_approved_users || []).filter((u) => u !== targetUsername);
    target.dm_approved_users = (target.dm_approved_users || []).filter((u) => u !== blockerUsername);

    await Promise.all([blocker.save(), target.save()]);
    return res.json({ message: "User blocked successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Could not block user", error: err.message });
  }
});

app.post('/api/users/unblock', async (req, res) => {
  try {
    const blockerUsername = String(req.body?.blocker_username || '').trim();
    const targetUsername = String(req.body?.target_username || '').trim();
    if (!blockerUsername || !targetUsername) {
      return res.status(400).json({ message: "Missing usernames" });
    }
    const blocker = await User.findOne({ username: blockerUsername });
    if (!blocker) return res.status(404).json({ message: "User not found" });
    blocker.blocked_users = (blocker.blocked_users || []).filter((u) => u !== targetUsername);
    await blocker.save();
    return res.json({ message: "User unblocked successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Could not unblock user", error: err.message });
  }
});

app.get('/api/users/:username/blocked', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('blocked_users').lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const blockedUsernames = Array.isArray(user.blocked_users) ? user.blocked_users : [];
    if (blockedUsernames.length === 0) {
      return res.json({ count: 0, users: [] });
    }

    const blockedUsers = await User.find({ username: { $in: blockedUsernames } })
      .select('username status profile_image')
      .lean();
    const byUsername = new Map(blockedUsers.map((u) => [u.username, u]));
    const ordered = blockedUsernames
      .map((name) => byUsername.get(name))
      .filter(Boolean)
      .map((u) => ({
        username: u.username,
        status: u.status || 'Verified',
        profile_image: u.profile_image || ''
      }));

    return res.json({ count: ordered.length, users: ordered });
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch blocked users", error: err.message });
  }
});

app.post('/api/reports/user', async (req, res) => {
  try {
    const reporterUsername = String(req.body?.reporter_username || '').trim();
    const reportedUsername = String(req.body?.reported_username || '').trim();
    const reason = String(req.body?.reason || '').trim();
    const details = String(req.body?.details || '').trim();
    if (!reporterUsername || !reportedUsername || !reason) {
      return res.status(400).json({ message: "Missing report fields" });
    }
    if (reporterUsername === reportedUsername) {
      return res.status(400).json({ message: "Invalid report target" });
    }

    const [reporter, reported] = await Promise.all([
      User.findOne({ username: reporterUsername }).select('username').lean(),
      User.findOne({ username: reportedUsername }).select('username').lean()
    ]);
    if (!reporter || !reported) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingOpen = await UserReport.findOne({
      reporter_username: reporterUsername,
      reported_username: reportedUsername,
      reason,
      status: 'open'
    }).lean();
    if (existingOpen) {
      return res.status(409).json({ message: "You already submitted this report" });
    }

    const created = await UserReport.create({
      reporter_username: reporterUsername,
      reported_username: reportedUsername,
      reason,
      details,
      status: 'open'
    });

    return res.status(201).json({ message: "Report submitted", report: created });
  } catch (err) {
    return res.status(500).json({ message: "Could not submit report", error: err.message });
  }
});

app.get('/api/admin/reports', async (req, res) => {
  try {
    const status = String(req.query?.status || '').trim().toLowerCase();
    const query = {};
    if (status === 'open' || status === 'reviewed' || status === 'dismissed') {
      query.status = status;
    }
    const reports = await UserReport.find(query).sort({ created_at: -1 }).lean();
    return res.json(reports);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch reports", error: err.message });
  }
});

app.patch('/api/admin/reports/:reportId/status', async (req, res) => {
  try {
    const reportId = String(req.params?.reportId || '').trim();
    const nextStatus = String(req.body?.status || '').trim().toLowerCase();
    if (!reportId || !mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({ message: "Invalid report id" });
    }
    if (nextStatus !== 'reviewed' && nextStatus !== 'dismissed' && nextStatus !== 'open') {
      return res.status(400).json({ message: "Invalid report status" });
    }

    const updated = await UserReport.findByIdAndUpdate(
      reportId,
      { $set: { status: nextStatus } },
      { new: true }
    ).lean();
    if (!updated) {
      return res.status(404).json({ message: "Report not found" });
    }
    return res.json({ message: "Report updated", report: updated });
  } catch (err) {
    return res.status(500).json({ message: "Could not update report", error: err.message });
  }
});

app.get('/api/admin/dashboard/metrics', async (req, res) => {
  try {
    const [users, reportsOpen] = await Promise.all([
      User.find().select('wtk_balance role').lean(),
      UserReport.countDocuments({ status: 'open' })
    ]);

    const totalEconomyWtk = users.reduce((acc, u) => acc + Number(u.wtk_balance || 0), 0);
    const activeUsers = users.filter((u) => String(u.role || 'user') !== 'admin').length;
    const uptimeSeconds = Math.floor(process.uptime());
    const uptimePercent = 99.9;

    return res.json({
      total_economy_wtk: totalEconomyWtk,
      active_users: activeUsers,
      reports_count: Number(reportsOpen || 0),
      uptime_percent: uptimePercent,
      uptime_seconds: uptimeSeconds
    });
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch admin metrics", error: err.message });
  }
});

app.get('/api/admin/dashboard/alerts', async (req, res) => {
  try {
    const openReports = await UserReport.find({ status: 'open' })
      .sort({ created_at: -1 })
      .limit(8)
      .lean();

    const alerts = openReports.map((r) => ({
      id: String(r._id),
      severity: 'high',
      message: `User report: ${r.reporter_username} reported ${r.reported_username} (${r.reason}).`,
      created_at: r.created_at,
      action_label: 'Investigate',
      action_route: '/admin/profiles',
      meta: {
        report_id: String(r._id),
        reporter_username: r.reporter_username,
        reported_username: r.reported_username
      }
    }));

    return res.json(alerts);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch admin alerts", error: err.message });
  }
});

app.get('/api/admin/analytics/live', async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7Start = new Date(startOfToday);
    last7Start.setDate(last7Start.getDate() - 6);

    const [txRows, barterRows, notifRows, reportRows, userRows] = await Promise.all([
      Transaction.find({ created_at: { $gte: last7Start } }).select('username created_at type title').lean(),
      Barter.find({ created_at: { $gte: last7Start } }).select('sender_username receiver_username created_at status item').lean(),
      Notification.find({ created_at: { $gte: last7Start } }).select('actor_username created_at type title message').lean(),
      UserReport.find({ created_at: { $gte: last7Start } }).select('reporter_username reported_username created_at reason').lean(),
      User.find({ created_at: { $gte: last7Start } }).select('username created_at').lean()
    ]);

    const labels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const dayBuckets = new Map();
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(last7Start);
      d.setDate(d.getDate() + i);
      dayBuckets.set(d.toDateString(), 0);
    }

    const countRow = (dateValue) => {
      const d = new Date(dateValue);
      const k = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString();
      if (!dayBuckets.has(k)) return;
      dayBuckets.set(k, Number(dayBuckets.get(k) || 0) + 1);
    };

    txRows.forEach((r) => countRow(r.created_at));
    barterRows.forEach((r) => countRow(r.created_at));
    notifRows.forEach((r) => countRow(r.created_at));
    reportRows.forEach((r) => countRow(r.created_at));
    userRows.forEach((r) => countRow(r.created_at));

    const trend = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(last7Start);
      d.setDate(d.getDate() + i);
      const key = d.toDateString();
      const jsDay = d.getDay(); // 0 Sun ... 6 Sat
      const label = labels[(jsDay + 6) % 7];
      trend.push({ day: label, value: Number(dayBuckets.get(key) || 0) });
    }

    const pulse = [];
    txRows.forEach((t) => {
      pulse.push({
        created_at: t.created_at,
        user: t.username,
        action: t.type === 'spent' ? 'Transaction Sent' : t.type === 'earned' ? 'Transaction Received' : 'Transaction Request',
        kind: 'tx'
      });
    });
    barterRows.forEach((b) => {
      pulse.push({
        created_at: b.created_at,
        user: b.sender_username,
        action: b.status === 'PENDING' ? 'New Barter' : `Barter ${String(b.status || '').toLowerCase()}`,
        kind: 'barter'
      });
    });
    reportRows.forEach((r) => {
      pulse.push({
        created_at: r.created_at,
        user: r.reporter_username,
        action: `Reported ${r.reported_username}`,
        kind: 'report'
      });
    });
    userRows.forEach((u) => {
      pulse.push({
        created_at: u.created_at,
        user: u.username,
        action: 'Joined',
        kind: 'user'
      });
    });

    pulse.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return res.json({
      trend,
      pulse: pulse.slice(0, 12)
    });
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch live analytics", error: err.message });
  }
});

// 8. LISTINGS ROUTES
app.post('/api/listings', async (req, res) => {
  try {
    const { owner_username, title, wtk, location, description, image, type } = req.body;
    if (!owner_username || !title || !wtk || !location) {
      return res.status(400).json({ message: "Missing required listing fields" });
    }

    const newListing = new Listing({
      owner_username,
      title,
      wtk: Number(wtk),
      location,
      description: description || '',
      image: image || '',
      type: type === 'skill' ? 'skill' : 'item'
    });

    await newListing.save();

    const otherUsers = await User.find({ username: { $ne: owner_username } }).select('username').lean();
    if (otherUsers.length > 0) {
      const notifications = otherUsers.map((u) => ({
        recipient_username: u.username,
        actor_username: owner_username,
        type: 'listing',
        title: 'New Listing Posted',
        message: `${owner_username} posted "${title}" for ${Number(wtk)} WTK.`,
        meta: {
          listing_id: String(newListing._id),
          listing_title: title,
          owner_username
        },
        read: false
      }));
      await Notification.insertMany(notifications);
      otherUsers.forEach((u) => invalidateRealtimeCachesForUser(u.username));
      pushEventToMany(otherUsers.map((u) => u.username), 'notification_update', {
        reason: 'new_listing',
        actor_username: owner_username
      });
    }

    invalidateCachePrefix('listings:');
    pushEvent(owner_username, 'listing_update', { reason: 'created' });

    return res.status(201).json({ message: "Listing created", listing: newListing });
  } catch (err) {
    return res.status(500).json({ message: "Could not create listing", error: err.message });
  }
});

app.get('/api/listings', async (req, res) => {
  try {
    const { page, limit, skip, explicit } = getPagination(req, { defaultLimit: 20, maxLimit: 100 });
    const cacheKey = `listings:page=${page}:limit=${limit}:explicit=${explicit ? 1 : 0}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const [listings, total] = await Promise.all([
      Listing.find().sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
      Listing.countDocuments()
    ]);

    const payload = explicit
      ? buildPaginationResponse(listings, total, page, limit)
      : listings;
    setCache(cacheKey, payload, 20000);
    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch listings", error: err.message });
  }
});

app.get('/api/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id).lean();
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    return res.json(listing);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch listing", error: err.message });
  }
});

app.get('/api/listings/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const viewerUsername = String(req.query.viewer_username || '').trim();
    const owner = await User.findOne({ username }).select('username profile_visibility friends blocked_users').lean();
    if (!owner) {
      return res.status(404).json({ message: "User not found" });
    }
    const isOwn = viewerUsername && viewerUsername === username;
    const isPublic = (owner.profile_visibility || 'public') === 'public';
    const isFriend = viewerUsername ? Array.isArray(owner.friends) && owner.friends.includes(viewerUsername) : false;
    const viewer = viewerUsername ? await User.findOne({ username: viewerUsername }).select('blocked_users').lean() : null;
    const isBlockedByViewer = viewerUsername
      ? Array.isArray(viewer?.blocked_users) && viewer.blocked_users.includes(username)
      : false;
    const hasBlockedViewer = viewerUsername
      ? Array.isArray(owner.blocked_users) && owner.blocked_users.includes(viewerUsername)
      : false;
    if (isBlockedByViewer || hasBlockedViewer || (!isOwn && !isPublic && !isFriend)) {
      return res.json([]);
    }
    const listings = await Listing.find({ owner_username: username }).sort({ created_at: -1 });
    return res.json(listings);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch user listings", error: err.message });
  }
});

app.delete('/api/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const isAdmin = String(req.auth?.role || '') === 'admin';
    const authUsername = String(req.auth?.username || '').trim();
    if (!isAdmin && String(listing.owner_username || '') !== authUsername) {
      return res.status(403).json({ message: "Only listing owner can delete this listing" });
    }

    await Listing.findByIdAndDelete(id);
    await removeListingNotifications({
      listingIds: [String(id)],
      ownerUsername: String(listing.owner_username || '')
    });
    invalidateCachePrefix('listings:');
    pushEvent(String(listing.owner_username || ''), 'listing_update', { reason: 'deleted', listing_id: String(id) });
    return res.json({ message: "Listing deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Could not delete listing", error: err.message });
  }
});

app.use('/api', (req, res, next) => {
  return next(new ApiError(404, 'NOT_FOUND', 'API route not found', { path: req.originalUrl }));
});

app.use((err, req, res, next) => {
  const status = Number(err?.status || 500);
  const code = String(err?.code || statusToCode(status));
  const message = String(err?.message || 'Internal server error');
  const details = err?.details || (status >= 500 ? null : (err?.error || null));
  const requestId = req.requestId || null;
  const responseDetails =
    details && typeof details === 'object'
      ? { ...details, request_id: requestId }
      : { request_id: requestId, details: details || null };

  logStructured(status >= 500 ? 'error' : 'info', 'request_error', {
    request_id: requestId,
    method: req.method,
    path: req.originalUrl,
    status,
    code,
    message,
    stack: status >= 500 && err?.stack ? String(err.stack) : undefined
  });

  return res.status(status).json({
    code,
    message,
    details: responseDetails
  });
});

let httpServer = null;
async function startServer() {
  await connectDatabase();
  if (httpServer) return httpServer;
  httpServer = app.listen(PORT, () => {
    logStructured('info', 'server_started', { port: PORT });
  });
  return httpServer;
}

if (require.main === module) {
  startServer().catch((err) => {
    logStructured('error', 'server_startup_failed', {
      message: err?.message || 'Startup failed',
      stack: err?.stack ? String(err.stack) : undefined
    });
    process.exit(1);
  });
}

module.exports = {
  app,
  startServer,
  connectDatabase,
  models: {
    User,
    Listing,
    Transaction,
    Message,
    Barter,
    Notification,
    UserReport
  }
};
