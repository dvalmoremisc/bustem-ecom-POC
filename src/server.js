const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const collectRoutes = require('./routes/collect');
const apiRoutes = require('./routes/api');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve the tracking script
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api', collectRoutes);
app.use('/api', apiRoutes);

// Serve dashboard in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dashboard/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dashboard/dist/index.html'));
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`📡 Tracking script: http://localhost:${PORT}/protect.js`);
});

