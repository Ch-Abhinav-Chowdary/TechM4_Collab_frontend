import React, { useEffect, useState, useRef } from 'react';
import api from '../utils/axiosConfig';
import { HiSearch, HiLightningBolt, HiStar } from 'react-icons/hi';
import './Leaderboard.css';

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, weekly, monthly
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('points'); // points, level, tasks, streak
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [showAchievements, setShowAchievements] = useState(false);
  
  const confettiRef = useRef(null);

  useEffect(() => {
    fetchLeaderboard();
    fetchAchievements();
  }, []);

  useEffect(() => {
    if (showConfetti) {
      triggerConfetti();
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [showConfetti]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/auth/leaderboard');
      setUsers(res.data);
      
      // Find current user's rank
      const currentUser = res.data.find(user => user._id === localStorage.getItem('userId'));
      if (currentUser) {
        const rank = res.data.findIndex(user => user._id === currentUser._id) + 1;
        setCurrentUserRank(rank);
      }
    } catch (err) {
      setError('Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchAchievements = async () => {
    try {
      const res = await api.get('/auth/achievements');
      setAchievements(res.data);
    } catch (err) {
      console.log('Failed to fetch achievements');
    }
  };

  const triggerConfetti = () => {
    if (confettiRef.current) {
      const canvas = confettiRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const confetti = [];
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
      
      for (let i = 0; i < 150; i++) {
        confetti.push({
          x: Math.random() * canvas.width,
          y: -10,
          vx: (Math.random() - 0.5) * 8,
          vy: Math.random() * 3 + 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 10 + 5,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10
        });
      }
      
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        confetti.forEach((piece, index) => {
          piece.x += piece.vx;
          piece.y += piece.vy;
          piece.rotation += piece.rotationSpeed;
          
          ctx.save();
          ctx.translate(piece.x, piece.y);
          ctx.rotate(piece.rotation * Math.PI / 180);
          ctx.fillStyle = piece.color;
          ctx.fillRect(-piece.size/2, -piece.size/2, piece.size, piece.size);
          ctx.restore();
          
          if (piece.y > canvas.height) {
            confetti.splice(index, 1);
          }
        });
        
        if (confetti.length > 0) {
          requestAnimationFrame(animate);
        }
      };
      
      animate();
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '👑';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return 'var(--warning-500)';
      case 2: return 'var(--gray-400)';
      case 3: return 'var(--warning-600)';
      default: return 'var(--gray-600)';
    }
  };

  const getLevelProgress = (xp, level) => {
    const xpForNextLevel = level * 100;
    const xpInCurrentLevel = xp % 100;
    return Math.min((xpInCurrentLevel / 100) * 100, 100);
  };

  const getStreakEmoji = (streak) => {
    if (streak >= 7) return '🔥';
    if (streak >= 3) return '⚡';
    return '💪';
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const filteredUsers = users
    .filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'points': return b.points - a.points;
        case 'level': return b.level - a.level;
        case 'tasks': return (b.completedTasks || 0) - (a.completedTasks || 0);
        case 'streak': return (b.streak || 0) - (a.streak || 0);
        default: return b.points - a.points;
      }
    });

  const celebrateTopThree = () => {
    setShowConfetti(true);
  };

  return (
    <div className="leaderboard">
      <canvas 
        ref={confettiRef} 
        className={`confetti-canvas ${showConfetti ? 'active' : ''}`}
      />
      
      <div className="leaderboard-header">
        <div className="header-content">
          <div className="header-title">
            <h1>🏆 Leaderboard</h1>
            <p>Compete, collaborate, and celebrate success together!</p>
          </div>
          <div className="header-actions">
            <button 
              className="celebrate-btn"
              onClick={celebrateTopThree}
            >
              <HiLightningBolt className="btn-icon" />
              Celebrate Winners
            </button>
            <button 
              className="achievements-btn"
              onClick={() => setShowAchievements(true)}
            >
              <HiStar className="btn-icon" />
              View Achievements
            </button>
          </div>
        </div>
        
        {currentUserRank && (
          <div className="current-user-rank">
            <span className="rank-label">Your Rank:</span>
            <span className="rank-value">#{currentUserRank}</span>
            <span className="rank-message">
              {currentUserRank <= 3 ? '🎉 Amazing job!' : 
               currentUserRank <= 10 ? ' Keep pushing!' : 
               '🚀 You\'re on your way!'}
            </span>
          </div>
        )}
      </div>

      <div className="leaderboard-controls">
        <div className="search-filter">
          <div className="search-box">
            <HiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Time
            </button>
            <button 
              className={`filter-btn ${filter === 'weekly' ? 'active' : ''}`}
              onClick={() => setFilter('weekly')}
            >
              This Week
            </button>
            <button 
              className={`filter-btn ${filter === 'monthly' ? 'active' : ''}`}
              onClick={() => setFilter('monthly')}
            >
              This Month
            </button>
          </div>
        </div>
        
        <div className="sort-controls">
          <label>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="points">XP Points</option>
            <option value="level">Level</option>
            <option value="tasks">Tasks Completed</option>
            <option value="streak">Streak</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p className="error">{error}</p>
        </div>
      ) : (
        <div className="leaderboard-content">
          {/* Top 3 Podium */}
          {filteredUsers.length >= 3 && (
            <div className="podium-section">
              <h2> Top Performers</h2>
              <div className="podium">
                <div className="podium-place second">
                  <div className="podium-user">
                    <div className="podium-avatar">{filteredUsers[1]?.name[0]?.toUpperCase()}</div>
                    <span className="podium-name">{filteredUsers[1]?.name}</span>
                    <span className="podium-points">{filteredUsers[1]?.points} XP</span>
                  </div>
                </div>
                <div className="podium-place first">
                  <div className="podium-user">
                    <div className="podium-avatar">{filteredUsers[0]?.name[0]?.toUpperCase()}</div>
                    <span className="podium-name">{filteredUsers[0]?.name}</span>
                    <span className="podium-points">{filteredUsers[0]?.points} XP</span>
                  </div>
                </div>
                <div className="podium-place third">
                  <div className="podium-user">
                    <div className="podium-avatar">{filteredUsers[2]?.name[0]?.toUpperCase()}</div>
                    <span className="podium-name">{filteredUsers[2]?.name}</span>
                    <span className="podium-points">{filteredUsers[2]?.points} XP</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="leaderboard-table">
            <div className="table-header">
              <div className="header-cell">Rank</div>
              <div className="header-cell">Name</div>
              <div className="header-cell">XP</div>
              <div className="header-cell">Level</div>
              <div className="header-cell">Streak</div>
              <div className="header-cell">Badges</div>
              <div className="header-cell">Actions</div>
            </div>
            
            <div className="table-body">
              {filteredUsers.map((user, index) => (
                <div 
                  key={user._id || user.email} 
                  className={`table-row ${index < 3 ? 'top-three' : ''} ${user._id === localStorage.getItem('userId') ? 'current-user' : ''}`}
                  onClick={() => handleUserClick(user)}
                >
                  <div className="rank-cell">
                    <span 
                      className="rank-icon"
                      style={{ color: getRankColor(index + 1) }}
                    >
                      {getRankIcon(index + 1)}
                    </span>
                  </div>
                  <div className="name-cell">
                    <div className="user-avatar">{user.name[0].toUpperCase()}</div>
                    <div className="user-info">
                      <span className="user-name">{user.name}</span>
                      <span className="user-email">{user.email}</span>
                    </div>
                  </div>
                  <div className="xp-cell">
                    <span className="xp-value">{user.points}</span>
                    <span className="xp-label">XP</span>
                  </div>
                  <div className="level-cell">
                    <div className="level-info">
                      <span className="level-badge">Level {user.level}</span>
                      <div className="level-progress">
                        <div 
                          className="progress-bar"
                          style={{ width: `${getLevelProgress(user.points, user.level)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="streak-cell">
                    <span className="streak-emoji">{getStreakEmoji(user.streak || 0)}</span>
                    <span className="streak-count">{user.streak || 0} days</span>
                  </div>
                  <div className="badges-cell">
                    <div className="badges-container">
                      {user.badges && user.badges.length > 0 ? (
                        user.badges.slice(0, 3).map((badge, badgeIndex) => (
                          <span key={badge} className="badge-item" title={badge}>
                            <span className="badge-emoji">
                              {badge.includes('first') ? '🥇' :
                               badge.includes('streak') ? '🔥' :
                               badge.includes('task') ? '✅' :
                               badge.includes('team') ? '👥' :
                               badge.includes('speed') ? '⚡' : '🏅'}
                            </span>
                          </span>
                        ))
                      ) : (
                        <span className="no-badges">No badges</span>
                      )}
                      {user.badges && user.badges.length > 3 && (
                        <span className="more-badges">+{user.badges.length - 3}</span>
                      )}
                    </div>
                  </div>
                  <div className="actions-cell">
                    <button className="view-profile-btn">
                      👤 View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2> {selectedUser.name}</h2>
              <button className="close-btn" onClick={() => setShowUserModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-content">
              <div className="user-stats">
                <div className="stat-card">
                  <span className="stat-icon">⭐</span>
                  <span className="stat-value">{selectedUser.points}</span>
                  <span className="stat-label">Total XP</span>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">📈</span>
                  <span className="stat-value">{selectedUser.level}</span>
                  <span className="stat-label">Level</span>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">✅</span>
                  <span className="stat-value">{selectedUser.completedTasks || 0}</span>
                  <span className="stat-label">Tasks Done</span>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">🔥</span>
                  <span className="stat-value">{selectedUser.streak || 0}</span>
                  <span className="stat-label">Day Streak</span>
                </div>
              </div>
              
              <div className="user-badges">
                <h3> Achievements</h3>
                <div className="badges-grid">
                  {selectedUser.badges && selectedUser.badges.length > 0 ? (
                    selectedUser.badges.map((badge) => (
                      <div key={badge} className="badge-card">
                        <span className="badge-icon">
                          {badge.includes('first') ? '🥇' :
                           badge.includes('streak') ? '🔥' :
                           badge.includes('task') ? '✅' :
                           badge.includes('team') ? '👥' :
                           badge.includes('speed') ? '⚡' : '🏅'}
                        </span>
                        <span className="badge-name">{badge.replace(/-/g, ' ')}</span>
                      </div>
                    ))
                  ) : (
                    <p className="no-achievements">No achievements yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;