const express = require('express');
const {
  createMatter,
  getMatters,
  getMatterById,
  updateMatter,
  deleteMatter,
  getDeletedMatters, // Import the new controller function
  searchMatters,
  getMatterStatsByCategory,
  getMattersByUser,
  getDashboardStats,
  getBasicDashboardStats
} = require('../controllers/matterController.js');
const { protect, admin } = require('../middleware/authMiddleware.js'); // Import auth middleware
const { lawyerAssignedOrOwner } = require('../middleware/rbacMiddleware.js');
const matterEditAccess = require('../middleware/matterEditAccess');

const router = express.Router();
console.log('Matter routes file loaded (Restored).');

// Apply middleware
router.get('/stats/category', protect, getMatterStatsByCategory); // Requires login
router.get('/search', protect, searchMatters); // Requires login
router.get('/user', protect, getMattersByUser); // Added missing route from previous state
router.get('/dashboard', protect, getDashboardStats); // Keep old route for now

// Route for basic dashboard stats
router.get('/dashboard/basic', protect, (req, res, next) => {
  console.log(`>>> Handling GET /api/matters/dashboard/basic request <<<`);
  getBasicDashboardStats(req, res, next);
});

// Add Route for Deleted Matters
router.get('/deleted', protect, getDeletedMatters); // Requires login only

const { ownerOrAssigned } = require('../middleware/ownerOrAssigned.js');

router.route('/')
  .post(protect, ownerOrAssigned, createMatter) // Allow owners or assigned lawyers (and admin)
  .get(protect, getMatters); // Requires login

router.route('/:id')
  .get(protect, lawyerAssignedOrOwner, getMatterById) // Allow owners OR assigned lawyers to view
  .put(protect, matterEditAccess, updateMatter) // Admin, accounting, or lawyer assigned/owner can edit
  .delete(protect, admin, deleteMatter); // Requires admin login

module.exports = router;
