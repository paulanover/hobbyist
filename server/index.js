const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const https = require('https'); // Import the https module
const fs = require('fs'); // Import the file system module
const path = require('path'); // Import the path module

const authRoutes = require('./routes/authRoutes');
const lawyerRoutes = require('./routes/lawyerRoutes');
const matterRoutes = require('./routes/matterRoutes'); // Import matter routes
const clientRoutes = require('./routes/clientRoutes');
const timeEntryRoutes = require('./routes/timeEntryRoutes');
const userRoutes = require('./routes/userRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Load environment variables
dotenv.config();
console.log('Environment loaded, PORT:', process.env.PORT);
// Determine allowed origins for CORS
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = isProduction && process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(origin => origin.trim())
  : [
      'https://localhost:5173',
      'http://localhost:5173',
      'https://localhost:5174',
      'http://localhost:5174'
    ];
console.log('Allowed origins for CORS:', allowedOrigins);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

// Initialize express app
const app = express();

// --- HTTPS/HTTP Server Configuration ---
const certPath = path.resolve(__dirname, '../localhost+2.pem'); // Path relative to index.js
const keyPath = path.resolve(__dirname, '../localhost+2-key.pem'); // Path relative to index.js

let httpsOptions = null;
try {
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    console.log('HTTPS certificates found and loaded (for local development only).');
  } else {
    console.warn('HTTPS certificates not found at project root. Will use HTTP for local development.');
  }
} catch (err) {
  console.error('Error reading HTTPS certificates:', err);
  console.warn('Will use HTTP for local development.');
}
// --- End HTTPS/HTTP Server Configuration ---


// --- End Server Start Logic ---

// Middleware (runs first)
console.log('Setting up middleware...');
// --- Content Security Policy setup ---
const connectSrcOrigins = [
  "'self'",
  ...allowedOrigins,
  "ws://localhost:*",
  "wss://localhost:*"
];
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "connect-src": connectSrcOrigins,
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
    }
  }
}));
app.use(morgan('dev'));

// Configure CORS - Allow multiple origins
// CORS: Allow credentials for explicit origins only (mobile/cross-origin best practice)
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // Required for cookies/JWT on mobile
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
console.log('Middleware setup complete.');

// Root route (optional, runs after middleware)
app.get('/', (req, res, next) => {
  console.log('Received request to /');
  try {
    res.send('API is running...');
    console.log('Response sent for /');
  } catch (error) {
    console.error('Error in root route handler:', error);
    next(error);
  }
});

// Register API routes (runs after middleware and root route)
console.log('Registering API routes...');
console.log('Registering /api/auth');
app.use('/api/auth', authRoutes);
console.log('Registering /api/lawyers');
app.use('/api/lawyers', lawyerRoutes);
console.log('Registering /api/matters');
app.use('/api/matters', matterRoutes); // Mount the matter routes
console.log('Registering /api/clients');
app.use('/api/clients', clientRoutes); // Use client routes
console.log('Registering /api/time-entries');
app.use('/api/time-entries', timeEntryRoutes);
const ltsRoutes = require('./routes/ltsRoutes');
console.log('Registering /api/lts');
app.use('/api/lts', ltsRoutes);
console.log('Registering /api/users');
app.use('/api/users', userRoutes);
console.log('Registering /api/dashboard');
app.use('/api/dashboard', dashboardRoutes);
const auditLogRoutes = require('./routes/auditLogRoutes');
console.log('Registering /api/audit-logs (main)');
app.use('/api/audit-logs', auditLogRoutes);

// TEMP: Debug endpoint to inspect raw audit logs

console.log('API routes registered.');

// 404 handler (runs ONLY if no routes above matched)
app.use(notFound);

// General error handler (runs if any route handler calls next(error) or if notFound runs)
app.use(errorHandler);

// --- Server Start Logic ---
let port;
if (process.env.NODE_ENV === 'production') {
  port = process.env.PORT;
  if (!port) {
    throw new Error('No PORT environment variable set in production!');
  }
} else {
  port = process.env.PORT || 5001; // fallback for local development
}

let server;
if (process.env.NODE_ENV === 'production') {
  // In production, let DigitalOcean/App Platform handle HTTPS
  server = app.listen(port, () => {
    console.log(`HTTP server running on port ${port} (production mode, HTTPS handled by platform)`);
  });
} else if (httpsOptions) {
  // In development, use local HTTPS certs
  server = require('https').createServer(httpsOptions, app).listen(port, () => {
    console.log(`HTTPS server running on port ${port} (development mode)`);
  });
} else {
  // Fallback to HTTP for local dev if no certs found
  server = app.listen(port, () => {
    console.log(`HTTP server running on port ${port} (development fallback)`);
  });
}
// --- End Server Start Logic ---

// Connect to MongoDB
console.log('Attempting to connect to MongoDB...');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/law_office_system')
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Optional: Handle server shutdown gracefully - reference the 'server' variable
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing server');
  server.close(() => { // Use the 'server' variable
    console.log('HTTP/HTTPS server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDb connection closed');
      process.exit(0);
    });
  });
});

// --- Serve static files and SPA fallback (after all API and error handlers) ---
// Use existing 'path' and 'fs' imports from the top of the file
const frontendDistPath = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(frontendDistPath)) {
  // Serve static assets
  app.use(express.static(frontendDistPath));

  // SPA fallback: serve index.html for non-API GET requests not matching a static file
  app.get('*', (req, res, next) => {
    // Only handle GET requests
    if (req.method !== 'GET') return next();
    // Do not interfere with API routes
    if (req.path.startsWith('/api')) return next();
    // Check if the request accepts HTML (not e.g. XHR for JSON)
    if (!req.headers.accept || !req.headers.accept.includes('text/html')) return next();
    const indexHtmlPath = path.join(frontendDistPath, 'index.html');
    if (fs.existsSync(indexHtmlPath)) {
      res.sendFile(indexHtmlPath);
    } else {
      res.status(404).send('index.html not found');
    }
  });
  console.log('Static file serving and SPA fallback enabled for client/dist.');
} else {
  console.warn('client/dist not found; static file serving and SPA fallback not enabled.');
}

module.exports = app; // Export app instance