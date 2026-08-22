const jwt = require('jsonwebtoken');

/**
 * Signs a JWT for a given user id.
 * @param {string} id - Mongo ObjectId of the user
 * @returns {string} signed JWT
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

module.exports = generateToken;
