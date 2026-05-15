const listingsService = require('./listings.service');
const { handleUpload } = require('../../middleware/upload.middleware');

const getListings = async (req, res, next) => {
  try {
    const result = await listingsService.searchListings(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getListing = async (req, res, next) => {
  try {
    const listing = await listingsService.getListingById(req.params.id);
    res.json({ success: true, data: listing });
  } catch (error) {
    next(error);
  }
};

const getFeaturedListings = async (req, res, next) => {
  try {
    const listings = await listingsService.getFeaturedListings();
    res.json({ success: true, data: listings });
  } catch (error) {
    next(error);
  }
};

const getTopRatedListings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    const listings = await listingsService.getTopRatedListings(limit);
    res.json({ success: true, data: listings });
  } catch (error) {
    next(error);
  }
};

const getMapListings = async (req, res, next) => {
  try {
    const listings = await listingsService.getListingsMap(req.query);
    res.json({ success: true, data: listings });
  } catch (error) {
    next(error);
  }
};

const createListing = async (req, res, next) => {
  try {
    const listing = await listingsService.createListing(req.userId, req.body);
    res.status(201).json({ success: true, data: listing, message: 'Listing creado exitosamente' });
  } catch (error) {
    next(error);
  }
};

const updateListing = async (req, res, next) => {
  try {
    const listing = await listingsService.updateListing(req.params.id, req.userId, req.body);
    res.json({ success: true, data: listing, message: 'Listing actualizado' });
  } catch (error) {
    next(error);
  }
};

const deleteListing = async (req, res, next) => {
  try {
    const isAdmin = req.userRole === 'admin';
    const result = await listingsService.deleteListing(req.params.id, req.userId, isAdmin);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getMyListings = async (req, res, next) => {
  try {
    const listings = await listingsService.getMyListings(req.userId, req.query.status);
    res.json({ success: true, data: listings });
  } catch (error) {
    next(error);
  }
};

const uploadPhotos = async (req, res, next) => {
  try {
    await handleUpload(req, res, async () => {
      if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILES', message: 'No se proporcionaron imágenes' }
        });
      }

      const listing = await listingsService.addPhotos(req.params.id, req.userId, req.uploadedFiles);
      res.json({ success: true, data: listing, message: 'Fotos añadidas' });
    });
  } catch (error) {
    next(error);
  }
};

const deletePhoto = async (req, res, next) => {
  try {
    const listing = await listingsService.deletePhoto(req.params.id, req.params.photoId, req.userId);
    res.json({ success: true, data: listing, message: 'Foto eliminada' });
  } catch (error) {
    next(error);
  }
};

const getHostDashboardStats = async (req, res, next) => {
  try {
    const stats = await listingsService.getHostDashboardStats(req.userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

const getHostCalendarAvailability = async (req, res, next) => {
  try {
    const availability = await listingsService.getHostCalendarAvailability(req.userId);
    res.json({ success: true, data: availability });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getListings,
  getListing,
  getFeaturedListings,
  getTopRatedListings,
  getMapListings,
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
  uploadPhotos,
  deletePhoto,
  getHostDashboardStats,
  getHostCalendarAvailability
};