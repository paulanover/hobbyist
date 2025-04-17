const express = require('express');
const router = express.Router();
const { getLawyerTimeSheetReport } = require('../controllers/ltsController');
const { protect } = require('../middleware/authMiddleware');

// Middleware to restrict to admin/accountant/lawyer
function ltsAccess(req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'accountant' || req.user.role === 'lawyer')) {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden: Only Admin, Accountant, or Lawyer can access LTS' });
}

// GET /api/lts
router.get('/', protect, ltsAccess, getLawyerTimeSheetReport);

module.exports = router;
