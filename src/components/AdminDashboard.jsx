import React, { useEffect, useState, useContext, useRef } from 'react';
import api from '../utils/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  HiUsers, HiClipboardList, HiCheckCircle, HiClock,
  HiChartBar, HiRefresh, HiCog, HiDocumentText,
  HiLightningBolt, HiShieldCheck, HiServer, HiTrendingUp,
  HiExclamationCircle, HiCheck, HiX
} from 'react-icons/hi';
import {
  FiUsers, FiClipboard, FiCheckCircle, FiClock,
  FiBarChart2, FiRefreshCw, FiSettings, FiFileText,
  FiZap, FiShield, FiServer, FiTrendingUp,
  FiAlertCircle
} from 'react-icons/fi';
import './AdminDashboard.css';

const ROLES = ['admin', 'member', 'viewer'];

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [realTimeStats, setRealTimeStats] = useState({
    onlineUsers: 0,
    activeTasks: 0,
    systemHealth: 100
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  
  const intervalRef = useRef(null);
  const hasInitialized = useRef(false);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0
  });

  useEffect(() => {
    // Prevent double rendering
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    fetchUsers();
    fetchStats();
    fetchRealTimeStats();
    fetchRecentActivities();
    startRealTimeUpdates();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      hasInitialized.current = false;
    };
  }, []);

  const fetchRealTimeStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setRealTimeStats({
        onlineUsers: res.data.onlineUsers || 0,
        activeTasks: res.data.activeTasks || 0,
        systemHealth: res.data.systemHealth || 100
      });
    } catch (error) {
      console.error('Error fetching real-time stats:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const res = await api.get('/admin/activities?limit=5');
      setRecentActivities(res.data || []);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const startRealTimeUpdates = () => {
    intervalRef.current = setInterval(() => {
      fetchRealTimeStats();
      fetchRecentActivities();
    }, 5000); // Update every 5 seconds
  };

  const fetchStats = async () => {
    try {
      const [usersRes, tasksRes] = await Promise.all([
        api.get('/auth/users'),
        api.get('/tasks')
      ]);
      
      const totalTasks = tasksRes.data.length;
      const completedTasks = tasksRes.data.filter(task => task.status === 'Done').length;
      
      setStats({
        totalUsers: usersRes.data.length,
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await api.put(`/auth/user/${id}/role`, { role: newRole });
      fetchUsers();
      addSystemAlert('success', `User role updated successfully`);
    } catch (err) {
      addSystemAlert('error', 'Failed to update role');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/auth/user/${id}`);
      fetchUsers();
      addSystemAlert('success', 'User deleted successfully');
    } catch (err) {
      addSystemAlert('error', 'Failed to delete user');
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteLink('');
    try {
      const res = await api.post('/auth/invite', { email: inviteEmail, role: inviteRole });
      setInviteLink(res.data.inviteLink);
      setInviteEmail('');
      setShowInviteModal(false);
      addSystemAlert('success', 'Invitation sent successfully');
    } catch (err) {
      addSystemAlert('error', 'Failed to send invite');
    } finally {
      setInviteLoading(false);
    }
  };

  const addSystemAlert = (type, message) => {
    const alert = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date()
    };
    setSystemAlerts(prev => [alert, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setSystemAlerts(prev => prev.filter(a => a.id !== alert.id));
    }, 5000);
  };

  const quickActions = [
    {
      title: 'Manage Tasks',
      description: 'Create, edit, and assign tasks to team members',
      icon: HiClipboardList,
      iconOutline: FiClipboard,
      link: '/tasks',
      color: 'primary',
      gradient: 'linear-gradient(135deg, #667eea, #764ba2)'
    },
    {
      title: 'View Analytics',
      description: 'Monitor team performance and task metrics',
      icon: HiChartBar,
      iconOutline: FiBarChart2,
      link: '/analytics',
      color: 'success',
      gradient: 'linear-gradient(135deg, #10B981, #059669)'
    },
    {
      title: 'Workflow Management',
      description: 'Configure and manage automated workflows',
      icon: HiRefresh,
      iconOutline: FiRefreshCw,
      link: '/admin/workflows',
      color: 'warning',
      gradient: 'linear-gradient(135deg, #F59E0B, #D97706)'
    },
    {
      title: 'User Management',
      description: 'Manage team members and their permissions',
      icon: HiUsers,
      iconOutline: FiUsers,
      link: '/admin/users',
      color: 'info',
      gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)'
    },
    {
      title: 'System Settings',
      description: 'Configure system preferences and security',
      icon: HiCog,
      iconOutline: FiSettings,
      link: '/admin/settings',
      color: 'secondary',
      gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)'
    },
    {
      title: 'Activity Logs',
      description: 'View detailed system activity and audit trails',
      icon: HiDocumentText,
      iconOutline: FiFileText,
      link: '/admin/logs',
      color: 'dark',
      gradient: 'linear-gradient(135deg, #6B7280, #4B5563)'
    }
  ];

  if (!user || user.role !== 'admin') {
    return (
      <motion.div 
        className="admin-dashboard access-denied"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h2>🚫 Access Denied</h2>
        <p>You don't have permission to access this page.</p>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <motion.div 
        className="dashboard-loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="loading-content">
          <motion.div 
            className="spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          ></motion.div>
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading admin dashboard...
          </motion.p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="admin-dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* System Alerts */}
      <AnimatePresence>
        {systemAlerts.map((alert) => (
          <motion.div
            key={alert.id}
            className={`system-alert ${alert.type}`}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
          >
            <span className="alert-icon">
              {alert.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="alert-message">{alert.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Interactive Header */}
      <motion.div 
        className="dashboard-header"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="header-content">
          <div className="welcome-section">
            <motion.h1
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              👋 Welcome back, {user.name}!
            </motion.h1>
            <p>Here's what's happening with your team today</p>
          </div>
          <div className="header-actions">
            <motion.span 
              className="admin-badge"
              animate={{ 
                background: ['linear-gradient(135deg, #667eea, #764ba2)', 'linear-gradient(135deg, #764ba2, #667eea)'],
                boxShadow: ['0 4px 12px rgba(102, 126, 234, 0.3)', '0 8px 20px rgba(102, 126, 234, 0.4)']
              }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            >
              👑 Administrator
            </motion.span>
            <motion.button
              className="invite-btn"
              onClick={() => setShowInviteModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ➕ Invite User
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Real-time Stats Bar */}
      <motion.div 
        className="realtime-stats-bar"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="realtime-item">
          <span className="realtime-label">Online Users:</span>
          <motion.span 
            className="realtime-value"
            key={realTimeStats.onlineUsers}
            initial={{ scale: 1.2, color: '#10B981' }}
            animate={{ scale: 1, color: '#333' }}
            transition={{ duration: 0.5 }}
          >
            {realTimeStats.onlineUsers}
          </motion.span>
        </div>
        <div className="realtime-item">
          <span className="realtime-label">Active Tasks:</span>
          <motion.span 
            className="realtime-value"
            key={realTimeStats.activeTasks}
            initial={{ scale: 1.2, color: '#3B82F6' }}
            animate={{ scale: 1, color: '#333' }}
            transition={{ duration: 0.5 }}
          >
            {realTimeStats.activeTasks}
          </motion.span>
        </div>
        <div className="realtime-item">
          <span className="realtime-label">System Health:</span>
          <motion.span 
            className="realtime-value"
            key={Math.round(realTimeStats.systemHealth)}
            initial={{ scale: 1.2, color: '#10B981' }}
            animate={{ scale: 1, color: '#333' }}
            transition={{ duration: 0.5 }}
          >
            {Math.round(realTimeStats.systemHealth)}%
          </motion.span>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div 
        className="dashboard-tabs"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {['overview', 'users', 'analytics', 'settings'].map((tab) => (
          <motion.button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </motion.button>
        ))}
      </motion.div>

      {/* Overview Tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Stats Overview */}
            <div className="stats-section">
              <motion.h2 
                className="section-title"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <HiChartBar className="section-title-icon" />
                <span>Overview</span>
              </motion.h2>
              <div className="stats-grid">
                {[
                  { icon: HiUsers, iconOutline: FiUsers, title: 'Total Users', value: stats.totalUsers, desc: 'Active team members', color: '#667eea' },
                  { icon: HiClipboardList, iconOutline: FiClipboard, title: 'Total Tasks', value: stats.totalTasks, desc: 'All active tasks', color: '#10B981' },
                  { icon: HiCheckCircle, iconOutline: FiCheckCircle, title: 'Completed', value: stats.completedTasks, desc: 'Successfully finished', color: '#F59E0B' },
                  { icon: HiClock, iconOutline: FiClock, title: 'Pending', value: stats.pendingTasks, desc: 'Awaiting completion', color: '#EF4444' }
                ].map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <motion.div
                      key={stat.title}
                      className="stat-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                    >
                      <motion.div 
                        className="stat-icon"
                        animate={{ 
                          rotate: [0, 10, -10, 0],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
                        style={{ background: stat.color }}
                      >
                        <IconComponent className="stat-icon-svg" />
                      </motion.div>
                      <div className="stat-content">
                        <h3>{stat.title}</h3>
                        <motion.div 
                          className="stat-value"
                          key={stat.value}
                          initial={{ scale: 1.2, color: stat.color }}
                          animate={{ scale: 1, color: '#2c3e50' }}
                          transition={{ duration: 0.5 }}
                        >
                          {stat.value}
                        </motion.div>
                        <p className="stat-description">{stat.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="actions-section">
              <motion.h2 
                className="section-title section-title-light"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <HiLightningBolt className="section-title-icon" />
                <span>Quick Actions</span>
              </motion.h2>
              <div className="actions-grid">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <Link to={action.link} className={`action-card ${action.color}`}>
                      <motion.div 
                        className="action-icon"
                        animate={{ 
                          rotate: [0, 5, -5, 0],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                      >
                        {(() => {
                          const ActionIcon = action.icon;
                          return <ActionIcon className="action-icon-svg" />;
                        })()}
                      </motion.div>
                      <div className="action-content">
                        <h3>{action.title}</h3>
                        <p>{action.description}</p>
                      </div>
                      <motion.div 
                        className="action-arrow"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="activity-section">
              <motion.h2 
                className="section-title"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                🔥 Recent Activity
              </motion.h2>
              <div className="activity-card">
                {recentActivities.map((activity, index) => (
                  <motion.div
                    key={index}
                    className="activity-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + index * 0.1 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                  >
                    <motion.div 
                      className="activity-icon"
                      animate={{ 
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                    >
                      {activity.icon}
                    </motion.div>
                    <div className="activity-content">
                      <p><strong>{activity.user}</strong> {activity.action}</p>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="users-section">
              <motion.h2 
                className="section-title section-title-light"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <HiUsers className="section-title-icon" />
                <span>User Management</span>
              </motion.h2>
              
              {loading ? (
                <div className="loading-users">Loading users...</div>
              ) : error ? (
                <div className="error">{error}</div>
              ) : (
                <div className="users-list-container">
                  <div className="users-list-header">
                    <div className="list-header-cell">User</div>
                    <div className="list-header-cell">Email</div>
                    <div className="list-header-cell">Role</div>
                    <div className="list-header-cell">Actions</div>
                  </div>
                  <div className="users-list">
                    {users.map((u, index) => (
                      <motion.div
                        key={u._id}
                        className="user-list-item"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        whileHover={{ backgroundColor: 'rgba(102, 126, 234, 0.05)' }}
                        onClick={() => {
                          setSelectedUser(u);
                          setShowUserModal(true);
                        }}
                      >
                        <div className="list-cell user-cell">
                          <div className="user-avatar">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="user-name">{u.name}</span>
                        </div>
                        <div className="list-cell email-cell">
                          <span>{u.email}</span>
                        </div>
                        <div className="list-cell role-cell">
                          <span className={`user-role ${u.role}`}>{u.role}</span>
                        </div>
                        <div className="list-cell actions-cell">
                          <select
                            className="role-select"
                            value={u.role}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleRoleChange(u._id, e.target.value);
                            }}
                            disabled={u._id === user.id || (u.role === 'admin' && u._id !== user.id)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <motion.button
                            className="delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(u._id);
                            }}
                            disabled={u._id === user.id || u.role === 'admin'}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            🗑️
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="analytics-section">
              <motion.h2 
                className="section-title section-title-light"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <HiChartBar className="section-title-icon" />
                <span>Analytics Overview</span>
              </motion.h2>
              <div className="analytics-grid">
                <motion.div 
                  className="analytics-card"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3>Team Performance</h3>
                  <div className="performance-metrics">
                    <div className="metric">
                      <span>Task Completion Rate</span>
                      <motion.div 
                        className="progress-bar"
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.completedTasks / stats.totalTasks) * 100}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      ></motion.div>
                      <span>{stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="settings-section">
              <motion.h2 
                className="section-title"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                ⚙️ System Settings
              </motion.h2>
              <div className="settings-grid">
                <motion.div 
                  className="setting-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3>System Health</h3>
                  <div className="health-indicator">
                    <motion.div 
                      className="health-bar"
                      initial={{ width: 0 }}
                      animate={{ width: `${realTimeStats.systemHealth}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    ></motion.div>
                    <span>{Math.round(realTimeStats.systemHealth)}%</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite User Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Invite New User</h3>
              <form className="invite-form" onSubmit={handleInvite}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  required
                />
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <motion.button 
                  type="submit" 
                  disabled={inviteLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {inviteLoading ? 'Inviting...' : 'Send Invite'}
                </motion.button>
              </form>
              {inviteLink && (
                <div className="invite-link">
                  <p>Invite Link:</p>
                  <a href={inviteLink} target="_blank" rel="noopener noreferrer">{inviteLink}</a>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Details Modal */}
      <AnimatePresence>
        {showUserModal && selectedUser && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUserModal(false)}
          >
            <motion.div 
              className="modal-content user-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>User Details</h3>
              <div className="user-details">
                <div className="user-avatar-large">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <h4>{selectedUser.name}</h4>
                <p>{selectedUser.email}</p>
                <span className={`user-role ${selectedUser.role}`}>{selectedUser.role}</span>
              </div>
              <div className="user-actions-modal">
                <select
                  value={selectedUser.role}
                  onChange={(e) => handleRoleChange(selectedUser._id, e.target.value)}
                  disabled={selectedUser._id === user.id || (selectedUser.role === 'admin' && selectedUser._id !== user.id)}
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <motion.button
                  className="delete-btn"
                  onClick={() => {
                    handleDelete(selectedUser._id);
                    setShowUserModal(false);
                  }}
                  disabled={selectedUser._id === user.id || selectedUser.role === 'admin'}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  Delete User
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminDashboard; 