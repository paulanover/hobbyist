const express = require('express');
const {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  getClientWithMatters, // Import the new controller function
} = require('../controllers/clientController.js');
const { protect, admin } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.route('/')
  .post(protect, createClient) // Logged-in users can create
  .get(protect, getClients);    // Logged-in users can view list

// New route for client details including matters
router.route('/:id/details')
    .get(protect, getClientWithMatters); // Logged-in users can view details

router.route('/:id')
  .get(protect, getClientById)    // Logged-in users can view basic details (e.g., for selection)
  .put(protect, updateClient)   // Logged-in users can update
  .delete(protect, admin, deleteClient); // Only admins can delete

module.exports = router;
