const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  createUser,
} = require('../controllers/userController.js'); // Adjust path if needed
const { protect, admin } = require('../middleware/authMiddleware.js'); // Adjust path if needed

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Admin routes for managing users
router.route('/')
  .get(protect, admin, getUsers) // GET /api/users (Admin: Get all users)
  .post(protect, admin, createUser); // POST /api/users (Admin: Create a new user)

router.route('/:id')
  .delete(protect, admin, deleteUser) // DELETE /api/users/:id (Admin: Delete user)
  .get(protect, admin, getUserById)   // GET /api/users/:id (Admin: Get user by ID)
  .put(protect, admin, updateUser);    // PUT /api/users/:id (Admin: Update user)

module.exports = router;
