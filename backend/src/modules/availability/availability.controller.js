const availabilityService = require('./availability.service');

const getAvailability = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const availability = await availabilityService.getAvailability(
      req.params.id,
      parseInt(year),
      parseInt(month)
    );
    res.json({ success: true, data: availability });
  } catch (error) {
    next(error);
  }
};

const updateAvailability = async (req, res, next) => {
  try {
    const result = await availabilityService.updateAvailability(
      req.params.id,
      req.userId,
      req.body
    );
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailability,
  updateAvailability
};