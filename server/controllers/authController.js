const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Generate Access Token (Short-lived)
const generateAccessToken = (id, role, gym_id) => {
  return jwt.sign({ id, role, gym_id }, process.env.JWT_SECRET, {
    expiresIn: '15m', // 15 minutes
  });
};

// Generate Refresh Token (Long-lived)
const generateRefreshToken = (id, role, gym_id) => {
  return jwt.sign({ id, role, gym_id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d', // 7 days
  });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = userResult.rows[0];

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. If ADMIN, check if their Gym's SaaS subscription is active
    if (user.role === 'ADMIN') {
      const gymResult = await db.query('SELECT * FROM gyms WHERE id = $1', [user.gym_id]);
      if (gymResult.rows.length === 0) {
         return res.status(403).json({ error: 'Associated gym not found' });
      }
      const gym = gymResult.rows[0];
      
      if (gym.saas_subscription_status !== 'ACTIVE') {
         return res.status(403).json({ error: 'SaaS Subscription is suspended. Please contact support.' });
      }
    }

    // 4. Get Gym Details for non-superadmins
    let gymName = null;
    let gymPhone = null;
    if (user.role !== 'SUPER_ADMIN' && user.gym_id) {
       const gymResult = await db.query('SELECT name, phone FROM gyms WHERE id = $1', [user.gym_id]);
       gymName = gymResult.rows[0]?.name;
       gymPhone = gymResult.rows[0]?.phone;
    }

    // 5. Generate tokens
    const accessToken = generateAccessToken(user.id, user.role, user.gym_id);
    const refreshToken = generateRefreshToken(user.id, user.role, user.gym_id);

    // 6. Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
    
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        gym_id: user.gym_id,
        gym_name: gymName,
        gym_phone: gymPhone
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

const refreshToken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    // 1. Verify token in database
    const result = await db.query('SELECT * FROM refresh_tokens WHERE token = $1', [token]);
    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }
    const storedToken = result.rows[0];

    // 2. Check expiry
    if (new Date() > new Date(storedToken.expires_at)) {
      await db.query('DELETE FROM refresh_tokens WHERE id = $1', [storedToken.id]);
      return res.status(403).json({ error: 'Refresh token expired' });
    }

    // 3. Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    
    // 4. Generate new access token
    const newAccessToken = generateAccessToken(decoded.id, decoded.role, decoded.gym_id);

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ error: 'Invalid refresh token' });
  }
};

const logout = async (req, res) => {
  const { token } = req.body;
  try {
    await db.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error during logout' });
  }
};

module.exports = { login, refreshToken, logout };
