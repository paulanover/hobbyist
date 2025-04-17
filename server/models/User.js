const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Import bcrypt

console.log('>>> Loading User Model (models/User.js) with SINGLE "name" field <<<'); // Add this line

const userSchema = new mongoose.Schema({
  name: { // Single 'name' field
    type: String,
    required: [true, 'User name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'User email is required'],
    unique: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address'],
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false, // Do not return password by default on queries
  },
  role: {
    type: String,
    enum: ['admin', 'lawyer', 'staff', 'accountant'], // Added accountant role
    default: 'staff',
  },
  // Optional: Link to a Lawyer profile if the user is a lawyer
  lawyerProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
    required: function() { return this.role === 'lawyer'; } // Required only if role is 'lawyer'
  },
  lastUpdatedBy: { // Audit field
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  lastChangeDescription: { // Audit field
    type: String,
    trim: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true // Add index for faster querying of non-deleted users
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Reference the User model
  },
});

// --- Password Hashing Middleware ---
// Hash password before saving the user model
userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) {
    // Update updatedAt timestamp even if password didn't change
    if (this.isModified()) { // Check if any field was modified
        this.updatedAt = Date.now();
    }
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = Date.now(); // Ensure updatedAt is set when password changes
    next();
  } catch (error) {
    next(error);
  }
});

// --- Password Comparison Method ---
// Instance method to compare candidate password with the user's hashed password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


const User = mongoose.model('User', userSchema);

module.exports = User;
