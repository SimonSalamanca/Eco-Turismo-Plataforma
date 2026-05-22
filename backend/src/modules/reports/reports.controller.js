const reportsService = require('./reports.service');

const createReport = async (req, res, next) => {
  try {
    const report = await reportsService.createReport(req.userId, req.body);
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport
};
