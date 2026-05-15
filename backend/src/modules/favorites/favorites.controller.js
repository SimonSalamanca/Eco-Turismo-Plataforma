const favoritesService = require('./favorites.service');

const getFavorites = async (req, res, next) => {
  try {
    const favorites = await favoritesService.getFavorites(req.userId);
    res.json({
      success: true,
      data: favorites,
      pagination: {
        page: 1,
        limit: favorites.length,
        total: favorites.length
      }
    });
  } catch (error) {
    next(error);
  }
};

const addFavorite = async (req, res, next) => {
  try {
    const result = await favoritesService.addFavorite(req.userId, req.body.listing_id);
    
    if (result.alreadyExists) {
      return res.status(200).json({
        success: true,
        data: result,
        message: result.message
      });
    }

    res.status(201).json({
      success: true,
      data: result,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

const removeFavorite = async (req, res, next) => {
  try {
    const result = await favoritesService.removeFavorite(req.userId, req.params.listingId);
    res.json({
      success: true,
      data: result,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

const checkFavorite = async (req, res, next) => {
  try {
    const result = await favoritesService.checkFavorite(req.userId, req.params.listingId);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite
};