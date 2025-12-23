import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import socket from '../socket';
import api from '../utils/axiosConfig';
import './ActivityFeed.css';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchActivities();
    setupSocketListeners();

    return () => {
      // Cleanup socket listeners
      socket.off('activity');
    };
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/activities?limit=20');
      setActivities(response.data);
    } catch (err) {
      setError('Failed to load activities');
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socket.on('activity', (newActivity) => {
      setActivities(prev => [newActivity, ...prev.slice(0, 19)]);
    });
  };

  const getActivityIcon = (type) => {
    const icons = {
      'user_joined_room': '👋',
      'user_left': '👋',
      'user_joined_file': '📝',
      'file_saved': '📁',
      'message_sent': '💬',
      'task_created': '📋',
      'task_completed': '✅',
      'task_assigned': '👤',
      'file_uploaded': '📁',
      'user_levelup': '🎉',
      'workflow_executed': '⚡'
    };
    return icons[type] || '📢';
  };

  const getActivityColor = (type) => {
    const colors = {
      'user_joined_room': '#10B981',
      'user_left': '#6B7280',
      'user_joined_file': '#3B82F6',
      'file_saved': '#059669',
      'message_sent': '#8B5CF6',
      'task_created': '#F59E0B',
      'task_completed': '#10B981',
      'task_assigned': '#3B82F6',
      'file_uploaded': '#8B5CF6',
      'user_levelup': '#F59E0B',
      'workflow_executed': '#EF4444'
    };
    return colors[type] || '#6B7280';
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="activity-feed">
        <div className="activity-header">
          <h3>Live Activity Feed</h3>
        </div>
        <div className="activity-loading">
          <div className="spinner"></div>
          <p>Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-feed">
      <div className="activity-header">
        <h3>Live Activity Feed</h3>
        <button 
          className="refresh-btn"
          onClick={fetchActivities}
          title="Refresh activities"
        >
          ��
        </button>
      </div>

      {error && (
        <div className="activity-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="activity-list">
        {activities.length === 0 ? (
          <div className="activity-empty">
            <div className="empty-icon">📢</div>
            <p>No activities yet</p>
            <small>Activities will appear here as team members work</small>
          </div>
        ) : (
          activities.map((activity) => (
            <div 
              key={activity.id || activity._id} 
              className="activity-item"
              style={{ borderLeftColor: getActivityColor(activity.type) }}
            >
              <div className="activity-icon">
                {getActivityIcon(activity.type)}
              </div>
              <div className="activity-content">
                <div className="activity-message">
                  {activity.message}
                </div>
                <div className="activity-meta">
                  <span className="activity-time">
                    {formatTime(activity.timestamp)}
                  </span>
                  {activity.user && (
                    <span className="activity-user">
                      by {activity.user.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {activities.length > 0 && (
        <div className="activity-footer">
          <small>Showing {activities.length} recent activities</small>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed; 