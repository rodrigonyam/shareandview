import React from 'react';
import { Link } from 'react-router-dom';

const VideoCard = ({ video }) => {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  return (
    <Link to={`/video/${video._id}`} className="video-card block group">
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
        <div className="relative">
          <img
            src={video.thumbnail || '/api/placeholder/320/180'}
            alt={video.title}
            className="w-full h-48 object-cover"
          />
          {video.duration && (
            <span className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
              {formatDuration(video.duration)}
            </span>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-gray-300">
            {video.title}
          </h3>
          
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-xs text-white">
                {video.uploader?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-gray-400">
              {video.uploader?.username}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>{formatViews(video.views || 0)} views</span>
            <span>•</span>
            <span>{formatDate(video.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;