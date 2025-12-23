import React, { useContext, useEffect, useState, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axiosConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import './ViewerDashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// --- Helper Components ---

const LoadingScreen = () => (
    <div className="viewer-loading-container">
        <motion.div 
            className="loading-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <p>Loading Project Dashboard...</p>
    </div>
);

const AccessDeniedScreen = () => (
    <motion.div 
        className="viewer-access-denied"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
    >
        <h2>Access Denied</h2>
        <p>You must be logged in as a viewer to see this page.</p>
        <Link to="/login" className="viewer-button">Go to Login</Link>
    </motion.div>
);

const StatCard = ({ icon, label, value, color }) => (
    <motion.div 
        className="viewer-stat-card" 
        style={{ '--stat-color': color }}
        whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.08)' }}
    >
        <div className="stat-icon">{icon}</div>
        <div className="stat-info">
            <p className="stat-label">{label}</p>
            <p className="stat-value">{value}</p>
        </div>
    </motion.div>
);

const TaskCard = ({ task }) => {
    const { title, status, assignedTo, dueDate } = task;
    return (
        <motion.div 
            className="viewer-task-card"
            whileHover={{ scale: 1.05, zIndex: 2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
            <p className="task-title">{title}</p>
            <div className="task-details">
                <span className="task-status-badge" data-status={status}>{status}</span>
                <span className="task-assignee">
                    Assigned to: <strong>{assignedTo?.name || 'Unassigned'}</strong>
                </span>
            </div>
        </motion.div>
    );
};

// --- Main Dashboard Component ---

const ViewerDashboard = () => {
    const { user, authLoading } = useContext(AuthContext);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!authLoading && user) {
            const fetchAllTasks = async () => {
                try {
                    setError(null);
                    setLoading(true);
                    const res = await api.get('/tasks');
                    setTasks(res.data);
                } catch (err) {
                    setError('Could not fetch project tasks.');
                    console.error("Fetch tasks error:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchAllTasks();
        } else if (!authLoading && !user) {
            setLoading(false);
        }
    }, [user, authLoading]);
    
    const projectStats = useMemo(() => {
        const total = tasks.length;
        const statusCounts = { 'To Do': 0, 'In Progress': 0, 'Done': 0 };
        tasks.forEach(t => {
            if (statusCounts[t.status] !== undefined) {
                statusCounts[t.status]++;
            }
        });
        const completion = total > 0 ? Math.round((statusCounts['Done'] / total) * 100) : 0;
        return { total, ...statusCounts, completion };
    }, [tasks]);

    const chartData = {
        labels: ['To Do', 'In Progress', 'Done'],
        datasets: [{
            label: 'Task Status',
            data: [projectStats['To Do'], projectStats['In Progress'], projectStats['Done']],
            backgroundColor: ['#f59e0b', '#3b82f6', '#22c55e'],
            borderColor: '#ffffff',
            borderWidth: 2,
        }],
    };

    if (authLoading || loading) {
        return <LoadingScreen />;
    }

    if (!user || user.role !== 'viewer') {
        return <AccessDeniedScreen />;
    }

    return (
        <motion.div 
            className="viewer-dashboard-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <header className="viewer-header">
                <div>
                    <h1>Project Overview</h1>
                    <p className="viewer-subtitle">
                        👁️ You are viewing this dashboard in read-only mode.
                    </p>
                </div>
                <div className="viewer-header-actions">
                     <Link to="/profile" className="viewer-profile-link">
                        <div className="viewer-profile-avatar">{user.name[0].toUpperCase()}</div>
                        <span>My Profile</span>
                    </Link>
                </div>
            </header>

            {error && <div className="viewer-error-banner">{error}</div>}

            <section className="viewer-stats-grid">
                <StatCard icon="📊" label="Total Tasks" value={projectStats.total} color="#8b5cf6" />
                <StatCard icon="📝" label="To Do" value={projectStats['To Do']} color="#f59e0b" />
                <StatCard icon="⏳" label="In Progress" value={projectStats['In Progress']} color="#3b82f6" />
                <StatCard icon="✅" label="Completed" value={projectStats['Done']} color="#22c55e" />
            </section>

            <main className="viewer-main-content">
                <div className="viewer-tasks-widget">
                    <h2 className="widget-title">Task Board</h2>
                    <div className="viewer-task-columns">
                        {['To Do', 'In Progress', 'Done'].map(status => (
                            <div key={status} className="viewer-task-column">
                                <h3 className="column-title" data-status={status}>{status}</h3>
                                <div className="column-task-list">
                                    <AnimatePresence>
                                        {tasks.filter(t => t.status === status).map(task => (
                                            <TaskCard key={task._id} task={task} />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <aside className="viewer-sidebar">
                    <div className="viewer-chart-widget">
                        <h2 className="widget-title">Task Distribution</h2>
                        <div className="chart-container">
                            <Doughnut 
                                data={chartData} 
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { position: 'bottom' } }
                                }} 
                            />
                        </div>
                    </div>
                     <div className="viewer-chart-widget">
                        <h2 className="widget-title">Project Completion</h2>
                        <div className="completion-container">
                            <div className="completion-circle">
                                <svg width="120" height="120" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                                    <motion.circle 
                                        cx="60" cy="60" r="54" fill="none" stroke="#22c55e" strokeWidth="12"
                                        strokeDasharray="339.292"
                                        strokeDashoffset={339.292 * (1 - projectStats.completion / 100)}
                                        transform="rotate(-90 60 60)"
                                        initial={{ strokeDashoffset: 339.292 }}
                                        animate={{ strokeDashoffset: 339.292 * (1 - projectStats.completion / 100) }}
                                        transition={{ duration: 1.5, ease: 'easeOut' }}
                                    />
                                </svg>
                                <span className="completion-text">{projectStats.completion}%</span>
                            </div>
                            <p>Project is {projectStats.completion}% complete.</p>
                        </div>
                    </div>
                </aside>
            </main>
        </motion.div>
    );
};

export default ViewerDashboard; 