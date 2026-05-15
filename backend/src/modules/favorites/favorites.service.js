const { Favorite, Listing, User } = require('../../db/models');
const { AppError, ConflictError } = require('../../middleware/errorHandler.middleware');
const { Op } = require('sequelize');

const getFavorites = async (touristId) => {
  const favorites = await Favorite.findAll({
    where: { tourist_id: touristId },
    include: [
      {
        model: Listing,
        as: 'listing',
        attributes: ['id', 'title', 'type', 'price_per_unit', 'capacity', 'average_rating', 'review_count', 'photos', 'department', 'municipality', 'status']
      }
    ],
    order: [['created_at', 'DESC']]
  });

  return favorites.map(fav => ({
    id: fav.id,
    listing: fav.listing,
    addedAt: fav.created_at
  }));
};

const addFavorite = async (touristId, listingId) => {
  const listing = await Listing.findOne({
    where: { id: listingId, status: { [Op.ne]: 'deleted' } }
  });

  if (!listing) {
    throw new AppError('Listing no encontrado', 404, 'NOT_FOUND');
  }

  const existing = await Favorite.findOne({
    where: { tourist_id: touristId, listing_id: listingId }
  });

  if (existing) {
    return { message: 'El listing ya está en favoritos', alreadyExists: true };
  }

  const favorite = await Favorite.create({
    tourist_id: touristId,
    listing_id: listingId
  });

  return { id: favorite.id, listingId, message: 'Listing agregado a favoritos' };
};

const removeFavorite = async (touristId, listingId) => {
  const favorite = await Favorite.findOne({
    where: { tourist_id: touristId, listing_id: listingId }
  });

  if (!favorite) {
    throw new AppError('Favorito no encontrado', 404, 'NOT_FOUND');
  }

  await favorite.destroy();

  return { message: 'Favorito eliminado correctamente' };
};

const checkFavorite = async (touristId, listingId) => {
  const favorite = await Favorite.findOne({
    where: { tourist_id: touristId, listing_id: listingId }
  });

  return { isFavorite: !!favorite };
};

const getFavoriteCount = async (listingId) => {
  return Favorite.count({ where: { listing_id: listingId } });
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
  getFavoriteCount
};