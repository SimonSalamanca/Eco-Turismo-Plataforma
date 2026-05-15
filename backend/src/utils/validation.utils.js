const { errorHandler, ValidationError } = require('../middleware/errorHandler.middleware');

const validateSchema = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      console.log('Validation error details:', error.details);
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }));
      console.log('Validation failed:', JSON.stringify(details));
      return next(new ValidationError('Error de validación', details));
    }

    req.body = value;
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }));
      return next(new ValidationError('Error de validación de consulta', details));
    }

    req.query = value;
    next();
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }));
      return next(new ValidationError('Error de validación de parámetros', details));
    }

    req.params = value;
    next();
  };
};

module.exports = {
  validateSchema,
  validateQuery,
  validateParams
};