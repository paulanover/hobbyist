const User = require('../models/User.js');
const { Lawyer } = require('../models/Lawyer.js');
const asyncHandler = require('../middleware/asyncHandler.js');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  // req.user should be set by the 'protect' middleware from authMiddleware.js
  // It reads the cookie set by /api/auth/login
  console.log('[getUserProfile] req.user from middleware:', req.user?._id); // Log user from middleware
  const user = await User.findById(req.user._id).select('-password'); // Exclude password

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      lawyerProfile: user.lawyerProfile, // Include lawyerProfile if needed
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    // If password is being updated
    if (req.body.password) {
      user.password = req.body.password; // Pre-save hook will hash it
    }

    // Add audit fields if desired
    user.lastUpdatedBy = req.user._id;
    user.lastChangeDescription = 'Updated profile'; // Simple description

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      // Add other relevant fields
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .populate('lawyerProfile', 'name initials')
    .populate('lastUpdatedBy', 'name'); // Populate lastUpdatedBy
  res.status(200).json(users);
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('lawyerProfile', 'name initials')
    .populate('lastUpdatedBy', 'name'); // Populate lastUpdatedBy

  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Create a new user (Admin)
// @route   POST /api/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, lawyerProfile } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const userData = {
    name,
    email,
    password, // Password will be hashed by the pre-save hook in User model
    role,
  };

  // Only add lawyerProfile if role is lawyer and lawyerProfile is provided
  if (role === 'lawyer' && lawyerProfile) {
    userData.lawyerProfile = lawyerProfile;
  }

  const user = await User.create(userData);

  if (user) {
    const userResponse = await User.findById(user._id).select('-password');
    res.status(201).json(userResponse);
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  // --- Debug Log 1: Check if req.user exists ---
  console.log('[updateUser] req.user:', req.user?._id, req.user?.name);

  const user = await User.findById(req.params.id);

  if (user) {
    const originalRole = user.role;
    const originalLawyerProfile = user.lawyerProfile ? user.lawyerProfile.toString() : null;

    user.name = req.body.name ?? user.name;
    user.email = req.body.email ?? user.email;
    user.role = req.body.role ?? user.role;

    // Prevent changing unique email to one that already exists
    if (req.body.email && req.body.email !== user.email) {
        const emailExists = await User.findOne({ email: req.body.email });
        if (emailExists) {
            res.status(400);
            throw new Error('Email already associated with another user');
        }
    }

    // Handle lawyerProfile linking/unlinking
    const newRole = req.body.role ?? user.role;
    const newLawyerProfile = req.body.lawyerProfile; // Can be ID string or null/undefined

    let lawyerProfileChanged = false;
    if (newRole === 'lawyer') {
      if (newLawyerProfile) {
        const lawyerExists = await Lawyer.findById(newLawyerProfile);
        if (!lawyerExists) {
            res.status(400);
            throw new Error('Invalid Lawyer Profile ID provided for linking');
        }
        // Check if this lawyer profile is already linked to *another* user
        const existingLink = await User.findOne({ lawyerProfile: newLawyerProfile, _id: { $ne: user._id } });
        if (existingLink) {
            res.status(400);
            throw new Error('This Lawyer Profile is already linked to another user');
        }
        if (!user.lawyerProfile || newLawyerProfile !== user.lawyerProfile.toString()) {
            user.lawyerProfile = newLawyerProfile;
            lawyerProfileChanged = true;
        }
      } else { // Role is lawyer, but no profile provided - unlinking
        if (user.lawyerProfile) {
            user.lawyerProfile = undefined;
            lawyerProfileChanged = true;
        }
      }
    } else { // Role is not lawyer, ensure lawyerProfile is unset
      if (user.lawyerProfile) {
          user.lawyerProfile = undefined;
          lawyerProfileChanged = true;
      }
    }

    // Check which fields were actually modified before saving
    const changedFields = [];
    if (user.isModified('name')) changedFields.push('name');
    if (user.isModified('email')) changedFields.push('email');
    if (user.isModified('role')) changedFields.push('role');
    if (lawyerProfileChanged) changedFields.push('lawyer link'); // Track profile link change

    // --- Debug Log 2: Check modified fields ---
    console.log('[updateUser] Changed fields detected:', changedFields);

    // Generate description string
    let changeDescription = 'No changes detected';
    if (changedFields.length > 0) {
        changeDescription = `Updated ${changedFields.join(', ')}`;
    }

    // Set audit fields
    user.lastUpdatedBy = req.user?._id; // Use optional chaining just in case
    user.lastChangeDescription = changeDescription;
    // 'updatedAt' is handled by pre-save hook

    // --- Debug Log 3: Check user object before save ---
    console.log('[updateUser] User object before save:', {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lawyerProfile: user.lawyerProfile,
        lastUpdatedBy: user.lastUpdatedBy,
        lastChangeDescription: user.lastChangeDescription,
        // Don't log password
    });

    const updatedUser = await user.save();

    // --- Debug Log 4: Check user object after save ---
    console.log('[updateUser] User object after save:', {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        lawyerProfile: updatedUser.lawyerProfile,
        lastUpdatedBy: updatedUser.lastUpdatedBy,
        lastChangeDescription: updatedUser.lastChangeDescription,
        updatedAt: updatedUser.updatedAt, // Check if updatedAt is updated
    });

    // Populate lastUpdatedBy before sending response
    const populatedUser = await User.findById(updatedUser._id)
        .select('-password')
        .populate('lawyerProfile', 'name initials')
        .populate('lastUpdatedBy', 'name');

    // --- Debug Log 5: Check populated user being sent ---
    console.log('[updateUser] Populated user sent to client:', populatedUser);

    res.status(200).json(populatedUser); // Send populated user
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    // Optional: Prevent deleting the last admin? Or self-deletion?
    // if (user.role === 'admin' && ...) { ... }
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = req.user._id;
    await user.save();
    res.status(200).json({ message: 'User marked as deleted', deletedBy: req.user._id, deletedAt: user.deletedAt });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
