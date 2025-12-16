const express = require('express');
const User = require('../models/User');
const Video = require('../models/Video');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/channels/:id
// @desc    Get channel information
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email')
      .populate('channel.subscribers', 'username avatar');

    if (!user) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Get channel videos
    const videos = await Video.find({ 
      uploader: user._id, 
      isPublic: true,
      processingStatus: 'completed' 
    })
      .sort({ createdAt: -1 })
      .select('title thumbnail views createdAt duration');

    const channelInfo = {
      id: user._id,
      username: user.username,
      avatar: user.avatar,
      channel: user.channel,
      joinedAt: user.createdAt,
      videos,
      totalVideos: videos.length,
      totalViews: videos.reduce((sum, video) => sum + video.views, 0)
    };

    res.json(channelInfo);
  } catch (error) {
    console.error('Get channel error:', error);
    res.status(500).json({ message: 'Server error fetching channel' });
  }
});

// @route   POST /api/channels/:id/subscribe
// @desc    Subscribe/unsubscribe to channel
// @access  Private
router.post('/:id/subscribe', auth, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot subscribe to your own channel' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const currentUser = await User.findById(req.user.id);

    const isSubscribed = currentUser.subscriptions.includes(req.params.id);
    const isSubscriber = targetUser.channel.subscribers.includes(req.user.id);

    if (isSubscribed && isSubscriber) {
      // Unsubscribe
      currentUser.subscriptions = currentUser.subscriptions.filter(
        sub => sub.toString() !== req.params.id
      );
      targetUser.channel.subscribers = targetUser.channel.subscribers.filter(
        sub => sub.toString() !== req.user.id
      );

      await currentUser.save();
      await targetUser.save();

      res.json({ 
        message: 'Unsubscribed successfully', 
        subscribed: false,
        subscriberCount: targetUser.channel.subscriberCount
      });
    } else {
      // Subscribe
      if (!isSubscribed) {
        currentUser.subscriptions.push(req.params.id);
      }
      if (!isSubscriber) {
        targetUser.channel.subscribers.push(req.user.id);
      }

      await currentUser.save();
      await targetUser.save();

      res.json({ 
        message: 'Subscribed successfully', 
        subscribed: true,
        subscriberCount: targetUser.channel.subscriberCount
      });
    }
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ message: 'Server error processing subscription' });
  }
});

// @route   GET /api/channels/:id/subscribers
// @desc    Get channel subscribers
// @access  Public
router.get('/:id/subscribers', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(req.params.id)
      .populate({
        path: 'channel.subscribers',
        select: 'username avatar channel.name',
        options: {
          limit: limit * 1,
          skip: (page - 1) * limit
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const totalSubscribers = user.channel.subscriberCount;
    const totalPages = Math.ceil(totalSubscribers / limit);

    res.json({
      subscribers: user.channel.subscribers,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalSubscribers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({ message: 'Server error fetching subscribers' });
  }
});

module.exports = router;