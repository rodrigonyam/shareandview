const express = require('express');
const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Video = require('../models/Video');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/videos/:videoId/comments
// @desc    Get comments for a video
// @access  Public
router.get('/:videoId/comments', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = req.query;

    // Verify video exists
    const video = await Video.findById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    // Get top-level comments (no parent)
    const comments = await Comment.find({ 
      video: req.params.videoId, 
      parentComment: null,
      isDeleted: false
    })
      .populate('author', 'username avatar')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'username avatar'
        },
        match: { isDeleted: false }
      })
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Comment.countDocuments({ 
      video: req.params.videoId, 
      parentComment: null,
      isDeleted: false
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalComments: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error fetching comments' });
  }
});

// @route   POST /api/videos/:videoId/comments
// @desc    Add comment to video
// @access  Private
router.post('/:videoId/comments', [
  auth,
  body('text')
    .notEmpty()
    .isLength({ max: 1000 })
    .withMessage('Comment is required and must be less than 1000 characters'),
  body('parentComment')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent comment ID')
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

    // Verify video exists
    const video = await Video.findById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const { text, parentComment } = req.body;

    // If replying to a comment, verify parent exists
    if (parentComment) {
      const parentCommentDoc = await Comment.findById(parentComment);
      if (!parentCommentDoc || parentCommentDoc.video.toString() !== req.params.videoId) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
    }

    // Create comment
    const comment = new Comment({
      text,
      author: req.user.id,
      video: req.params.videoId,
      parentComment: parentComment || null
    });

    await comment.save();

    // If this is a reply, add to parent's replies array
    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, {
        $push: { replies: comment._id }
      });
    }

    // Populate author info
    await comment.populate('author', 'username avatar');

    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error adding comment' });
  }
});

// @route   PUT /api/comments/:id
// @desc    Edit comment
// @access  Private
router.put('/:id', [
  auth,
  body('text')
    .notEmpty()
    .isLength({ max: 1000 })
    .withMessage('Comment is required and must be less than 1000 characters')
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

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    comment.text = req.body.text;
    comment.isEdited = true;
    comment.editedAt = new Date();

    await comment.save();
    await comment.populate('author', 'username avatar');

    res.json({
      message: 'Comment updated successfully',
      comment
    });
  } catch (error) {
    console.error('Edit comment error:', error);
    res.status(500).json({ message: 'Server error editing comment' });
  }
});

// @route   DELETE /api/comments/:id
// @desc    Delete comment
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment or is admin
    if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Soft delete - mark as deleted instead of removing
    comment.isDeleted = true;
    comment.text = '[Comment deleted]';
    await comment.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error deleting comment' });
  }
});

// @route   POST /api/comments/:id/like
// @desc    Like/unlike comment
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const existingLike = comment.likes.find(
      like => like.user.toString() === req.user.id
    );

    if (existingLike) {
      // Unlike
      comment.likes = comment.likes.filter(
        like => like.user.toString() !== req.user.id
      );
      await comment.save();

      res.json({ 
        message: 'Comment unliked', 
        liked: false, 
        likeCount: comment.likeCount 
      });
    } else {
      // Like
      comment.likes.push({ user: req.user.id });
      await comment.save();

      res.json({ 
        message: 'Comment liked', 
        liked: true, 
        likeCount: comment.likeCount 
      });
    }
  } catch (error) {
    console.error('Comment like error:', error);
    res.status(500).json({ message: 'Server error processing like' });
  }
});

module.exports = router;