const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateToken = (payload) => {
  return jwt.sign(payload, env.jwt.privateKey, {
    algorithm: env.jwt.algorithm,
    expiresIn: env.jwt.expiresIn
  });
};

const verifyToken = (token) => {
  const secret = env.jwt.publicKey || env.jwt.privateKey;
  return jwt.verify(token, secret, {
    algorithm: env.jwt.algorithm
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, env.jwt.privateKey, {
    algorithm: env.jwt.algorithm,
    expiresIn: '7d'
  });
};

const decodeToken = (token) => {
  return jwt.decode(token, { complete: true });
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken,
  decodeToken
};