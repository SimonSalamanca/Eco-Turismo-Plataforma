const {
  ContentReport, Listing, Review, User
} = require('../../db/models');
const { AppError } = require('../../middleware/errorHandler.middleware');

const createReport = async (reporterId, data) => {
  const { target_type, target_id, reason, description } = data;

  const Model = target_type === 'listing' ? Listing : Review;
  const target = await Model.findByPk(target_id);
  if (!target) {
    throw new AppError(
      `${target_type === 'listing' ? 'Listing' : 'Reseña'} no encontrado`,
      404,
      'NOT_FOUND'
    );
  }

  const report = await ContentReport.create({
    reporter_id: reporterId,
    content_type: target_type,
    content_id: target_id,
    reason,
    description: description || null,
    status: 'pending'
  });

  return report;
};

module.exports = {
  createReport
};
