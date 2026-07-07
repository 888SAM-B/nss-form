require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const connectDB = require('./config/db');
const seedData = require('./utils/seeder');
const { apiLimiter } = require('./middlewares/rateLimiter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Connect Database
connectDB().then(() => {
  seedData();
});

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Custom NoSQL Injection + XSS sanitization (body only — req.query is read-only in Express 5)
app.use((req, _res, next) => {
  const sanitizeKeys = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    for (const key of Object.keys(obj)) {
      if (/^\$/.test(key) || key.includes('.')) {
        delete obj[key];
      } else {
        sanitizeKeys(obj[key]);
      }
    }
    return obj;
  };
  if (req.body) sanitizeKeys(req.body);
  next();
});

app.use((req, _res, next) => {
  const sanitize = (data) => {
    if (typeof data === 'string') return data.replace(/[<>]/g, '');
    if (Array.isArray(data)) return data.map(sanitize);
    if (typeof data === 'object' && data !== null) {
      for (const key in data) { data[key] = sanitize(data[key]); }
    }
    return data;
  };
  if (req.body) sanitize(req.body);
  next();
});

// Rate limiter
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`NSS Quarterly Report Server running on port ${PORT}`);
});
