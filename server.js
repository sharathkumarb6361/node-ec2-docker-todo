require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`================================================`);
  console.log(`🚀 TaskPulse ToDo Server running on Port ${PORT}`);
  console.log(`🌐 Application URL: http://localhost:${PORT}`);
  console.log(`🩺 Health Check: http://localhost:${PORT}/health`);
  console.log(`================================================`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: Closing HTTP server gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
