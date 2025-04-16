// server/controllers/dashboardController.js
const { Matter } = require('../models/Matter');
const { Lawyer } = require('../models/Lawyer');

// GET /api/dashboard/matters-by-category
// Returns: [{ category, count }]
const getMattersByCategory = async (req, res) => {
  const matters = await Matter.aggregate([
    { $match: { status: 'Active', isDeleted: { $ne: true } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  res.json(matters.map(m => ({ category: m._id, count: m.count })));
};

// GET /api/dashboard/lawyer-workload
// Returns: [{ name, rank, activeMatterCount }], grouped by rank
const getLawyerWorkload = async (req, res) => {
  const lawyers = await Lawyer.find({ isDeleted: { $ne: true } });
  // Get all active matters
  const matters = await Matter.find({ status: 'Active', isDeleted: { $ne: true } }, 'teamAssigned');
  // Count active matters per lawyer
  const matterCount = {};
  matters.forEach(m => {
    m.teamAssigned.forEach(lawyerId => {
      matterCount[lawyerId] = (matterCount[lawyerId] || 0) + 1;
    });
  });
  // Prepare grouped/sorted data
  const ranks = ['Partner', 'Senior Associate', 'Associate'];
  const grouped = {};
  ranks.forEach(rank => grouped[rank] = []);
  lawyers.forEach(lawyer => {
    if (ranks.includes(lawyer.rank)) {
      grouped[lawyer.rank].push({
        name: lawyer.name,
        rank: lawyer.rank,
        activeMatterCount: matterCount[lawyer._id.toString()] || 0
      });
    }
  });
  // Sort each group descending by count
  ranks.forEach(rank => grouped[rank].sort((a, b) => b.activeMatterCount - a.activeMatterCount));
  res.json(grouped);
};

module.exports = {
  getMattersByCategory,
  getLawyerWorkload,
};
