const express = require('express');
const router = express.Router();
const favoritesController = require('./favorites.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validateSchema } = require('../../utils/validation.utils');
const Joi = require('joi');

const addFavoriteSchema = Joi.object({
  listing_id: Joi.string().uuid().required()
});

router.use(authenticate);

router.get('/', favoritesController.getFavorites);
router.post('/', validateSchema(addFavoriteSchema), favoritesController.addFavorite);
router.delete('/:listingId', favoritesController.removeFavorite);
router.get('/check/:listingId', favoritesController.checkFavorite);

module.exports = router;