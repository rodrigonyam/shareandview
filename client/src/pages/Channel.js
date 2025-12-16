import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../utils/AuthContext';
import VideoCard from '../components/VideoCard';

const Channel = () => {
  const { id } = useParams();
  const [channelData, setChannelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState('videos');

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchChannelData();
    }
  }, [id]);

  useEffect(() => {
    if (user && channelData) {
      setIsSubscribed(
        user.subscriptions?.includes(channelData.id) || false
      );
    }
  }, [user, channelData]);

  const fetchChannelData = async () => {
    try {
      const response = await axios.get(`/api/channels/${id}`);
      setChannelData(response.data);
    } catch (error) {
      console.error('Error fetching channel:', error);
      setError('Channel not found or failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post(`/api/channels/${id}/subscribe`);
      setIsSubscribed(response.data.subscribed);
      setChannelData(prev => ({
        ...prev,
        channel: {
          ...prev.channel,
          subscriberCount: response.data.subscriberCount
        }
      }));
    } catch (error) {
      console.error('Error subscribing:', error);
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

  if (!channelData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Channel Not Found</h2>
          <p className="text-gray-400 mb-4">The channel you're looking for doesn't exist.</p>
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
      {/* Channel Header */}
      <div className="bg-gray-800 rounded-lg overflow-hidden mb-6">
        {/* Channel Banner */}
        <div className="h-32 sm:h-48 bg-gradient-to-r from-red-600 to-red-800"></div>
        
        {/* Channel Info */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-600 rounded-full flex items-center justify-center -mt-10 sm:-mt-12 border-4 border-gray-800">
              <span className="text-white font-bold text-2xl sm:text-3xl">
                {channelData.username?.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Channel Details */}
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                {channelData.channel?.name || channelData.username}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm mb-4">
                <span>@{channelData.username}</span>
                <span>•</span>
                <span>{formatViews(channelData.channel?.subscriberCount || 0)} subscribers</span>
                <span>•</span>
                <span>{channelData.totalVideos || 0} videos</span>
                <span>•</span>
                <span>{formatViews(channelData.totalViews || 0)} total views</span>
              </div>

              {channelData.channel?.description && (
                <p className="text-gray-300 mb-4 max-w-2xl">
                  {channelData.channel.description}
                </p>
              )}

              <div className="text-sm text-gray-400">
                Joined {formatDate(channelData.joinedAt)}
              </div>
            </div>

            {/* Subscribe Button */}
            {user?.id !== channelData.id && (
              <div className="w-full sm:w-auto">
                <button
                  onClick={handleSubscribe}
                  className={`w-full sm:w-auto px-6 py-2 rounded-lg font-medium transition-colors ${
                    isSubscribed
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              </div>
            )}

            {/* Edit Channel Button (if own channel) */}
            {user?.id === channelData.id && (
              <div className="w-full sm:w-auto">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Manage Channel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Channel Navigation */}
      <div className="bg-gray-800 rounded-lg mb-6">
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'videos'
                ? 'text-white border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Videos ({channelData.videos?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'about'
                ? 'text-white border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            About
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'videos' && (
        <div>
          {channelData.videos && channelData.videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {channelData.videos.map((video) => (
                <VideoCard 
                  key={video._id} 
                  video={{
                    ...video,
                    uploader: {
                      _id: channelData.id,
                      username: channelData.username
                    }
                  }} 
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">📹</div>
              <h3 className="text-xl font-semibold mb-2">No videos uploaded yet</h3>
              <p className="text-gray-400 mb-4">
                {user?.id === channelData.id 
                  ? 'Upload your first video to get started!' 
                  : 'This channel hasn\'t uploaded any videos yet.'}
              </p>
              {user?.id === channelData.id && (
                <button
                  onClick={() => navigate('/upload')}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Upload Video
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'about' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-6">About</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-4">Channel Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total subscribers:</span>
                  <span>{formatViews(channelData.channel?.subscriberCount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total videos:</span>
                  <span>{channelData.totalVideos || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total views:</span>
                  <span>{formatViews(channelData.totalViews || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Joined:</span>
                  <span>{formatDate(channelData.joinedAt)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Description</h4>
              <p className="text-gray-300">
                {channelData.channel?.description || 'No channel description available.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Channel;