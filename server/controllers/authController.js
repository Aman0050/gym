const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Generate Access Token (Short-lived)
const generateAccessToken = (id, role, gym_id) => {
  return jwt.sign({ id, role, gym_id }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });
};

// Generate Refresh Token (Long-lived)
const generateRefreshToken = (id, role, gym_id) => {
  return jwt.sign({ id, role, gym_id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
};

const login = async (req, res) => {
  try {
    // Accept either { email, password } or { identifier, password }
    const { email, identifier, password } = req.body;
    const loginKey = identifier || email;

    if (!loginKey || !password) {
      return res.status(400).json({ error: 'Gym ID / Email and password are required' });
    }

    // ── Strategy 1: Try gym_accounts (Gym ID login) ──────────────────────────
    const gymAccountResult = await db.query(
      'SELECT ga.*, g.saas_subscription_status, g.name as gym_name, g.phone as gym_phone FROM gym_accounts ga JOIN gyms g ON g.id = ga.branch_id WHERE ga.gym_id = $1',
      [loginKey]
    );

    if (gymAccountResult.rows.length > 0) {
      const account = gymAccountResult.rows[0];

      const isMatch = await bcrypt.compare(password, account.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check SaaS subscription
      if (account.saas_subscription_status !== 'ACTIVE') {
        return res.status(403).json({ error: 'SaaS Subscription is suspended. Please contact support.' });
      }

      // Use branch_id as the "user id" for this session, synthetic user object
      const accessToken = generateAccessToken(account.id, 'ADMIN', account.branch_id);
      const refreshToken = generateRefreshToken(account.id, 'ADMIN', account.branch_id);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Store refresh token — use a gym_account marker in user_id
      await db.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [account.id, refreshToken, expiresAt]
      );

      return res.json({
        success: true,
        user: {
          id: account.id,
          email: null,
          gym_login_id: account.gym_id,
          role: 'ADMIN',
          gym_id: account.branch_id,
          gym_name: account.gym_name,
          gym_phone: account.gym_phone,
          name: account.gym_name,
        },
        accessToken,
        refreshToken,
      });
    }

    // ── Strategy 2: Try users table (Email login — Super Admin / legacy) ──────
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [loginKey]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // If ADMIN (email-based), check SaaS subscription
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

    // Get Gym Details for non-superadmins
    let gymName = null;
    let gymPhone = null;
    if (user.role !== 'SUPER_ADMIN' && user.gym_id) {
      const gymResult = await db.query('SELECT name, phone FROM gyms WHERE id = $1', [user.gym_id]);
      gymName = gymResult.rows[0]?.name;
      gymPhone = gymResult.rows[0]?.phone;
    }

    const accessToken = generateAccessToken(user.id, user.role, user.gym_id);
    const refreshToken = generateRefreshToken(user.id, user.role, user.gym_id);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

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
        gym_phone: gymPhone,
        name: user.name || null,
      },
      accessToken,
      refreshToken,
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
    const result = await db.query('SELECT * FROM refresh_tokens WHERE token = $1', [token]);
    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }
    const storedToken = result.rows[0];

    if (new Date() > new Date(storedToken.expires_at)) {
      await db.query('DELETE FROM refresh_tokens WHERE id = $1', [storedToken.id]);
      return res.status(403).json({ error: 'Refresh token expired' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // Verify Gym exists and is still ACTIVE (prevents suspended tenants from bypassing via refresh)
    if (decoded.role !== 'SUPER_ADMIN' && decoded.gym_id) {
      const gymCheck = await db.query(
        'SELECT saas_subscription_status, suspension_reason FROM gyms WHERE id = $1',
        [decoded.gym_id]
      );
      
      if (gymCheck.rows.length === 0) {
        await db.query('DELETE FROM refresh_tokens WHERE id = $1', [storedToken.id]);
        return res.status(403).json({ error: 'Tenant not found. Access revoked.' });
      }
      
      const gym = gymCheck.rows[0];
      if (gym.saas_subscription_status === 'SUSPENDED' || gym.saas_subscription_status === 'DISABLED') {
        await db.query('DELETE FROM refresh_tokens WHERE id = $1', [storedToken.id]);
        return res.status(403).json({ 
          error: `Tenant account is ${gym.saas_subscription_status.toLowerCase()}. Access revoked.`,
          reason: gym.suspension_reason
        });
      }
    }

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

const register = async (req, res) => {
  const { gymName, ownerName, email, phone, city, password } = req.body;

  try {
    // 1. Check if email already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const client = await db.pool.connect(); // Note: db module needs pool exported, or we just do multiple queries. Our db wrapper exports `query` and `pool`. Let's assume db.query for simplicity, but a transaction is better.
    try {
      await client.query('BEGIN');

      // 2. Create Gym (Start 3-Day Trial)
      const gymInsert = await client.query(
        `INSERT INTO gyms (name, phone, address, saas_subscription_status, trial_start_date, trial_end_date) 
         VALUES ($1, $2, $3, 'TRIAL', NOW(), NOW() + INTERVAL '3 days') RETURNING id, name, phone`,
        [gymName, phone, city]
      );
      const gym = gymInsert.rows[0];

      // 3. Create Admin User
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userInsert = await client.query(
        `INSERT INTO users (gym_id, email, password_hash, role, name) 
         VALUES ($1, $2, $3, 'ADMIN', $4) RETURNING id, email, role, name, gym_id`,
        [gym.id, email, hashedPassword, ownerName]
      );
      const user = userInsert.rows[0];

      await client.query('COMMIT');

      // 4. Generate Tokens and Auto-Login
      const accessToken = generateAccessToken(user.id, user.role, user.gym_id);
      const refreshToken = generateRefreshToken(user.id, user.role, user.gym_id);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await db.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, refreshToken, expiresAt]
      );

      // Mock Welcome Email Logger
      console.log(`\n========================================================`);
      console.log(`✉️ WELCOME EMAIL DISPATCHED TO: ${user.email}`);
      console.log(`Subject: Welcome to FitXeno OS - Your Enterprise Infrastructure`);
      console.log(`Body: Hi ${user.name},\nWelcome to FitXeno! Your gym ${gym.name} is now online.\nLogin to your dashboard to get started.`);
      console.log(`========================================================\n`);

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          gym_id: user.gym_id,
          gym_name: gym.name,
          gym_phone: gym.phone,
          name: user.name,
        },
        accessToken,
        refreshToken,
        message: "Welcome to FitXeno. Your enterprise management portal is now active.",
      });

    } catch (txError) {
      await client.query('ROLLBACK');
      console.error('Transaction Error during registration:', txError);
      return res.status(500).json({ error: 'Server error during registration' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

module.exports = { login, refreshToken, logout, register };
