const listingsService = require('../listings/listings.service');

const search = async (req, res, next) => {
  try {
    const result = await listingsService.searchListings(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const searchMap = async (req, res, next) => {
  try {
    const listings = await listingsService.getListingsMap(req.query);
    res.json({ success: true, data: listings });
  } catch (error) {
    next(error);
  }
};

const searchByRadius = async (req, res, next) => {
  try {
    const { lat, lng, radius, type, page = 1, limit = 20 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMS', message: 'Se requiere lat y lng' }
      });
    }

    const result = await listingsService.searchListings({
      ...req.query,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius: parseInt(radius, 10) || 10,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  search,
  searchMap,
  searchByRadius
};