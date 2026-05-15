const buildPagination = (page, limit, total) => {
  return {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1
  };
};

const getOffset = (page, limit) => {
  return (parseInt(page, 10) - 1) * parseInt(limit, 10);
};

const getLimit = (limit, maxLimit = 100) => {
  const parsed = parseInt(limit, 10);
  return isNaN(parsed) ? 20 : Math.min(parsed, maxLimit);
};

const getPage = (page) => {
  const parsed = parseInt(page, 10);
  return isNaN(parsed) || parsed < 1 ? 1 : parsed;
};

module.exports = {
  buildPagination,
  getOffset,
  getLimit,
  getPage
};