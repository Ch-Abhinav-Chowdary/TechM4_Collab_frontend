import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axiosConfig';
import { motion, AnimatePresence } from 'framer-motion';
import './UserProfile.css';

const UserProfile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: user?.name, email: user?.email, memberRole: user?.memberRole || '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showAchievements, setShowAchievements] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [realTimeStats, setRealTimeStats] = useState({
    tasksCompleted: 0,
    totalTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    streakDays: 0,
    totalXP: 0,
    level: 1,
    badges: [],
    badgesCount: 0,
    rank: 'Bronze',
    leaderboardRank: null,
    completionRate: 0,
    weeklyProgress: [],
    totalActivities: 0,
    recentActivities: 0
  });
  const [achievements, setAchievements] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  
  const fileInputRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name, email: user.email, memberRole: user.memberRole || '' });
      fetchUserStats();
      generateMockAchievements();
      startRealTimeUpdates();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user]);

  const fetchUserStats = async () => {
    try {
      setStatsLoading(true);
      const res = await api.get('/auth/user/stats');
      setRealTimeStats(res.data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const startRealTimeUpdates = () => {
    intervalRef.current = setInterval(() => {
      fetchUserStats();
    }, 30000); // Update every 30 seconds
  };

  const getRank = (xp) => {
    if (xp < 100) return 'Bronze';
    if (xp < 500) return 'Silver';
    if (xp < 1000) return 'Gold';
    if (xp < 2000) return 'Platinum';
    return 'Diamond';
  };

  const generateMockAchievements = () => {
    const mockAchievements = [
      { id: 1, name: 'First Task', icon: '🎯', description: 'Complete your first task', unlocked: true, date: '2024-01-15' },
      { id: 2, name: 'Streak Master', icon: '🔥', description: 'Maintain a 7-day streak', unlocked: true, date: '2024-01-20' },
      { id: 3, name: 'Team Player', icon: '👥', description: 'Collaborate on 10 tasks', unlocked: false, progress: 7 },
      { id: 4, name: 'Speed Demon', icon: '⚡', description: 'Complete 5 tasks in one day', unlocked: false, progress: 3 },
      { id: 5, name: 'Perfect Score', icon: '⭐', description: 'Get 100% on all tasks', unlocked: false, progress: 85 },
      { id: 6, name: 'Mentor', icon: '🎓', description: 'Help 5 team members', unlocked: false, progress: 2 }
    ];
    setAchievements(mockAchievements);
  };

  if (!user) {
    return (
      <motion.div 
        className="user-profile loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </motion.div>
    );
  }

  const getCategoryDetails = (role, memberRole = null) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Administrator',
          color: '#EF4444',
          gradient: 'linear-gradient(135deg, #EF4444, #DC2626)',
          icon: '👑',
          desc: 'Full access to system management and analytics.',
          perks: ['System Administration', 'User Management', 'Analytics Access', 'Workflow Control']
        };
      case 'member':
        return {
          label: memberRole || 'Member',
          color: '#F59E0B',
          gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
          icon: '⚡',
          desc: memberRole ? `Works as ${memberRole} in the team.` : 'Team member with task management capabilities.',
          perks: ['Task Management', 'Team Coordination', 'Progress Tracking', 'File Access']
        };
      case 'viewer':
        return {
          label: 'Developer',
          color: '#3B82F6',
          gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)',
          icon: '💻',
          desc: 'Works on assigned tasks and contributes to the product.',
          perks: ['Task Execution', 'File Collaboration', 'Progress Updates']
        };
      default:
        return {
          label: 'Team Member',
          color: '#6B7280',
          gradient: 'linear-gradient(135deg, #6B7280, #4B5563)',
          icon: '👤',
          desc: 'General contributor with limited access.',
          perks: ['Basic Access', 'Task Viewing', 'Limited Collaboration']
        };
    }
  };

  const category = getCategoryDetails(user.role, user.memberRole);
  const isViewer = user.role === 'viewer';

  const handleEditToggle = () => {
    setEditing(!editing);
    setError('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.put(`/auth/profile`, formData);
      setUser(res.data);
      setEditing(false);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!profileImage) return;
    
    const formData = new FormData();
    formData.append('avatar', profileImage);
    
    try {
      const res = await api.put('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser({ ...user, avatar: res.data.avatar });
      setShowImageModal(false);
      setProfileImage(null);
      setImagePreview(null);
    } catch (err) {
      setError('Failed to upload image');
    }
  };

  const tabs = [
    { id: 'overview', label: ' Overview', icon: '👤' },
    { id: 'achievements', label: '🏆 Achievements', icon: '🏆' },
    { id: 'stats', label: '📊 Statistics', icon: '📊' },
    { id: 'settings', label: '⚙️ Settings', icon: '⚙️' }
  ];

  return (
    <motion.div 
      className="user-profile"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div 
            className="confetti-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="confetti-piece"
                initial={{ 
                  x: Math.random() * window.innerWidth,
                  y: -10,
                  rotate: 0
                }}
                animate={{ 
                  y: window.innerHeight + 10,
                  rotate: 360,
                  x: Math.random() * window.innerWidth
                }}
                transition={{ 
                  duration: 3 + Math.random() * 2,
                  ease: "easeOut"
                }}
                style={{
                  background: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 5)]
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Header */}
      <motion.div 
        className="profile-header"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div 
          className="profile-avatar-container"
          whileHover={{ scale: 1.1 }}
          onClick={() => !isViewer && setShowImageModal(true)}
        >
          <motion.div 
            className="profile-avatar"
            style={{ background: category.gradient }}
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Profile" className="avatar-image" />
            ) : user.avatar ? (
              <img src={user.avatar} alt="Profile" className="avatar-image" />
            ) : (
              <span className="avatar-text">{user.name[0].toUpperCase()}</span>
            )}
          </motion.div>
          {!isViewer && (
            <motion.div 
              className="avatar-edit-overlay"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
            >
              📷
            </motion.div>
          )}
        </motion.div>
        
        <div className="profile-info">
          <motion.h1 
            className="profile-name"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {user.name}
          </motion.h1>
          <p className="profile-email">{user.email}</p>
          
          <motion.div 
            className="role-badge"
            style={{ background: category.gradient }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {category.icon} {category.label}
          </motion.div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div 
        className="profile-tabs"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tab.icon} {tab.label.split(' ')[1]}
          </motion.button>
        ))}
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Role Information */}
            <motion.div 
              className="role-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3>Role Information</h3>
              <p className="role-description">{category.desc}</p>
              
              <div className="perks-grid">
                {category.perks.map((perk, index) => (
                  <motion.div
                    key={perk}
                    className="perk-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <span className="perk-icon">✨</span>
                    <span>{perk}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div 
              className="quick-stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3>Quick Stats</h3>
              {statsLoading ? (
                <div className="stats-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading statistics...</p>
                </div>
              ) : (
                <div className="stats-grid">
                  {[
                    { label: 'Tasks Completed', value: realTimeStats.tasksCompleted, icon: '✅', color: '#10B981', suffix: `/${realTimeStats.totalTasks}` },
                    { label: 'Streak Days', value: realTimeStats.streakDays, icon: '🔥', color: '#F59E0B', suffix: ' days' },
                    { label: 'Total XP', value: realTimeStats.totalXP, icon: '⭐', color: '#8B5CF6', suffix: ' XP' },
                    { label: 'Level', value: realTimeStats.level, icon: '📈', color: '#3B82F6', suffix: '' },
                    { label: 'Rank', value: realTimeStats.rank, icon: '🏆', color: '#EF4444', suffix: '' },
                    { label: 'Badges', value: realTimeStats.badgesCount, icon: '🎖️', color: '#F59E0B', suffix: '' }
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      className="stat-card"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                    >
                      <div className="stat-icon" style={{ background: stat.color }}>
                        {stat.icon}
                      </div>
                      <div className="stat-content">
                        <span className="stat-value">{stat.value}{stat.suffix}</span>
                        <span className="stat-label">{stat.label}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Edit Profile Section */}
            {!isViewer && (
              <motion.div 
                className="edit-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <motion.button
                  onClick={handleEditToggle}
                  className="edit-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {editing ? '❌ Cancel' : '✏️ Edit Profile'}
                </motion.button>

                <AnimatePresence>
                  {editing && (
                    <motion.form 
                      onSubmit={handleSubmit} 
                      className="edit-form"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="form-group">
                        <label>Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your name"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Your email"
                        />
                      </div>
                      
                      {user.role === 'member' && (
                        <div className="form-group">
                          <label>Member Role</label>
                          <input
                            type="text"
                            name="memberRole"
                            value={formData.memberRole}
                            onChange={handleChange}
                            placeholder="e.g., Developer, Designer, Team Lead"
                          />
                        </div>
                      )}
                      
                      {error && (
                        <motion.p 
                          className="error"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          {error}
                        </motion.p>
                      )}
                      
                      <motion.button
                        type="submit"
                        className="save-btn"
                        disabled={loading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {loading ? '💾 Saving...' : '💾 Save Changes'}
                      </motion.button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'achievements' && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="achievements-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3>🏆 Achievements</h3>
              <div className="achievements-grid">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <div className="achievement-icon">
                      {achievement.icon}
                    </div>
                    <div className="achievement-content">
                      <h4>{achievement.name}</h4>
                      <p>{achievement.description}</p>
                      {achievement.unlocked ? (
                        <span className="unlock-date">Unlocked {achievement.date}</span>
                      ) : (
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${achievement.progress}%` }}
                          ></div>
                          <span>{achievement.progress}%</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="stats-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3>📊 Detailed Statistics</h3>
              {statsLoading ? (
                <div className="stats-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading detailed statistics...</p>
                </div>
              ) : (
                <div className="detailed-stats">
                  {/* Task Statistics */}
                  <motion.div 
                    className="stat-summary"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h4>Task Overview</h4>
                    <div className="summary-grid">
                      <div className="summary-item">
                        <span className="summary-label">Total Tasks</span>
                        <span className="summary-value">{realTimeStats.totalTasks}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Completed</span>
                        <span className="summary-value" style={{ color: '#10B981' }}>{realTimeStats.tasksCompleted}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">In Progress</span>
                        <span className="summary-value" style={{ color: '#3B82F6' }}>{realTimeStats.inProgressTasks}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Overdue</span>
                        <span className="summary-value" style={{ color: '#EF4444' }}>{realTimeStats.overdueTasks}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Completion Rate</span>
                        <span className="summary-value" style={{ color: '#8B5CF6' }}>{realTimeStats.completionRate}%</span>
                      </div>
                      {realTimeStats.leaderboardRank && (
                        <div className="summary-item">
                          <span className="summary-label">Leaderboard Rank</span>
                          <span className="summary-value" style={{ color: '#F59E0B' }}>#{realTimeStats.leaderboardRank}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Weekly Progress Chart */}
                  <motion.div 
                    className="stat-chart"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h4>Weekly Progress (Tasks Completed)</h4>
                    <div className="chart-container">
                      {realTimeStats.weeklyProgress && realTimeStats.weeklyProgress.length > 0 ? (
                        realTimeStats.weeklyProgress.map((day, index) => {
                          const maxCompleted = Math.max(...realTimeStats.weeklyProgress.map(d => d.completed), 1);
                          const percentage = maxCompleted > 0 ? (day.completed / maxCompleted) * 100 : 0;
                          return (
                            <motion.div
                              key={index}
                              className="chart-bar"
                              initial={{ height: 0 }}
                              animate={{ height: `${percentage}%` }}
                              transition={{ delay: 0.5 + index * 0.1 }}
                              style={{ background: `hsl(${200 + index * 20}, 70%, 60%)` }}
                              title={`${new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}: ${day.completed} tasks`}
                            >
                              <span className="bar-value">{day.completed}</span>
                              <span className="bar-label">
                                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                              </span>
                            </motion.div>
                          );
                        })
                      ) : (
                        <p>No progress data available</p>
                      )}
                    </div>
                  </motion.div>

                  {/* Activity Statistics */}
                  <motion.div 
                    className="activity-stats"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h4>Activity Summary</h4>
                    <div className="activity-summary">
                      <div className="activity-item">
                        <span className="activity-label">Total Activities</span>
                        <span className="activity-value">{realTimeStats.totalActivities}</span>
                      </div>
                      <div className="activity-item">
                        <span className="activity-label">Recent (7 days)</span>
                        <span className="activity-value">{realTimeStats.recentActivities}</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="settings-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3>⚙️ Account Settings</h3>
              <div className="settings-grid">
                <motion.div 
                  className="setting-item"
                  whileHover={{ scale: 1.02 }}
                >
                  <h4>🔔 Notifications</h4>
                  <p>Manage your notification preferences</p>
                  <button className="setting-btn">Configure</button>
                </motion.div>
                
                <motion.div 
                  className="setting-item"
                  whileHover={{ scale: 1.02 }}
                >
                  <h4>🔒 Privacy</h4>
                  <p>Control your privacy settings</p>
                  <button className="setting-btn">Manage</button>
                </motion.div>
                
                <motion.div 
                  className="setting-item"
                  whileHover={{ scale: 1.02 }}
                >
                  <h4>🎨 Appearance</h4>
                  <p>Customize your interface</p>
                  <button className="setting-btn">Customize</button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Upload Modal */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImageModal(false)}
          >
            <motion.div 
              className="modal-content image-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>📷 Update Profile Picture</h3>
              
              <div className="image-upload-area">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                ) : (
                  <div className="upload-placeholder">
                    <span>📷</span>
                    <p>Click to select an image</p>
                  </div>
                )}
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              
              <div className="modal-actions">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="select-btn"
                >
                  Select Image
                </button>
                {imagePreview && (
                  <button 
                    onClick={handleImageUpload}
                    className="upload-btn"
                  >
                    Upload
                  </button>
                )}
                <button 
                  onClick={() => setShowImageModal(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UserProfile;