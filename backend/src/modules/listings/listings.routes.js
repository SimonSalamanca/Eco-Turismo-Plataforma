const express = require('express');
const router = express.Router();
const listingsController = require('./listings.controller');
const { authenticate, optionalAuth, authorize } = require('../../middleware/auth.middleware');
const { validateSchema } = require('../../utils/validation.utils');
const { createListingSchema, updateListingSchema, searchQuerySchema } = require('./listings.dto');
const upload = require('../../middleware/multer.middleware');
const { handleUpload } = require('../../middleware/upload.middleware');

router.get('/', optionalAuth, validateSchema(searchQuerySchema, 'query'), listingsController.getListings);
router.get('/featured', listingsController.getFeaturedListings);
router.get('/top-rated', listingsController.getTopRatedListings);
router.get('/map', listingsController.getMapListings);
router.get('/my', authenticate, listingsController.getMyListings);
router.get('/host/dashboard-stats', authenticate, listingsController.getHostDashboardStats);
router.get('/host/calendar-availability', authenticate, listingsController.getHostCalendarAvailability);
router.get('/:id', listingsController.getListing);

router.post('/', authenticate, authorize('host', 'local_business', 'admin'), validateSchema(createListingSchema), listingsController.createListing);
router.put('/:id', authenticate, validateSchema(updateListingSchema), listingsController.updateListing);
router.delete('/:id', authenticate, listingsController.deleteListing);
router.post('/:id/photos', authenticate, upload.array('photos', 10), handleUpload, (err, req, res, next) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: { code: 'FILE_TOO_LARGE', message: 'El archivo es demasiado grande. El tamaño máximo permitido es 10MB.' }
      });
    }
    if (err.message.includes('Tipo de archivo no permitido')) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_FILE_TYPE', message: err.message }
      });
    }
    return res.status(400).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message: err.message }
    });
  }
  next();
}, listingsController.uploadPhotos);
router.delete('/:id/photos/:photoId', authenticate, listingsController.deletePhoto);

module.exports = router;