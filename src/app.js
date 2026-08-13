const express = require('express');
const path = require('path');
const cors = require('cors');
const todoRoutes = require('./routes/todos');
const itemRoutes = require('./routes/items');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend UI assets
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    application: 'TaskPulse ToDo Website',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});


// API Routes
app.use('/api/todos', todoRoutes);
app.use('/api/items', itemRoutes);

// Catch-all for API 404
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API Route Not Found' });
});

// Serve frontend SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;
