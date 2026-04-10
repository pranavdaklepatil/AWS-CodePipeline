const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user (Admin only)
// @access  Private (Admin)
router.post('/register', async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      role,
      firstName,
      lastName,
      department,
      employeeId
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { employeeId }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists',
        error: 'USER_EXISTS',
        field: existingUser.email === email ? 'email' : 
               existingUser.username === username ? 'username' : 'employeeId'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role,
      firstName,
      lastName,
      department,
      employeeId
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        department: user.department,
        employeeId: user.employeeId
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        message: 'Validation error',
        error: 'VALIDATION_ERROR',
        errors
      });
    }

    res.status(500).json({
      message: 'Registration failed',
      error: 'REGISTRATION_ERROR'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(username)

    if (!username || !password) {
      return res.status(400).json({
        message: 'Username and password are required',
        error: 'MISSING_CREDENTIALS'
      });
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
      isActive: true
    });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        department: user.department,
        employeeId: user.employeeId,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Login failed',
      error: 'LOGIN_ERROR'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        fullName: req.user.fullName,
        department: req.user.department,
        employeeId: req.user.employeeId,
        lastLogin: req.user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      message: 'Failed to get user information',
      error: 'GET_USER_ERROR'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: user._id } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          message: 'Email already in use',
          error: 'EMAIL_EXISTS'
        });
      }
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        department: user.department,
        employeeId: user.employeeId
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        message: 'Validation error',
        error: 'VALIDATION_ERROR',
        errors
      });
    }

    res.status(500).json({
      message: 'Profile update failed',
      error: 'PROFILE_UPDATE_ERROR'
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current password and new password are required',
        error: 'MISSING_PASSWORDS'
      });
    }

    const user = await User.findById(req.user._id);

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        message: 'Current password is incorrect',
        error: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      message: 'Password change failed',
      error: 'PASSWORD_CHANGE_ERROR'
    });
  }
});

// @route   GET /api/auth/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      users,
      total: users.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      message: 'Failed to get users',
      error: 'GET_USERS_ERROR'
    });
  }
});

// @route   PUT /api/auth/users/:id
// @desc    Update a user (Admin only)
// @access  Private (Admin)
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found', error: 'USER_NOT_FOUND' });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (role) user.role = role;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        department: user.department,
        employeeId: user.employeeId
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user', error: 'UPDATE_USER_ERROR' });
  }
});

// @route   DELETE /api/auth/users/:id
// @desc    Delete a user (Admin only)
// @access  Private (Admin)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found', error: 'USER_NOT_FOUND' });
    }

    user.isActive = false; // soft delete
    await user.save();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user', error: 'DELETE_USER_ERROR' });
  }
});


module.exports = router;

