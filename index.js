const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db.js');
const ejs = require('ejs');
const engine = require('ejs-mate');
const path = require('path');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware & Configurations
app.use(cors());
app.engine('ejs', engine);
app.set('view engine', 'ejs');

// ✅ Serve static files from the .well-known directory for Apple Pay verification
app.use('/.well-known', express.static(path.join(__dirname, '.well-known')));

// ✅ Tell Express where to find views
app.set('views', [
  path.join(__dirname, 'views'),
  path.join(__dirname, 'modules/payment/views')
]);

// Parse JSON bodies
app.use(express.json());

// Root route (basic health check / welcome message)
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to PayPass Backend API! 🚀',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      api: '/api',
      test: '/api/test',
      health: '/api/health',
      users: '/api/users',
      cars: '/api/cars',
      packages: '/api/packages',
      payments: '/api/payments'
    }
  });
});

// API Routes
app.use('/', require('./routes/index.js'));

// 404 handler (when no route matches)
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableRoutes: ['/', '/api', '/api/test', '/api/health']
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at: http://localhost:${PORT}/api`);
  console.log(`🔍 Test endpoint: http://localhost:${PORT}/api/test`);
});
