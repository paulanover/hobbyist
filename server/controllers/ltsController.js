const { TimeEntry } = require('../models/TimeEntry');
const Matter = require('../models/Matter');
const Client = require('../models/Client');
const Lawyer = require('../models/Lawyer');

/**
 * GET /api/lts
 * Query params: client, matter, lawyer, dateFrom, dateTo
 * Only accessible to admin/accountant
 */
exports.getLawyerTimeSheetReport = async (req, res) => {
  try {
    const { client, matter, lawyer, dateFrom, dateTo } = req.query;
    const query = {};
    // Restrict lawyers to only see their own matters/clients
    if (req.user.role === 'lawyer') {
      // Find matters where the lawyer is assigned
      const assignedMatters = await Matter.find({
        $or: [
          { teamAssigned: req.user.lawyer }, // lawyer._id
          { 'teamAssigned': req.user._id }, // fallback, if req.user.lawyer is not set
        ]
      }, '_id');
      const assignedMatterIds = assignedMatters.map(m => m._id.toString());
      // Only allow time entries for these matters, or where the lawyer is the time entry owner
      query.$or = [
        { matter: { $in: assignedMatterIds } },
        { lawyer: req.user.lawyer || req.user._id }
      ];
    }
    // Date range filter
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }
    // Matter filter
    if (matter) {
      // Allow searching by ID or partial title
      if (/^[a-f\d]{24}$/i.test(matter)) {
        query.matter = matter;
      } else {
        // Find matters matching the title
        const matters = await Matter.find({ title: { $regex: matter, $options: 'i' } });
        query.matter = { $in: matters.map(m => m._id) };
      }
    }
    // Client filter
    if (client) {
      // Find clients matching name
      const clients = await Client.find({ name: { $regex: client, $options: 'i' } });
      const clientIds = clients.map(c => c._id);
      // Find matters for these clients
      const matters = await Matter.find({ client: { $in: clientIds } });
      const matterIds = matters.map(m => m._id);
      if (!query.matter) query.matter = { $in: matterIds };
      else if (query.matter.$in) query.matter.$in = query.matter.$in.filter(id => matterIds.includes(id));
      else query.matter = { $in: matterIds };
    }
    // Lawyer filter
    if (lawyer) {
      // Allow searching by ID or initials
      if (/^[a-f\d]{24}$/i.test(lawyer)) {
        query.lawyer = lawyer;
      } else {
        const lawyers = await Lawyer.find({ initials: { $regex: lawyer, $options: 'i' } });
        query.lawyer = { $in: lawyers.map(l => l._id) };
      }
    }
    // Query TimeEntry, populate all needed fields
    const entries = await TimeEntry.find(query)
      .populate({ path: 'lawyer', select: 'name initials' })
      .populate({ path: 'matter', select: 'title docketNumber client', populate: { path: 'client', select: 'name' } })
      .sort({ 'matter.docketNumber': 1, date: 1 });

    // Format output
    const result = entries.map(e => ({
      clientName: e.matter && e.matter.client && e.matter.client.name,
      docketNumber: e.matter && e.matter.docketNumber,
      matterTitle: e.matter && e.matter.title,
      description: e.description,
      lawyerInitials: e.lawyer && e.lawyer.initials,
      timeSpent: e.hours,
      date: e.date,
    }));
    res.json(result);
  } catch (err) {
    console.error('[LTS] Error generating report:', err);
    res.status(500).json({ error: 'Failed to generate LTS report', details: String(err) });
  }
};
