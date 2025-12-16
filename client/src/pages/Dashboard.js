import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../utils/AuthContext';

const Dashboard = () => {
  const [userVideos, setUserVideos] = useState([]);
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    totalSubscribers: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    channelName: '',
    channelDescription: ''
  });

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchDashboardData();
    setProfileData({
      username: user.username || '',
      channelName: user.channel?.name || user.username || '',
      channelDescription: user.channel?.description || ''
    });
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      // Fetch user's videos
      const videosResponse = await axios.get('/api/videos', {
        params: { uploader: user.id }
      });
      
      // Filter to only user's videos (since the API might return all videos)
      const userVids = (videosResponse.data.videos || []).filter(
        video => video.uploader._id === user.id
      );
      
      setUserVideos(userVids);

      // Calculate stats
      const totalViews = userVids.reduce((sum, video) => sum + (video.views || 0), 0);
      
      setStats({
        totalVideos: userVids.length,
        totalViews,
        totalSubscribers: user.channel?.subscriberCount || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put('/api/auth/profile', {
        username: profileData.username,
        channel: {
          name: profileData.channelName,
          description: profileData.channelDescription
        }
      });
      
      setEditingProfile(false);
      // Refresh user data
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      await axios.delete(`/api/videos/${videoId}`);
      setUserVideos(prev => prev.filter(video => video._id !== videoId));
      fetchDashboardData(); // Refresh stats
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-400">Manage your channel and videos</p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Videos</p>
              <p className="text-2xl font-bold">{stats.totalVideos}</p>
            </div>
            <div className="text-3xl">📹</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Views</p>
              <p className="text-2xl font-bold">{formatViews(stats.totalViews)}</p>
            </div>
            <div className="text-3xl">👁️</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Subscribers</p>
              <p className="text-2xl font-bold">{formatViews(stats.totalSubscribers)}</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 rounded-lg mb-6">
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-white border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'videos'
                ? 'text-white border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            My Videos
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-white border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Channel Settings
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/upload"
                className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">📤</div>
                <div className="font-medium">Upload Video</div>
              </Link>
              
              <Link
                to={`/channel/${user.id}`}
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">📺</div>
                <div className="font-medium">View Channel</div>
              </Link>
              
              <button
                onClick={() => setActiveTab('profile')}
                className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">⚙️</div>
                <div className="font-medium">Edit Profile</div>
              </button>
              
              <button
                onClick={logout}
                className="bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">🚪</div>
                <div className="font-medium">Logout</div>
              </button>
            </div>
          </div>

          {/* Recent Videos */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Recent Videos</h3>
            {userVideos.length > 0 ? (
              <div className="space-y-4">
                {userVideos.slice(0, 5).map((video) => (
                  <div key={video._id} className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
                    <img
                      src={video.thumbnail || '/api/placeholder/80/45'}
                      alt={video.title}
                      className="w-20 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{video.title}</h4>
                      <p className="text-sm text-gray-400">
                        {formatViews(video.views)} views • {formatDate(video.createdAt)}
                      </p>
                    </div>
                    <Link
                      to={`/video/${video._id}`}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📹</div>
                <p className="text-gray-400 mb-4">No videos uploaded yet</p>
                <Link
                  to="/upload"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Upload Your First Video
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'videos' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">My Videos ({userVideos.length})</h3>
            <Link
              to="/upload"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Upload New Video
            </Link>
          </div>

          {userVideos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-2">Video</th>
                    <th className="text-left py-3 px-2">Status</th>
                    <th className="text-left py-3 px-2">Views</th>
                    <th className="text-left py-3 px-2">Likes</th>
                    <th className="text-left py-3 px-2">Uploaded</th>
                    <th className="text-left py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userVideos.map((video) => (
                    <tr key={video._id} className="border-b border-gray-700 hover:bg-gray-700">
                      <td className="py-3 px-2">
                        <div className="flex items-center space-x-3">
                          <img
                            src={video.thumbnail || '/api/placeholder/60/34'}
                            alt={video.title}
                            className="w-16 h-9 object-cover rounded"
                          />
                          <div>
                            <div className="font-medium">{video.title}</div>
                            <div className="text-sm text-gray-400 capitalize">
                              {video.category}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          video.processingStatus === 'completed' 
                            ? 'bg-green-900 text-green-300' 
                            : video.processingStatus === 'processing'
                            ? 'bg-yellow-900 text-yellow-300'
                            : 'bg-red-900 text-red-300'
                        }`}>
                          {video.processingStatus}
                        </span>
                      </td>
                      <td className="py-3 px-2">{formatViews(video.views)}</td>
                      <td className="py-3 px-2">{video.likeCount || 0}</td>
                      <td className="py-3 px-2">{formatDate(video.createdAt)}</td>
                      <td className="py-3 px-2">
                        <div className="flex space-x-2">
                          <Link
                            to={`/video/${video._id}`}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDeleteVideo(video._id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📹</div>
              <p className="text-gray-400 mb-4">No videos uploaded yet</p>
              <Link
                to="/upload"
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Upload Your First Video
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-6">Channel Settings</h3>
          
          {editingProfile ? (
            <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Channel Name</label>
                <input
                  type="text"
                  value={profileData.channelName}
                  onChange={(e) => setProfileData({...profileData, channelName: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Channel Description</label>
                <textarea
                  value={profileData.channelDescription}
                  onChange={(e) => setProfileData({...profileData, channelDescription: e.target.value})}
                  rows="4"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProfile(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                <p className="text-white">{user.username}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Channel Name</label>
                <p className="text-white">{user.channel?.name || user.username}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Channel Description</label>
                <p className="text-white">{user.channel?.description || 'No description set'}</p>
              </div>
              
              <button
                onClick={() => setEditingProfile(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;