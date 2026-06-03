const jwt = require('../server/node_modules/jsonwebtoken');

const token = jwt.sign(
  {
    id: 'b2e5f87a-07ad-4fbe-b613-46556a8b5cc9',
    role: 'ADMIN',
    gym_id: '3341f8da-3354-496d-bda6-59961ccc6915'
  },
  'super_secret_jwt_key_123',
  { expiresIn: '1d' }
);

console.log(token);
