// server/middleware/ownerOrAssigned.js
const { partnerOrOwner, associateOrAssigned } = require('./rbacMiddleware');

// This middleware allows access if EITHER partnerOrOwner OR associateOrAssigned passes
const ownerOrAssigned = async (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'accounting')) {
    return next(); // Admin/Accounting always allowed
  }
  try {
    await partnerOrOwner(req, res, () => {});
    return next(); // If partnerOrOwner passes, allow
  } catch (err1) {
    try {
      await associateOrAssigned(req, res, () => {});
      return next(); // If associateOrAssigned passes, allow
    } catch (err2) {
      res.status(403);
      next(new Error('Not authorized as owner or assigned lawyer'));
    }
  }
};

module.exports = { ownerOrAssigned };
