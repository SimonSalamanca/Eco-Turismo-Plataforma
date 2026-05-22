const express = require('express');
const router = express.Router();
const reviewsController = require('./reviews.controller');
const { authenticate, optionalAuth } = require('../../middleware/auth.middleware');
const { validateSchema, validateQuery } = require('../../utils/validation.utils');
const {
  createReviewSchema, respondReviewSchema, reportReviewSchema,
  listingReviewsQuerySchema, hostReviewsQuerySchema
} = require('./reviews.dto');

router.post('/', authenticate, validateSchema(createReviewSchema), reviewsController.createReview);
router.get('/listing/:listingId', optionalAuth, validateQuery(listingReviewsQuerySchema), reviewsController.getListingReviews);
router.get('/my', authenticate, reviewsController.getMyReviews);
router.get('/host', authenticate, validateQuery(hostReviewsQuerySchema), reviewsController.getHostReviews);
router.post('/:id/reply', authenticate, validateSchema(respondReviewSchema), reviewsController.respondToReview);
router.post('/:id/report', authenticate, validateSchema(reportReviewSchema), reviewsController.reportReview);

module.exports = router;