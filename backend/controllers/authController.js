const User = require('../models/User');
const { generateToken, verifyToken } = require('../utils/jwt');
const mailer = require('../utils/mailer');
const config = require('../config/config');

const parseDurationToMs = (str) => {
  try {
    if (typeof str === 'string' && str.endsWith('d')) {
      const days = parseInt(str.slice(0, -1), 10);
      return days * 24 * 60 * 60 * 1000;
    }
    const n = parseInt(str, 10);
    if (!isNaN(n)) return n * 1000;
  } catch (e) {}
  return undefined;
};

// User registration
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        error: { message: 'User with this email already exists' }
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone
    });

    await user.save();

    mailer.sendMail({
      to: user.email,
      subject: 'Welcome to LuxStay',
      html: `<p>Hi ${user.name},</p><p>Welcome to LuxStay. Your account has been created.</p>`
    }).catch(err => console.error('Mailer error:', err));

    const { accessToken, refreshToken } = generateToken(user._id, user.role);

    user.refreshToken = refreshToken;
    await user.save();

    const accessMs = parseDurationToMs(config.jwtExpiresIn);
    const refreshMs = parseDurationToMs(config.jwtRefreshExpiresIn);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: accessMs
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: refreshMs
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user: user.toSafeObject() }
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: { message: messages.join(', ') }
      });
    }

    res.status(500).json({
      error: { message: 'Registration failed' }
    });
  }
};

// User login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        error: { message: 'Invalid email or password' }
      });
    }

    // Check if user is banned
    if (user.status === 'banned') {
      return res.status(403).json({
        error: { message: 'Account has been banned. Please contact support.' }
      });
    }

    // Check if user is inactive
    if (user.status === 'inactive') {
      return res.status(403).json({
        error: { message: 'Account is inactive. Please contact support.' }
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: { message: 'Invalid email or password' }
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const { accessToken, refreshToken } = generateToken(user._id, user.role);

    user.refreshToken = refreshToken;
    await user.save();

    const accessMs = parseDurationToMs(config.jwtExpiresIn);
    const refreshMs = parseDurationToMs(config.jwtRefreshExpiresIn);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: accessMs
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: refreshMs
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: user.toSafeObject() }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: { message: 'Login failed' }
    });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const token = req.body.refreshToken || (req.cookies && req.cookies.refreshToken);

    if (!token) {
      return res.status(400).json({ error: { message: 'Refresh token is required' } });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        error: { message: 'Invalid or expired refresh token' }
      });
    }

    // Check if user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        error: { message: 'User not found or inactive' }
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateToken(user._id, user.role);

    user.refreshToken = newRefreshToken;
    await user.save();

    const accessMs = parseDurationToMs(config.jwtExpiresIn);
    const refreshMs = parseDurationToMs(config.jwtRefreshExpiresIn);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: accessMs
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: refreshMs
    });

    res.json({ success: true, message: 'Token refreshed successfully' });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: { message: 'Token refresh failed' }
    });
  }
};

// Logout (client-side token removal, but we can track here if needed)
const logout = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user) {
      user.refreshToken = '';
      await user.save();
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ success: true, message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: { message: 'Logout failed' }
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' }
      });
    }

    res.json({
      success: true,
      data: {
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: { message: 'Failed to get profile' }
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, preferences } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (preferences !== undefined) updateData.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' }
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: { message: messages.join(', ') }
      });
    }

    res.status(500).json({
      error: { message: 'Profile update failed' }
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.userId).select('+password');

    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' }
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: { message: 'Current password is incorrect' }
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: { message: messages.join(', ') }
      });
    }

    res.status(500).json({
      error: { message: 'Password change failed' }
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword
};
