import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../utils/AuthContext';

const VideoPlayer = () => {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [relatedVideos, setRelatedVideos] = useState([]);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchVideo();
      fetchComments();
      fetchRelatedVideos();
    }
  }, [id]);

  const fetchVideo = async () => {
    try {
      const response = await axios.get(`/api/videos/${id}`);
      setVideo(response.data);
      
      // Record view
      await axios.post(`/api/videos/${id}/view`);
      
      // Check if user liked this video
      if (user && response.data.likes) {
        setIsLiked(response.data.likes.some(like => like.user === user.id));
      }
      
      // Check if user is subscribed to uploader
      if (user && user.subscriptions) {
        setIsSubscribed(user.subscriptions.includes(response.data.uploader._id));
      }
    } catch (error) {
      console.error('Error fetching video:', error);
      setError('Video not found or failed to load');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/api/videos/${id}/comments`);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchRelatedVideos = async () => {
    try {
      const response = await axios.get('/api/videos?limit=8');
      setRelatedVideos(response.data.videos || []);
    } catch (error) {
      console.error('Error fetching related videos:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post(`/api/videos/${id}/like`);
      setIsLiked(response.data.liked);
      setVideo(prev => ({ ...prev, likeCount: response.data.likeCount }));
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post(`/api/channels/${video.uploader._id}/subscribe`);
      setIsSubscribed(response.data.subscribed);
      setVideo(prev => ({
        ...prev,
        uploader: {
          ...prev.uploader,
          channel: {
            ...prev.uploader.channel,
            subscriberCount: response.data.subscriberCount
          }
        }
      }));
    } catch (error) {
      console.error('Error subscribing:', error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!newComment.trim()) return;

    try {
      const response = await axios.post(`/api/videos/${id}/comments`, {
        text: newComment
      });
      
      setComments(prev => [response.data.comment, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatViews = (views) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views?.toString() || '0';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Video Not Found</h2>
          <p className="text-gray-400 mb-4">The video you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Video Section */}
        <div className="lg:col-span-2">
          {/* Video Player */}
          <div className="bg-black rounded-lg overflow-hidden mb-4">
            <video
              className="w-full h-auto"
              controls
              poster={video.thumbnail}
              src={video.videoUrl}
            >
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Video Info */}
          <div className="bg-gray-800 rounded-lg p-6 mb-4">
            <h1 className="text-2xl font-bold mb-4">{video.title}</h1>
            
            <div className="flex flex-wrap items-center justify-between mb-4">
              <div className="text-gray-400 text-sm">
                {formatViews(video.views)} views • {formatDate(video.createdAt)}
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isLiked
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span>{isLiked ? '❤️' : '🤍'}</span>
                  <span>{video.likeCount || 0}</span>
                </button>
                
                <button className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-lg transition-colors">
                  <span>📤</span>
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Channel Info */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-700">
              <div className="flex items-center space-x-4">
                <Link to={`/channel/${video.uploader._id}`}>
                  <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {video.uploader.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </Link>
                <div>
                  <Link 
                    to={`/channel/${video.uploader._id}`}
                    className="font-medium hover:text-gray-300"
                  >
                    {video.uploader.username}
                  </Link>
                  <div className="text-sm text-gray-400">
                    {formatViews(video.uploader.channel?.subscriberCount || 0)} subscribers
                  </div>
                </div>
              </div>
              
              {user?.id !== video.uploader._id && (
                <button
                  onClick={handleSubscribe}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    isSubscribed
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              )}
            </div>

            {/* Description */}
            {video.description && (
              <div className="text-gray-300">
                <div className="whitespace-pre-wrap">{video.description}</div>
              </div>
            )}

            {/* Tags */}
            {video.tags && video.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {video.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">
              Comments ({comments.length})
            </h3>

            {/* Add Comment Form */}
            {user ? (
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">
                      {user.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows="3"
                    />
                    <div className="flex justify-end mt-2 space-x-2">
                      <button
                        type="button"
                        onClick={() => setNewComment('')}
                        className="px-4 py-1 text-gray-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="px-4 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
                      >
                        Comment
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mb-6 text-center py-4">
                <p className="text-gray-400 mb-2">Sign in to leave a comment</p>
                <button
                  onClick={() => navigate('/login')}
                  className="text-red-400 hover:text-red-300 underline"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment._id} className="flex space-x-3">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">
                      {comment.author?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm">
                        {comment.author?.username}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <div className="text-gray-300 text-sm">
                      {comment.text}
                    </div>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No comments yet. Be the first to comment!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Related Videos */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-bold mb-4">Related Videos</h3>
            <div className="space-y-3">
              {relatedVideos
                .filter(relatedVideo => relatedVideo._id !== video._id)
                .slice(0, 6)
                .map((relatedVideo) => (
                <Link
                  key={relatedVideo._id}
                  to={`/video/${relatedVideo._id}`}
                  className="flex space-x-3 hover:bg-gray-700 p-2 rounded transition-colors"
                >
                  <img
                    src={relatedVideo.thumbnail || '/api/placeholder/120/68'}
                    alt={relatedVideo.title}
                    className="w-24 h-14 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium line-clamp-2 mb-1">
                      {relatedVideo.title}
                    </div>
                    <div className="text-xs text-gray-400">
                      {relatedVideo.uploader?.username}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatViews(relatedVideo.views)} views
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;