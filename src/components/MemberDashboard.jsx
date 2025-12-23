import React, { useContext, useEffect, useState, useMemo, useRef } from 'react';
import api from '../utils/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Filler } from 'chart.js';
import './MemberDashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Filler);

const statusOptions = ['To Do', 'In Progress', 'Done'];
const priorityOptions = ['Low', 'Medium', 'High'];

const statusConfig = {
  'To Do': { color: '#fbbf24', icon: '📋' },
  'In Progress': { color: '#3b82f6', icon: '⚡️' },
  'Done': { color: '#22c55e', icon: '✅' },
};

const priorityConfig = {
  'High': { color: '#ef4444', icon: '🔥' },
  'Medium': { color: '#f59e42', icon: '⚠️' },
  'Low': { color: '#22c55e', icon: '❄️' },
};

const mockRooms = [
  { name: 'general', unread: 2, members: 15, lastMessage: '2 min ago' },
  { name: 'dev-team', unread: 0, members: 8, lastMessage: '1 hour ago' },
  { name: 'product-updates', unread: 5, members: 25, lastMessage: '15 min ago' },
  { name: 'random', unread: 1, members: 12, lastMessage: '30 min ago' },
];

const mockLeaderboard = [
    { name: 'John Doe', points: 2500, avatar: '👨‍💻' },
    { name: 'Jane Smith', points: 2350, avatar: '👩‍🎨' },
    // Current user will be inserted here
    { name: 'Peter Jones', points: 1900, avatar: '👨‍🔬' },
    { name: 'Mary Johnson', points: 1750, avatar: '👩‍💼' },
];

// --- Helper Components ---

const LoadingScreen = () => (
    <div className="dashboard-loading-container">
        <motion.div 
            className="loading-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <p>Loading Your Dashboard...</p>
    </div>
);

const AccessDeniedScreen = () => (
    <motion.div 
        className="dashboard-access-denied"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
    >
        <h2>Access Denied</h2>
        <p>You must be logged in as a member to view this page.</p>
        <Link to="/login" className="dashboard-button">Go to Login</Link>
    </motion.div>
);

const StatCard = ({ icon, label, value, color }) => (
    <motion.div 
        className="dashboard-stat-card" 
        style={{ '--stat-color': color }}
        whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.08)' }}
    >
        <div className="stat-card-icon">{icon}</div>
        <div className="stat-card-info">
            <p className="stat-card-label">{label}</p>
            <p className="stat-card-value">{value}</p>
        </div>
    </motion.div>
);

