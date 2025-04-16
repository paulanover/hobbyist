// server/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getMattersByCategory, getLawyerWorkload } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/matters-by-category', protect, getMattersByCategory);
router.get('/lawyer-workload', protect, getLawyerWorkload);

module.exports = router;
