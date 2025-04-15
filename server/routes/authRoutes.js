const express = require('express');
const { registerUser, loginUser, logoutUser } = require('../controllers/authController.js'); // Import logoutUser

const router = express.Router();
console.log('Auth routes file loaded.'); // Log when the file is loaded

router.post('/register', (req, res, next) => { // This only listens for POST
  console.log('>>> Request received for POST /api/auth/register'); // Log when the route is hit
  registerUser(req, res, next); // Call the actual controller
});

router.post('/login', (req, res, next) => {
  console.log('>>> Request received for POST /api/auth/login'); // Log when the route is hit
  loginUser(req, res, next);
});

// Add logout route - using POST is common practice for actions causing state change
router.post('/logout', logoutUser); // No protection needed technically, but can add if desired

module.exports = router;
