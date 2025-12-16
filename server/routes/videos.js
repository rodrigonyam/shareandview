const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const Video = require('../models/Video');
const User = require('../models/User');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Multer configuration for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/videos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/avi', 'video/mkv', 'video/mov'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

// @route   GET /api/videos
// @desc    Get all public videos
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      search, 
      sortBy = 'createdAt',
      order = 'desc',
      uploader
    } = req.query;

    let query = {};
    
    // If uploader is specified and user is authenticated, show their videos (including private)
    if (uploader && req.user && req.user.id === uploader) {
      query = { uploader: uploader };
    } else {
      // Default: show only public completed videos
      query = { isPublic: true, processingStatus: 'completed' };
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    const videos = await Video.find(query)
      .populate('uploader', 'username channel.name avatar')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

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
    console.error('Get videos error:', error);
    res.status(500).json({ message: 'Server error fetching videos' });
  }
});

// @route   GET /api/videos/my-videos
// @desc    Get current user's videos
// @access  Private
router.get('/my-videos', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    const query = { uploader: req.user.id };
    
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    const videos = await Video.find(query)
      .populate('uploader', 'username channel.name avatar')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

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
    console.error('Get user videos error:', error);
    res.status(500).json({ message: 'Server error fetching user videos' });
  }
});

// @route   GET /api/videos/:id
// @desc    Get single video
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('uploader', 'username channel avatar')
      .populate({
        path: 'uploader',
        populate: {
          path: 'channel.subscribers',
          select: 'username'
        }
      });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (!video.isPublic && (!req.user || video.uploader._id.toString() !== req.user.id)) {
      return res.status(403).json({ message: 'Video is not public' });
    }

    res.json(video);
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ message: 'Server error fetching video' });
  }
});

// @route   POST /api/videos
// @desc    Upload new video
// @access  Private
router.post('/', [
  auth,
  upload.single('video'),
  body('title')
    .notEmpty()
    .isLength({ max: 100 })
    .withMessage('Title is required and must be less than 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Description must be less than 5000 characters'),
  body('category')
    .optional()
    .isIn(['gaming', 'music', 'education', 'entertainment', 'technology', 'sports', 'news', 'other'])
    .withMessage('Invalid category'),
  body('tags')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        value = value.split(',').map(tag => tag.trim().toLowerCase());
      }
      if (value.length > 10) {
        throw new Error('Maximum 10 tags allowed');
      }
      return true;
    })
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Video file is required' });
    }

    const { title, description, category = 'other', tags, isPublic = true } = req.body;

    // Process tags
    let processTags = [];
    if (tags) {
      processTags = typeof tags === 'string' 
        ? tags.split(',').map(tag => tag.trim().toLowerCase())
        : tags;
    }

    // Create video record
    const video = new Video({
      title,
      description,
      uploader: req.user.id,
      videoUrl: `/uploads/videos/${req.file.filename}`,
      thumbnail: `/uploads/thumbnails/default-thumbnail.jpg`, // TODO: Generate thumbnail
      category,
      tags: processTags,
      isPublic,
      fileSize: req.file.size,
      processingStatus: 'processing'
    });

    await video.save();

    // TODO: Add video processing logic here
    // For now, we'll mark it as completed
    setTimeout(async () => {
      await Video.findByIdAndUpdate(video._id, {
        processingStatus: 'completed',
        uploadProgress: 100
      });
    }, 2000);

    res.status(201).json({
      message: 'Video uploaded successfully',
      video: {
        id: video._id,
        title: video.title,
        processingStatus: video.processingStatus
      }
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ message: 'Server error uploading video' });
  }
});

// @route   PUT /api/videos/:id
// @desc    Update video
// @access  Private
router.put('/:id', [
  auth,
  body('title')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Title must be less than 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Description must be less than 5000 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Check if user owns the video
    if (video.uploader.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, category, tags, isPublic } = req.body;
    const updateFields = {};

    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (category !== undefined) updateFields.category = category;
    if (isPublic !== undefined) updateFields.isPublic = isPublic;
    if (tags !== undefined) {
      updateFields.tags = typeof tags === 'string' 
        ? tags.split(',').map(tag => tag.trim().toLowerCase())
        : tags;
    }

    const updatedVideo = await Video.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Video updated successfully',
      video: updatedVideo
    });
  } catch (error) {
    console.error('Video update error:', error);
    res.status(500).json({ message: 'Server error updating video' });
  }
});

// @route   DELETE /api/videos/:id
// @desc    Delete video
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Check if user owns the video or is admin
    if (video.uploader.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Video.findByIdAndDelete(req.params.id);

    // TODO: Delete associated files from storage

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Video delete error:', error);
    res.status(500).json({ message: 'Server error deleting video' });
  }
});

// @route   POST /api/videos/:id/like
// @desc    Like/unlike video
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const existingLike = video.likes.find(
      like => like.user.toString() === req.user.id
    );

    if (existingLike) {
      // Unlike
      video.likes = video.likes.filter(
        like => like.user.toString() !== req.user.id
      );
      await video.save();

      // Remove from user's liked videos
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { likedVideos: video._id }
      });

      res.json({ message: 'Video unliked', liked: false, likeCount: video.likeCount });
    } else {
      // Like
      video.likes.push({ user: req.user.id });
      await video.save();

      // Add to user's liked videos
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { likedVideos: video._id }
      });

      res.json({ message: 'Video liked', liked: true, likeCount: video.likeCount });
    }
  } catch (error) {
    console.error('Video like error:', error);
    res.status(500).json({ message: 'Server error processing like' });
  }
});

// @route   POST /api/videos/:id/view
// @desc    Increment video view count
// @access  Public
router.post('/:id/view', optionalAuth, async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Add to user's watch history if authenticated
    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, {
        $push: {
          watchHistory: {
            video: video._id,
            watchedAt: new Date()
          }
        }
      });
    }

    res.json({ message: 'View recorded', views: video.views });
  } catch (error) {
    console.error('Video view error:', error);
    res.status(500).json({ message: 'Server error recording view' });
  }
});

module.exports = router;