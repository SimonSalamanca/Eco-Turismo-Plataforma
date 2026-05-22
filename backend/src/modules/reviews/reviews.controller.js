const reviewsService = require('./reviews.service');

const createReview = async (req, res, next) => {
  try {
    const review = await reviewsService.createReview(req.userId, req.body);
    res.status(201).json({
      success: true,
      message: 'Reseña publicada exitosamente',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

const getListingReviews = async (req, res, next) => {
  try {
    const result = await reviewsService.getListingReviews(
      req.params.listingId,
      req.query
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getMyReviews = async (req, res, next) => {
  try {
    const result = await reviewsService.getMyReviews(req.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getHostReviews = async (req, res, next) => {
  try {
    const result = await reviewsService.getHostReviews(req.userId, req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const respondToReview = async (req, res, next) => {
  try {
    const review = await reviewsService.respondToReview(
      req.params.id,
      req.userId,
      req.body.reply
    );
    res.json({
      success: true,
      message: 'Respuesta publicada exitosamente',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

const reportReview = async (req, res, next) => {
  try {
    const report = await reviewsService.reportReview(req.params.id, req.userId, req.body.reason);
    res.status(201).json({
      success: true,
      message: 'Reseña reportada',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getListingReviews,
  getMyReviews,
  getHostReviews,
  respondToReview,
  reportReview
};