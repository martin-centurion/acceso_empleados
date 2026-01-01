require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const branchRoutes = require('./routes/branches');
const attendanceRoutes = require('./routes/attendance');
const reportRoutes = require('./routes/reports');
const { requireAdmin } = require('./middleware/auth');

const app = express();

const rawOrigins = process.env.CORS_ORIGIN || '*';
const allowedOrigins = rawOrigins
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const corsOptions =
  allowedOrigins.length === 0 || allowedOrigins.includes('*')
    ? { origin: '*' }
    : {
        origin(origin, callback) {
          if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
          return callback(null, false);
        },
      };

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api', authRoutes);
app.use('/api', attendanceRoutes);

app.use('/api', requireAdmin, employeeRoutes);
app.use('/api', requireAdmin, branchRoutes);
app.use('/api', requireAdmin, reportRoutes);

const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

module.exports = app;
