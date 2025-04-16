// server/middleware/ownerOrAssigned.js
const { partnerOrOwner, associateOrAssigned } = require('./rbacMiddleware');

// This middleware allows access if EITHER partnerOrOwner OR associateOrAssigned passes
const ownerOrAssigned = async (req, res, next) => {
  let passed = false;
  // Try partnerOrOwner
  await partnerOrOwner(req, res, (err) => {
    if (!err) {
      passed = true;
      next();
    }
  });
  if (passed) return;
  // Try associateOrAssigned
  await associateOrAssigned(req, res, (err) => {
    if (!err) {
      passed = true;
      next();
    }
  });
  if (!passed) {
    res.status(403);
    next(new Error('Not authorized as owner or assigned lawyer'));
  }
};

module.exports = { ownerOrAssigned };
