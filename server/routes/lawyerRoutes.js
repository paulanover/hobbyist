const express = require('express');
const {
  createLawyer,
  getLawyers,
  getLawyerById,
  updateLawyer,
  deleteLawyer,
  getLawyerWithMatters, // Import the new controller function
} = require('../controllers/lawyerController.js');
const { protect, admin } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.route('/')
  .post(protect, admin, createLawyer) // Only Admin creates
  .get(protect, getLawyers); // Logged-in users can view list

// New route for lawyer details including matters
router.route('/:id/details')
    .get(protect, getLawyerWithMatters); // Logged-in users can view details

router.route('/:id')
  .get(protect, getLawyerById) // Logged-in users can view basic info (e.g., for selection lists)
  .put(protect, admin, updateLawyer) // Only Admin updates
  .delete(protect, admin, deleteLawyer); // Only Admin deletes

module.exports = router;