const TaskItem = ({ task, onStatusChange, isAdmin }) => {
    const { status, title, dueDate, priority } = task;
    const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== 'Done';

    return (
        <motion.div 
            className={`dashboard-task-item ${isOverdue ? 'overdue' : ''}`}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            whileHover={{ scale: 1.03 }}
        >
            <div className="task-item-main">
                <span className="task-item-priority" data-priority={priority}>{priority?.[0]}</span>
                <div className="task-item-details">
                    <p className="task-item-title">{title}</p>
                    <p className="task-item-due-date">
                        Due: {dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date'}
                    </p>
                </div>
            </div>
            <select 
                className="task-item-status-select" 
                value={status} 
                onChange={(e) => onStatusChange(task._id, e.target.value)}
                data-status={status}
                disabled={!isAdmin}
                title={!isAdmin ? 'Only admin can change task status' : ''}
            >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
            </select>
        </motion.div>
    );
};

// --- Main Dashboard Component ---

const MemberDashboard = () => {
    const { user, authLoading } = useContext(AuthContext);
    const [tasks, setTasks] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const hasFetchedRef = useRef(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setLoading(false);
            return;
        }
        
        // Prevent double rendering
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Get user ID (handle both _id and id)
                const userId = user._id || user.id;
                if (!userId) {
                    setError('User ID not found');
                    setLoading(false);
                    return;
                }
                
                // Fetch tasks and leaderboard data in parallel
                const [tasksRes, leaderboardRes] = await Promise.all([
                    api.get(`/tasks?assignedTo=${userId}`),
                    api.get('/auth/leaderboard')
                ]);

                setTasks(tasksRes.data || []);
                setLeaderboard((leaderboardRes.data || []).slice(0, 5)); // Get top 5 for the widget

            } catch (err) {
                setError('Could not load dashboard data. Please try again.');
                console.error("Dashboard fetch error:", err);
                // Set empty arrays on error to prevent crashes
                setTasks([]);
                setLeaderboard([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        
        return () => {
            hasFetchedRef.current = false;
        };
    }, [user, authLoading]);

    const stats = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'Done').length;
        const inProgress = tasks.filter(t => t.status === 'In Progress').length;
        const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done').length;
        return { total, completed, inProgress, overdue };
    }, [tasks]);

    const handleStatusChange = async (taskId, newStatus) => {
        // Only admin can change task status
        if (!user || user.role !== 'admin') {
            alert('Only admin can change task status');
            return;
        }

        const originalTasks = [...tasks];
        setTasks(prevTasks => 
            prevTasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t)
        );

        try {
            await api.put(`/tasks/${taskId}`, { status: newStatus });
        } catch (err) {
            console.error("Failed to update status:", err);
            setTasks(originalTasks);
            alert(err.response?.data?.error || "Failed to update task status. Please try again.");
        }
    };
    
    // Show the main loading screen ONLY while the auth context is loading.
    if (authLoading || loading) {
        return <LoadingScreen />;
    }

    if (!user || user.role !== 'member') {
        return <AccessDeniedScreen />;
    }

    return (
        <motion.div 
            className="dashboard-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <header className="dashboard-header">
                <div>
                    <h1>Welcome, {user.name.split(' ')[0]}</h1>
                    <p>Here's a snapshot of your workspace. Keep up the great work!</p>
                </div>
                <div className="dashboard-header-actions">
                     <Link to="/tasks" className="dashboard-button">View All Tasks</Link>
                     <Link to="/profile" className="profile-link">
                        <div className="profile-avatar">{user.name[0].toUpperCase()}</div>
                    </Link>
                </div>
            </header>

            {error && <div className="dashboard-error-banner">{error}</div>}

            <section className="dashboard-stats-grid">
                <StatCard icon="🎯" label="Total Tasks" value={stats.total} color="#3b82f6" />
                <StatCard icon="✅" label="Completed" value={stats.completed} color="#22c55e" />
                <StatCard icon="⏳" label="In Progress" value={stats.inProgress} color="#f59e0b" />
                <StatCard icon="🚨" label="Overdue" value={stats.overdue} color="#ef4444" />
            </section>

            <main className="dashboard-main-content">
                <div className="dashboard-tasks-container">
                    <h2 className="container-title">Your Active Tasks</h2>
                    <div className="dashboard-task-list">
                        <AnimatePresence>
                            {tasks.length > 0 ? (
                                tasks
                                    .filter(t => t.status !== 'Done')
                                    .map(task => (
                                        <TaskItem 
                                            key={task._id || task.id} 
                                            task={task} 
                                            onStatusChange={handleStatusChange} 
                                            isAdmin={user?.role === 'admin'} 
                                        />
                                    ))
                            ) : (
                                <motion.div className="no-tasks-message" initial={{opacity:0}} animate={{opacity:1}}>
                                    <span role="img" aria-label="Party popper">🎉</span>
                                    <p>{tasks.length === 0 ? 'No tasks assigned yet.' : 'All tasks completed! Great job.'}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <aside className="dashboard-sidebar">
                    <div className="dashboard-widget">
                        <h2 className="container-title">🏆 Leaderboard</h2>
                        <div className="leaderboard-widget-list">
                            {leaderboard.length > 0 ? (
                                leaderboard.map((player, i) => (
                                    <div key={player._id || player.id || i} className="leaderboard-player-item">
                                        <span className="player-rank">#{i+1}</span>
                                        <span className="player-name">{player.name || 'Unknown'}</span>
                                        <span className="player-points">{player.points || 0} XP</span>
                                    </div>
                                ))
                            ) : (
                                <div className="no-leaderboard-message">
                                    <p>No leaderboard data available</p>
                                </div>
                            )}
                        </div>
                        <Link to="/leaderboard" className="dashboard-button full-width secondary">View Full Leaderboard</Link>
                    </div>
                    
                    <div className="dashboard-widget">
                        <h2 className="container-title">Quick Actions</h2>
                        <Link to="/analytics" className="dashboard-button full-width secondary">View My Analytics</Link>
                    </div>
                </aside>
            </main>
        </motion.div>
    );
};

export default MemberDashboard;