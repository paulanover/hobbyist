const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const connectDB = require('./config/db'); // Updated DB connection
const User = require('./models/User'); // Corrected path/filename
const { notFound, errorHandler } = require('./middleware/errorMiddleware'); // Error handling middleware
const authRoutes = require('./routes/authRoutes');
const lawyerRoutes = require('./routes/lawyerRoutes'); // Import lawyer routes
const userRoutes = require('./routes/userRoutes'); // Import user routes
const matterRoutes = require('./routes/matterRoutes'); // Import matter routes
const clientRoutes = require('./routes/clientRoutes'); // Import client routes

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/lawyers', lawyerRoutes); // Use lawyer routes
app.use('/api/users', userRoutes); // Use user routes
app.use('/api/matters', matterRoutes); // Use matter routes
app.use('/api/clients', clientRoutes); // Use client routes

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Anover Anover San Diego and Primavera Law Office Management System API'
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start listening
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

startServer();