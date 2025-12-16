const express = require('express');
const User = require('../models/User');
const Video = require('../models/Video');
const Comment = require('../models/Comment');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/stats
// @desc    Get admin dashboard stats
// @access  Admin
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      totalVideos,
      totalComments,
      recentUsers,
      recentVideos,
      topChannels
    ] = await Promise.all([
      User.countDocuments(),
      Video.countDocuments(),
      Comment.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('username email createdAt'),
      Video.find().sort({ createdAt: -1 }).limit(5).populate('uploader', 'username').select('title createdAt views'),
      User.find().sort({ 'channel.subscriberCount': -1 }).limit(10).select('username channel.name channel.subscriberCount')
    ]);

    const stats = {
      totalUsers,
      totalVideos,
      totalComments,
      recentUsers,
      recentVideos,
      topChannels
    };

    res.json(stats);
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error fetching admin stats' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users (admin)
// @access  Admin
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role && role !== 'all') {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Admin
router.put('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Admin update user role error:', error);
    res.status(500).json({ message: 'Server error updating user role' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Admin
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow deleting other admins
    if (user.role === 'admin' && user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Cannot delete other administrators' });
    }

    // Delete user's videos and comments
    await Promise.all([
      Video.deleteMany({ uploader: req.params.id }),
      Comment.deleteMany({ author: req.params.id }),
      User.findByIdAndDelete(req.params.id)
    ]);

    res.json({ message: 'User and associated data deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

// @route   GET /api/admin/videos
// @desc    Get all videos (admin)
// @access  Admin
router.get('/videos', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (status && status !== 'all') {
      query.processingStatus = status;
    }

    const videos = await Video.find(query)
      .populate('uploader', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Video.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      videos,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalVideos: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Admin get videos error:', error);
    res.status(500).json({ message: 'Server error fetching videos' });
  }
});

module.exports = router;