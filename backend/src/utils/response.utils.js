const successResponse = (res, data, message = 'OK', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  });
};

const errorResponse = (res, code, message, details = {}, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details
    },
    timestamp: new Date().toISOString()
  });
};

const createdResponse = (res, data, message = 'Recurso creado') => {
  return successResponse(res, data, message, 201);
};

const paginatedResponse = (res, data, pagination, message = 'OK') => {
  return res.status(200).json({
    success: true,
    data,
    pagination,
    message,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  successResponse,
  errorResponse,
  createdResponse,
  paginatedResponse
};