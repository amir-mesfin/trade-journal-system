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

const app = express();
app.use(cors());
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
  .then(() => {
    console.log('MongoDB connected');
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
