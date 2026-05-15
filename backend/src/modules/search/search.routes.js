const express = require('express');
const router = express.Router();
const searchController = require('./search.controller');
const { optionalAuth } = require('../../middleware/auth.middleware');

router.get('/', searchController.search);
router.get('/map', searchController.searchMap);
router.get('/nearby', searchController.searchByRadius);

module.exports = router;