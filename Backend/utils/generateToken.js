const jwt = require('jsonwebtoken');

const generateToken = (userId, email) => {
  const payload = {
    userId,
    email,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d', // Token expires in 7 days
  });

  return token;
};

module.exports = generateToken;
