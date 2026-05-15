const reviewsService = require('./reviews.service');

const createReview = async (req, res, next) => {
  try {
    const review = await reviewsService.createReview(req.userId, req.body);
    res.status(201).json({ success: true, data: review, message: 'Reseña creada exitosamente' });
  } catch (error) {
    next(error);
  }
};

const getListingReviews = async (req, res, next) => {
  try {
    const reviews = await reviewsService.getListingReviews(req.params.listingId);
    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

const respondToReview = async (req, res, next) => {
  try {
    const review = await reviewsService.respondToReview(req.params.id, req.userId, req.body.host_response);
    res.json({ success: true, data: review, message: 'Respuesta publicada' });
  } catch (error) {
    next(error);
  }
};

const reportReview = async (req, res, next) => {
  try {
    const report = await reviewsService.reportReview(req.params.id, req.userId, req.body.reason);
    res.status(201).json({ success: true, data: report, message: 'Reseña reportada' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getListingReviews,
  respondToReview,
  reportReview
};