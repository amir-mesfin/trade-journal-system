require('dotenv').config();

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { configure: configureCloudinary, configured: cloudinaryReady } = require('./utils/cloudinary');

configureCloudinary();

const authRoutes = require('./routes/auth');
const tradesRoutes = require('./routes/trades');
const statsRoutes = require('./routes/stats');
const journalRoutes = require('./routes/journal');
const reportsRoutes = require('./routes/reports');
const insightsRoutes = require('./routes/insights');

const app = express();

// Default cors() uses Allow-Origin: * — browsers block that when the request uses
// Authorization (or other non-simple headers). Reflect the request Origin instead.
const corsOptions = {
  origin: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

function normalizeOrigin(url) {
  if (!url || typeof url !== 'string') return '';
  let s = url.trim();
  // Browsers send Origin without a trailing slash; env often mistakenly includes one
  while (s.endsWith('/')) s = s.slice(0, -1);
  return s;
}

const LOCAL_DEV_ORIGINS = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
]);

const rawCors = process.env.CORS_ORIGINS?.trim();
// CORS_ORIGINS=* → allow any browser origin (reflect Origin; same as leaving unset)
if (rawCors && rawCors !== '*') {
  const allowed = new Set([
    ...LOCAL_DEV_ORIGINS,
    ...rawCors.split(',').map((s) => normalizeOrigin(s)).filter(Boolean),
  ]);
  corsOptions.origin = (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowed.has(normalizeOrigin(origin))) return callback(null, true);
    callback(null, false);
  };
}
app.use(cors(corsOptions));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    dbReady: mongoose.connection.readyState === 1,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/trades', tradesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/insights', insightsRoutes);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Set MONGODB_URI in backend/.env (see .env.example)');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('Set JWT_SECRET in backend/.env');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');
    const Trade = require('./models/Trade');
    try {
      await Trade.syncIndexes();
    } catch (e) {
      console.error('Trade.syncIndexes failed (fix indexes in Atlas if needed):', e.message);
    }
    if (cloudinaryReady()) console.log('Cloudinary ready for image uploads');
    else console.log('Cloudinary not set — trade images require CLOUDINARY_* in .env');
    app.listen(PORT, () => {
      console.log(`API http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
