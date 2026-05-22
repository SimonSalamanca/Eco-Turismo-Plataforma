const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validateSchema } = require('../../utils/validation.utils');
const { createReportSchema } = require('./reports.dto');

router.post('/', authenticate, validateSchema(createReportSchema), reportsController.createReport);

module.exports = router;
