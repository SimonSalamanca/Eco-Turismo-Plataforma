const express = require('express');
const router = express.Router();
const availabilityController = require('./availability.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.get('/:id/availability', availabilityController.getAvailability);
router.put('/:id/availability', authenticate, availabilityController.updateAvailability);

module.exports = router;