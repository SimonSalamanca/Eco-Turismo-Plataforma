const express = require('express');
const router = express.Router();
const reviewsController = require('./reviews.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validateSchema } = require('../../utils/validation.utils');
const { createReviewSchema, respondReviewSchema, reportReviewSchema } = require('./reviews.dto');

router.post('/', authenticate, validateSchema(createReviewSchema), reviewsController.createReview);
router.get('/listing/:listingId', reviewsController.getListingReviews);
router.put('/:id/response', authenticate, validateSchema(respondReviewSchema), reviewsController.respondToReview);
router.post('/:id/report', authenticate, validateSchema(reportReviewSchema), reviewsController.reportReview);

module.exports = router;