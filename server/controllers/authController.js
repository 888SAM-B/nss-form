const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'super_secret_key_12345',
    { expiresIn: '7d' }
  );
};

// @desc    Admin login
// @route   POST /api/auth/admin-login
// @access  Public
const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (admin && (await bcrypt.compare(password, admin.password))) {
      res.json({
        _id: admin._id,
        email: admin.email,
        role: 'admin',
        token: generateToken(admin._id, 'admin')
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { adminLogin };
