import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from '../utils/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Pie, Bar, Line, Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { motion, AnimatePresence } from 'framer-motion';
import './TaskAnalytics.css';

ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title,
  PointElement,
  LineElement,
  Filler,
  ChartDataLabels
);

const TaskAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [isRealTime, setIsRealTime] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);
  const [hoveredChart, setHoveredChart] = useState(null);
  const [showInsights, setShowInsights] = useState(false);
  const { user } = useContext(AuthContext);
  const intervalRef = useRef(null);

  // Real-time data simulation
  const [realTimeData, setRealTimeData] = useState({
    tasksCreated: 0,
    tasksCompleted: 0,
    activeUsers: 0
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get('/tasks/analytics');
        setAnalytics(res.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch task analytics.');
        setLoading(false);
      }
    };

    if (user && user.role === 'admin') {
      fetchAnalytics();
    } else {
      setError('You are not authorized to view this page.');
      setLoading(false);
    }
  }, [user]);

  // Real-time updates simulation
  useEffect(() => {
    if (isRealTime) {
      intervalRef.current = setInterval(() => {
        setRealTimeData(prev => ({
          tasksCreated: prev.tasksCreated + Math.floor(Math.random() * 3),
          tasksCompleted: prev.tasksCompleted + Math.floor(Math.random() * 2),
          activeUsers: Math.floor(Math.random() * 10) + 15
        }));
      }, 3000);

      return () => clearInterval(intervalRef.current);
    }
  }, [isRealTime]);

  // Auto-refresh animation
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      setAnimationKey(prev => prev + 1);
    }, 10000);
    return () => clearInterval(refreshInterval);
  }, []);

  if (loading) return (
    <motion.div 
      className="loading-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="loading-spinner"></div>
      <motion.p
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Loading analytics...
      </motion.p>
    </motion.div>
  );
  
  if (error) return (
    <motion.div 
      className="error-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <p className="error">{error}</p>
    </motion.div>
  );
  
  if (!analytics) return (
    <div className="no-data-container">
      <p>No analytics data available.</p>
    </div>
  );

  const { totalTasks, tasksByStatus, overdueTasks } = analytics;
  
  const statusCounts = tasksByStatus.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});

  const allStatuses = ['To Do', 'In Progress', 'Done'];
  const pieData = allStatuses.map(status => statusCounts[status] || 0);

  // Enhanced Pie Chart Data with Data Labels
  const pieChartData = {
    labels: allStatuses,
    datasets: [
      {
        label: 'Tasks by Status',
        data: pieData,
        backgroundColor: [
          'rgba(255, 159, 64, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(75, 192, 192, 0.8)',
        ],
        borderColor: [
          'rgba(255, 159, 64, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  // Enhanced Bar Chart Data
  const barChartData = {
    labels: ['Total Tasks', 'Completed', 'In Progress', 'To Do', 'Overdue'],
    datasets: [
      {
        label: 'Task Counts',
        data: [
          totalTasks, 
          statusCounts['Done'] || 0, 
          statusCounts['In Progress'] || 0, 
          statusCounts['To Do'] || 0, 
          overdueTasks
        ],
        backgroundColor: [
          'rgba(153, 102, 255, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(255, 99, 132, 0.8)',
        ],
        borderColor: [
          'rgba(153, 102, 255, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      }
    ]
  };

  // Doughnut Chart for Completion Rate
  const completionRate = totalTasks > 0 ? ((statusCounts['Done'] || 0) / totalTasks * 100).toFixed(1) : 0;
  const doughnutData = {
    labels: ['Completed', 'Remaining'],
    datasets: [
      {
        data: [statusCounts['Done'] || 0, totalTasks - (statusCounts['Done'] || 0)],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(201, 203, 207, 0.8)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(201, 203, 207, 1)',
        ],
        borderWidth: 2,
      }
    ]
  };

  // Mock Line Chart Data for Task Trends
  const lineChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Tasks Created',
        data: [12, 19, 15, 25, 22, 18, 24],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Tasks Completed',
        data: [8, 15, 12, 20, 18, 14, 19],
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.4,
      }
    ]
  };

  // Enhanced Chart Options with Data Labels
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || context.raw;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold',
          size: 12
        },
        formatter: function(value) {
          return value;
        },
        anchor: 'center',
        align: 'center',
        offset: 0
      }
    },
  };

  const barOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        display: true,
        text: 'Task Overview',
        font: { size: 16, weight: 'bold' }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.parsed.y} tasks`;
          }
        }
      },
      datalabels: {
        color: '#333',
        font: {
          weight: 'bold',
          size: 14
        },
        formatter: function(value) {
          return value;
        },
        anchor: 'end',
        align: 'top',
        offset: 4
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          callback: function(value) {
            return value;
          }
        }
      }
    }
  };

  const lineOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        display: true,
        text: 'Weekly Task Trends',
        font: { size: 16, weight: 'bold' }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} tasks`;
          }
        }
      },
      datalabels: {
        color: '#333',
        font: {
          weight: 'bold',
          size: 12
        },
        formatter: function(value) {
          return value;
        },
        anchor: 'end',
        align: 'top',
        offset: 4
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 5,
          callback: function(value) {
            return value;
          }
        }
      }
    }
  };

  const pieOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} tasks (${percentage}%)`;
          }
        }
      },
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold',
          size: 14
        },
        formatter: function(value, context) {
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
          return `${value}\n(${percentage}%)`;
        },
        anchor: 'center',
        align: 'center',
        offset: 0
      }
    }
  };

  const metricVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { 
      scale: 1.05, 
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: { duration: 0.3 }
    }
  };

  const chartVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
    hover: { scale: 1.02, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
      className="task-analytics-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Interactive Header */}
      <motion.div 
        className="analytics-header"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-content">
          <motion.h1
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            📊 Interactive Analytics Dashboard
          </motion.h1>
          <div className="header-controls">
            <div className="time-range-selector">
              <label>Time Range: </label>
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="interactive-select"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>
            <motion.button
              className={`realtime-toggle ${isRealTime ? 'active' : ''}`}
              onClick={() => setIsRealTime(!isRealTime)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isRealTime ? '⚪ Offline' : '⚫ Live'}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Real-time Stats Bar */}
      <AnimatePresence>
        {isRealTime && (
          <motion.div 
            className="realtime-stats"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="realtime-item">
              <span className="realtime-label">Tasks Created Today:</span>
              <motion.span 
                className="realtime-value"
                key={realTimeData.tasksCreated}
                initial={{ scale: 1.2, color: '#10B981' }}
                animate={{ scale: 1, color: '#333' }}
                transition={{ duration: 0.5 }}
              >
                {realTimeData.tasksCreated}
              </motion.span>
            </div>
            <div className="realtime-item">
              <span className="realtime-label">Tasks Completed Today:</span>
              <motion.span 
                className="realtime-value"
                key={realTimeData.tasksCompleted}
                initial={{ scale: 1.2, color: '#10B981' }}
                animate={{ scale: 1, color: '#333' }}
                transition={{ duration: 0.5 }}
              >
                {realTimeData.tasksCompleted}
              </motion.span>
            </div>
            <div className="realtime-item">
              <span className="realtime-label">Active Users:</span>
              <motion.span 
                className="realtime-value"
                key={realTimeData.activeUsers}
                initial={{ scale: 1.2, color: '#3B82F6' }}
                animate={{ scale: 1, color: '#333' }}
                transition={{ duration: 0.5 }}
              >
                {realTimeData.activeUsers}
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Metrics Cards */}
      <div className="metrics-grid">
        {[
          { 
            type: 'primary', 
            icon: '📊', 
            title: 'Total Tasks', 
            value: totalTasks, 
            change: '+12%', 
            color: '#667eea' 
          },
          { 
            type: 'success', 
            icon: '✅', 
            title: 'Completed', 
            value: statusCounts['Done'] || 0, 
            change: '+8%', 
            color: '#10B981' 
          },
          { 
            type: 'warning', 
            icon: '⏳', 
            title: 'In Progress', 
            value: statusCounts['In Progress'] || 0, 
            change: '+5%', 
            color: '#F59E0B' 
          },
          { 
            type: 'danger', 
            icon: '⚠️', 
            title: 'Overdue', 
            value: overdueTasks, 
            change: '-3%', 
            color: '#EF4444' 
          }
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            className={`metric-card ${metric.type}`}
            variants={metricVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedMetric(metric)}
            style={{ cursor: 'pointer' }}
          >
            <motion.div 
              className="metric-icon"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
            >
              {metric.icon}
            </motion.div>
            <div className="metric-content">
              <h3>{metric.title}</h3>
              <motion.p 
                className="metric-value"
                key={metric.value}
                initial={{ scale: 1.2, color: metric.color }}
                animate={{ scale: 1, color: '#2c3e50' }}
                transition={{ duration: 0.5 }}
              >
                {metric.value}
              </motion.p>
              <p className="metric-change">{metric.change} from last week</p>
            </div>
            <motion.div 
              className="metric-sparkle"
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                delay: index * 0.3 
              }}
            >
              ✨
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Interactive Charts Section */}
      <div className="charts-section">
        <div className="chart-row">
          <motion.div 
            className="chart-card large"
            variants={chartVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            onHoverStart={() => setHoveredChart('pie')}
            onHoverEnd={() => setHoveredChart(null)}
          >
            <motion.h3
              animate={hoveredChart === 'pie' ? { scale: 1.1 } : { scale: 1 }}
            >
              🥧 Task Status Distribution
            </motion.h3>
            <div className="chart-container">
              <Pie data={pieChartData} options={pieOptions} />
            </div>
            <motion.div 
              className="chart-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: hoveredChart === 'pie' ? 1 : 0 }}
            >
              <span>Click to explore data</span>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="chart-card large"
            variants={chartVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            onHoverStart={() => setHoveredChart('doughnut')}
            onHoverEnd={() => setHoveredChart(null)}
          >
            <motion.h3
              animate={hoveredChart === 'doughnut' ? { scale: 1.1 } : { scale: 1 }}
            >
              🍩 Completion Rate
            </motion.h3>
            <div className="chart-container">
              <Doughnut data={doughnutData} options={pieOptions} />
            </div>
            <motion.div 
              className="completion-rate"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <span className="rate-value">{completionRate}%</span>
              <span className="rate-label">Completion Rate</span>
            </motion.div>
          </motion.div>
        </div>

        <motion.div 
          className="chart-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div 
            className="chart-card full-width"
            variants={chartVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            onHoverStart={() => setHoveredChart('bar')}
            onHoverEnd={() => setHoveredChart(null)}
          >
            <motion.h3
              animate={hoveredChart === 'bar' ? { scale: 1.1 } : { scale: 1 }}
            >
              📊 Task Overview
            </motion.h3>
            <div className="chart-container">
              <Bar data={barChartData} options={barOptions} />
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          className="chart-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div 
            className="chart-card full-width"
            variants={chartVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            onHoverStart={() => setHoveredChart('line')}
            onHoverEnd={() => setHoveredChart(null)}
          >
            <motion.h3
              animate={hoveredChart === 'line' ? { scale: 1.1 } : { scale: 1 }}
            >
              📅 Weekly Task Trends
            </motion.h3>
            <div className="chart-container">
              <Line data={lineChartData} options={lineOptions} />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Interactive Insights Section */}
      <motion.div 
        className="insights-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div className="insights-header">
          <motion.h3
            onClick={() => setShowInsights(!showInsights)}
            style={{ cursor: 'pointer' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🧠 AI-Powered Insights {showInsights ? '🔼' : '🔽'}
          </motion.h3>
        </motion.div>
        
        <AnimatePresence>
          {showInsights && (
            <motion.div 
              className="insights-grid"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {[
                {
                  icon: '📈',
                  title: 'Performance',
                  content: `Task completion rate is ${completionRate}%, which is above the target of 80%.`,
                  color: '#10B981'
                },
                {
                  icon: '⏰',
                  title: 'Efficiency',
                  content: 'Average task completion time is 3.2 days, down from 4.1 days last week.',
                  color: '#3B82F6'
                },
                {
                  icon: '🎯',
                  title: 'Focus Areas',
                  content: `${overdueTasks} tasks need immediate attention to prevent delays.`,
                  color: '#F59E0B'
                },
                {
                  icon: '🚀',
                  title: 'Momentum',
                  content: 'Team productivity has increased by 15% compared to the previous period.',
                  color: '#8B5CF6'
                }
              ].map((insight, index) => (
                <motion.div
                  key={insight.title}
                  className="insight-card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
                  }}
                  style={{ 
                    background: `linear-gradient(135deg, ${insight.color}20 0%, ${insight.color}40 100%)`,
                    border: `2px solid ${insight.color}`
                  }}
                >
                  <motion.h4
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                  >
                    {insight.icon} {insight.title}
                  </motion.h4>
                  <p>{insight.content}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floating Action Button */}
      <motion.button
        className="fab"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => window.location.reload()}
        animate={{ 
          y: [0, -10, 0],
          rotate: [0, 360]
        }}
        transition={{ 
          y: { duration: 2, repeat: Infinity },
          rotate: { duration: 10, repeat: Infinity }
        }}
      >
        🔄
      </motion.button>

      {/* Selected Metric Modal */}
      <AnimatePresence>
        {selectedMetric && (
          <motion.div 
            className="metric-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMetric(null)}
          >
            <motion.div 
              className="metric-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>{selectedMetric.title}</h2>
              <div className="modal-content">
                <p>Detailed analysis for {selectedMetric.title.toLowerCase()}</p>
                <p>Current value: {selectedMetric.value}</p>
                <p>Trend: {selectedMetric.change}</p>
              </div>
              <button onClick={() => setSelectedMetric(null)}>Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TaskAnalytics;