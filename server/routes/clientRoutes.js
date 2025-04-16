const express = require('express');
const {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  getClientWithMatters, // Import the new controller function
  getClientsForLawyerMatters,
  getClientsForLawyerRelevant,
  debugLawyerOwners, // TEMP: debug endpoint
  getClientMattersForLawyer,
} = require('../controllers/clientController.js');
const { protect, admin } = require('../middleware/authMiddleware.js');
const { lawyerAssignedOrOwner } = require('../middleware/rbacMiddleware.js');

const router = express.Router();

router.get('/for-lawyer-matters', protect, getClientsForLawyerMatters);
router.get('/for-lawyer-relevant', protect, getClientsForLawyerRelevant);

router.route('/')
  .post(protect, createClient) // Logged-in users can create
  .get(protect, getClients);    // Logged-in users can view list

// New route for client details including matters
// TEMPORARY: Debug endpoint to inspect lawyerOwners field
router.get('/debug-lawyer-owners', debugLawyerOwners);

router.route('/:id/details')
    .get(protect, getClientWithMatters); // Logged-in users can view details

// Route: Get matters for a specific client where the logged-in lawyer is on the team
router.get('/:id/matters/for-lawyer', protect, getClientMattersForLawyer);

router.route('/:id')
  .get(protect, lawyerAssignedOrOwner, getClientById)    // Lawyers who are assigned or owners can view client
  .put(protect, lawyerAssignedOrOwner, updateClient)   // Lawyers who are assigned or owners can update client
  .delete(protect, admin, deleteClient); // Only admins can delete

module.exports = router;
