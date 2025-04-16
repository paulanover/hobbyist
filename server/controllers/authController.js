const User = require('../models/User.js'); // Make sure this path is correct
const Lawyer = require('../models/Lawyer.js');
const generateToken = require('../utils/generateToken.js');
const asyncHandler = require('../middleware/asyncHandler.js');

// Helper function to set the token cookie
const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const options = {
    httpOnly: true,
    secure: isProduction, // Secure cookies only in production (DigitalOcean)
    sameSite: isProduction ? 'none' : 'lax', // 'none' for production, 'lax' for local dev
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  };
  console.log(`[setTokenCookie] Setting cookie. NODE_ENV='${process.env.NODE_ENV}', Secure flag set to: ${options.secure}, SameSite: ${options.sameSite}`);
  res.cookie('jwt', token, options);
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  console.log('>>> Inside registerUser controller function'); // Log entry into the function
  console.log('Request Body:', req.body); // Log the request body

  const { name, email, password, role, lawyerProfile } = req.body; // Expects 'name'

  // Basic validation
  if (!name || !email || !password) { // Checks for 'name'
    res.status(400);
    throw new Error('Please provide name, email, and password');
  }

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this email');
  }

  // Determine the role - default to 'staff' if not provided or invalid
  const assignedRole = ['admin', 'lawyer', 'staff'].includes(role) ? role : 'staff';

  // Optional: Validate lawyerProfile if role is 'lawyer'
  if (assignedRole === 'lawyer' && lawyerProfile) {
      const lawyerExists = await Lawyer.findById(lawyerProfile);
      if (!lawyerExists) {
          res.status(400);
          throw new Error('Invalid Lawyer Profile ID provided');
      }
      // Optional: Check if this lawyer profile is already linked to another user
  } else if (assignedRole === 'lawyer' && !lawyerProfile) {
      // Handle case where role is lawyer but no profile ID is given, if necessary
      // console.warn("Creating lawyer user without linking to a Lawyer profile immediately.");
  }

  // Create user (password hashing is handled by pre-save hook in User model)
  const user = await User.create({
    name,
    email,
    password,
    role: assignedRole, // Use the determined role
    lawyerProfile: assignedRole === 'lawyer' ? lawyerProfile : undefined,
  });

  if (user) {
    const token = generateToken(user._id);
    setTokenCookie(res, token); // Set HttpOnly cookie

    // Send back only user info in the JSON body
    res.status(201).json({
      // Token is NOT sent in the body anymore
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lawyerProfile: user.lawyerProfile,
      }
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // Find user by email, explicitly select password
  const user = await User.findOne({ email }).select('+password');

  // Check if user exists and password matches
  if (user && (await user.matchPassword(password))) {
    const token = generateToken(user._id);
    console.log('[loginUser] User authenticated. Calling setTokenCookie...'); // Added log
    setTokenCookie(res, token); // Set HttpOnly cookie

    // Prepare the response data (user info only)
    const responseData = {
      // Token is NOT sent in the body anymore
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lawyerProfile: user.lawyerProfile,
      }
    };

    console.log('[loginUser] Cookie set (attempted). Sending 200 response.'); // Added log
    res.status(200).json(responseData); // Send only user data

  } else {
    res.status(401); // Unauthorized
    throw new Error('Invalid email or password');
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private (requires user to be logged in to logout)
const logoutUser = asyncHandler(async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production'; // Check NODE_ENV
  console.log('[logoutUser] Clearing JWT cookie...');
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: isProduction, // Use the result here
    sameSite: 'lax', // Match the setting used when creating
    expires: new Date(0), // Expire immediately
    path: '/', // Match the setting used when creating
  });
  console.log(`[logoutUser] Cleared cookie. Secure flag was: ${isProduction}`); // Log secure flag used
  res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = { registerUser, loginUser, logoutUser }; // Add logoutUser
