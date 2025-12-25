import React, { useEffect, useState, useContext, useCallback, useRef } from 'react';
import api from '../utils/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import './TaskBoard.css';
import AddTaskModal from './AddTaskModal';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  HiClipboardList, HiLightningBolt, HiCheckCircle, 
  HiPlus, HiSearch, HiFilter, HiCollection, HiMenuAlt3,
  HiUser, HiCalendar, HiExclamationCircle, HiCheck,
  HiX, HiClock, HiTrendingUp
} from 'react-icons/hi';
import {
  FiClipboard, FiZap, FiCheckCircle, FiPlus, FiSearch,
  FiFilter, FiGrid, FiList, FiUser, FiCalendar, FiAlertCircle
} from 'react-icons/fi';

const statusColumns = [
  { key: 'To Do', label: 'To Do', color: '#F59E0B', icon: HiClipboardList, iconOutline: FiClipboard },
  { key: 'In Progress', label: 'In Progress', color: '#3B82F6', icon: HiLightningBolt, iconOutline: FiZap },
  { key: 'Done', label: 'Done', color: '#10B981', icon: HiCheckCircle, iconOutline: FiCheckCircle },
];

const priorityColors = {
  'Low': '#6B7280',
  'Medium': '#F59E0B',
  'High': '#EF4444',
  'Critical': '#DC2626'
};

const TaskBoard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState('');
  const { user } = useContext(AuthContext);
  const [draggingTask, setDraggingTask] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('board'); // 'board' or 'list'
  const [showFilters, setShowFilters] = useState(false);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0
  });
  const [realTimeUpdates, setRealTimeUpdates] = useState([]);
  const [proofFile, setProofFile] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const proofFileInputRef = useRef(null);
  
  const intervalRef = useRef(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // If user is admin, fetch all tasks; otherwise fetch only their assigned tasks
      const userId = user?._id || user?.id;
      const url = user?.role === 'admin' 
        ? '/tasks' 
        : `/tasks?assignedTo=${userId}`;
      
      const res = await api.get(url);
      setTasks(res.data || []);
      updateTaskStats(res.data || []);
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/auth/users?role=member');
      setUsers(res.data);
    } catch {}
  }, []);

  const fetchAllTasks = useCallback(async () => {
    try {
      // Only admins need all tasks for dependencies dropdown
      if (user?.role === 'admin') {
        const res = await api.get('/tasks');
        setAllTasks(res.data || []);
      } else {
        setAllTasks([]);
      }
    } catch {}
  }, [user]);

  const updateTaskStats = (taskList) => {
    const total = taskList.length;
    const completed = taskList.filter(task => task.status === 'Done').length;
    const inProgress = taskList.filter(task => task.status === 'In Progress').length;
    const overdue = taskList.filter(task => {
      if (task.dueDate) {
        return new Date(task.dueDate) < new Date() && task.status !== 'Done';
      }
      return false;
    }).length;

    setTaskStats({ total, completed, inProgress, overdue });
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchUsers();
      fetchAllTasks();
      startRealTimeUpdates();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, fetchTasks, fetchUsers, fetchAllTasks]);

  const startRealTimeUpdates = () => {
    intervalRef.current = setInterval(() => {
      const updates = [
        'Task "Update UI" moved to In Progress',
        'New task "Bug Fix" created',
        'Task "Database Migration" completed',
        'User John assigned to "API Integration"'
      ];
      
      const randomUpdate = updates[Math.floor(Math.random() * updates.length)];
      setRealTimeUpdates(prev => [
        { id: Date.now(), message: randomUpdate, timestamp: new Date() },
        ...prev.slice(0, 2)
      ]);
    }, 8000);
  };

  const handleDragStart = (task) => {
    setDraggingTask(task);
  };

  const handleDragOver = (status) => {
    setDragOver(status);
  };

  const handleDragLeave = () => {
    setDragOver('');
  };

  const handleDrop = async (newStatus) => {
    setDragOver('');
    if (!draggingTask || draggingTask.status === newStatus) return;
    
    // Only admin can change task status
    if (!user || user.role !== 'admin') {
      setError('Only admin can change task status');
      setDraggingTask(null);
      return;
    }
    
    try {
      await api.put(`/tasks/${draggingTask._id}`, { status: newStatus });
      fetchTasks();
      setDraggingTask(null);
      
      // Add real-time update
      setRealTimeUpdates(prev => [
        { 
          id: Date.now(), 
          message: `Task "${draggingTask.title}" moved to ${newStatus}`, 
          timestamp: new Date() 
        },
        ...prev.slice(0, 2)
      ]);
    } catch (err) {
      setError(err.response?.data?.error || 'Status update failed');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!user || user.role !== 'admin') {
      setError('Only admin can delete tasks');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/tasks/${taskId}`);
      setShowTaskModal(false);
      setSelectedTask(null);
      fetchTasks();
      
      // Add real-time update
      setRealTimeUpdates(prev => [
        { 
          id: Date.now(), 
          message: `Task deleted successfully`, 
          timestamp: new Date() 
        },
        ...prev.slice(0, 2)
      ]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const getTasksByStatus = (status) => {
    let filteredTasks = tasks.filter((task) => task.status === status);
    
    if (filterPriority !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.priority === filterPriority);
    }
    
    if (searchTerm) {
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filteredTasks;
  };

  const getFilteredTasks = () => {
    if (filterStatus === 'all') {
      return tasks;
    }
    return getTasksByStatus(filterStatus);
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Overdue', color: '#EF4444' };
    if (diffDays === 0) return { text: 'Due today', color: '#F59E0B' };
    if (diffDays === 1) return { text: 'Due tomorrow', color: '#F59E0B' };
    if (diffDays <= 3) return { text: `Due in ${diffDays} days`, color: '#3B82F6' };
    return { text: `Due in ${diffDays} days`, color: '#6B7280' };
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        type: "spring",
        stiffness: 100
      },
    }),
    exit: { opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } },
    hover: { 
      scale: 1.05, 
      y: -5,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
    },
    drag: { 
      scale: 1.1, 
      rotate: 5,
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
    }
  };

  const columnVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.5
      }
    })
  };

  if (!user) {
    return (
      <motion.div 
        className="task-board loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="loading-spinner"></div>
        <p>Loading user information...</p>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <motion.div 
        className="task-board loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="loading-spinner"></div>
        <p>Loading {user?.role === 'admin' ? 'all tasks' : 'your tasks'}...</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="task-board"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Real-time Updates */}
      <AnimatePresence>
        {realTimeUpdates.map((update) => (
          <motion.div
            key={update.id}
            className="realtime-update"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ duration: 0.5 }}
          >
            <HiTrendingUp className="update-icon" />
            <span className="update-message">{update.message}</span>
            <span className="update-time">{update.timestamp.toLocaleTimeString()}</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Interactive Header */}
      <motion.div 
        className="task-board-header"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="header-content">
          <div className="title-section">
            <motion.div className="title-with-icon">
              <motion.div 
                className="title-icon-wrapper"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {user?.role === 'admin' ? (
                  <HiClipboardList className="title-icon" />
                ) : (
                  <HiClipboardList className="title-icon" />
                )}
              </motion.div>
              <motion.h1 
                className="task-board-title"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {user?.role === 'admin' ? 'Task Board' : 'My Tasks'}
              </motion.h1>
            </motion.div>
            <p>{user?.role === 'admin' ? 'Manage and track your team\'s progress' : 'View and track your assigned tasks'}</p>
          </div>
          
          <div className="header-actions">
            <motion.button
              className="view-mode-btn"
              onClick={() => setViewMode(viewMode === 'board' ? 'list' : 'board')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {viewMode === 'board' ? (
                <>
                  <FiList className="btn-icon" />
                  <span>List View</span>
                </>
              ) : (
                <>
                  <FiGrid className="btn-icon" />
                  <span>Board View</span>
                </>
              )}
            </motion.button>
            
            <motion.button
              className="filter-btn"
              onClick={() => setShowFilters(!showFilters)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <HiFilter className="btn-icon" />
              <span>Filters</span>
            </motion.button>
            
            {user && user.role === 'admin' && (
              <motion.button 
                className="add-task-btn" 
                onClick={() => setShowAddModal(true)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <HiPlus className="btn-icon" />
                <span>Create New Task</span>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Task Statistics */}
      <motion.div 
        className="task-stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {[
          { label: 'Total', value: taskStats.total, icon: HiClipboardList, color: '#667eea' },
          { label: 'In Progress', value: taskStats.inProgress, icon: HiLightningBolt, color: '#3B82F6' },
          { label: 'Completed', value: taskStats.completed, icon: HiCheckCircle, color: '#10B981' },
          { label: 'Overdue', value: taskStats.overdue, icon: HiExclamationCircle, color: '#EF4444' }
        ].map((stat, index) => {
          const IconComponent = stat.icon;
          return (
          <motion.div
            key={stat.label}
            className="stat-card"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <div className="stat-icon" style={{ background: stat.color }}>
              <IconComponent className="stat-icon-svg" />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </motion.div>
          );
        })}
      </motion.div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            className="filters-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="filter-group">
              <div className="search-wrapper">
                <HiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            
            <div className="filter-group">
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                {statusColumns.map(col => (
                  <option key={col.key} value={col.key}>{col.label}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <select 
                value={filterPriority} 
                onChange={(e) => setFilterPriority(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddTaskModal
            users={users}
            tasks={allTasks}
            onClose={() => setShowAddModal(false)}
            onTaskAdded={() => { 
              setShowAddModal(false); 
              fetchTasks(); 
              fetchAllTasks(); 
            }}
          />
        )}
      </AnimatePresence>

      {/* Task Board View */}
      {viewMode === 'board' && (
        <motion.div 
          className="task-columns"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {statusColumns.map((col, index) => (
            <motion.div
              key={col.key}
              className={`task-column${dragOver === col.key ? ' drag-over' : ''} ${user && user.role !== 'admin' ? 'no-drop' : ''}`}
              onDragOver={(e) => { 
                if (user && user.role === 'admin') {
                  e.preventDefault(); 
                  handleDragOver(col.key); 
                }
              }}
              onDrop={() => {
                if (user && user.role === 'admin') {
                  handleDrop(col.key);
                }
              }}
              onDragLeave={handleDragLeave}
              variants={columnVariants}
              initial="hidden"
              animate="visible"
              custom={index}
              style={{ borderTopColor: col.color }}
            >
              <div className="task-column-header">
                <motion.div 
                  className="task-column-title"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                >
                  {(() => {
                    const IconComponent = col.icon;
                    return (
                      <>
                        <IconComponent className="column-icon" />
                        <span>{col.label}</span>
                      </>
                    );
                  })()}
                </motion.div>
                <div className="task-count">
                  {getTasksByStatus(col.key).length}
                </div>
              </div>
              
              <div className="task-list">
                {getTasksByStatus(col.key).length === 0 ? (
                  <motion.div 
                    className="empty-tasks"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="empty-icon">📭</div>
                    <p>No tasks here</p>
                  </motion.div>
                ) : (
                  <AnimatePresence>
                    {getTasksByStatus(col.key).map((task, taskIndex) => (
                      <motion.div
                        key={task._id}
                        className={`task-card ${task.priority?.toLowerCase()} ${user && user.role !== 'admin' ? 'no-drag' : ''}`}
                        draggable={user && user.role === 'admin'}
                        onDragStart={() => handleDragStart(task)}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        custom={taskIndex}
                        whileHover="hover"
                        whileDrag="drag"
                        layout
                        onClick={() => {
                          setSelectedTask(task);
                          setShowTaskModal(true);
                        }}
                      >
                        <div className="task-header">
                          <div className="task-title">{task.title}</div>
                          <div 
                            className="priority-badge"
                            style={{ background: priorityColors[task.priority] || '#6B7280' }}
                          >
                            {task.priority}
                          </div>
                        </div>
                        
                        {task.description && (
                          <div className="task-description">
                            {task.description.length > 100 
                              ? `${task.description.substring(0, 100)}...` 
                              : task.description
                            }
                          </div>
                        )}
                        
                        <div className="task-footer">
                          <div className="task-assignee">
                            {task.assignedTo && task.assignedTo.length > 0 ? (
                              <>
                                <div className="assignees-group">
                                  {task.assignedTo.slice(0, 3).map((assignee, idx) => (
                                    <div 
                                      key={assignee._id || idx} 
                                      className="assignee-avatar"
                                      title={assignee.name}
                                      style={{ marginLeft: idx > 0 ? '-8px' : '0', zIndex: 3 - idx }}
                                    >
                                      {assignee.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                  ))}
                                  {task.assignedTo.length > 3 && (
                                    <div className="assignee-avatar more" style={{ marginLeft: '-8px' }}>
                                      +{task.assignedTo.length - 3}
                                    </div>
                                  )}
                                </div>
                                <span>
                                  {task.assignedTo.length === 1 
                                    ? task.assignedTo[0].name 
                                    : `${task.assignedTo.length} members`}
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="assignee-avatar">?</div>
                                <span>Unassigned</span>
                              </>
                            )}
                          </div>
                          
                          {task.dueDate && (
                            <div className="due-date">
                              {formatDueDate(task.dueDate)?.text}
                            </div>
                          )}
                        </div>
                        
                        <motion.div 
                          className="task-progress"
                          initial={{ width: 0 }}
                          animate={{ width: `${task.progress || 0}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        >
                          <div className="progress-bar"></div>
                        </motion.div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <motion.div 
          className="task-list-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="list-header">
            <div className="list-column">Task</div>
            <div className="list-column">Assignee</div>
            <div className="list-column">Status</div>
            <div className="list-column">Priority</div>
            <div className="list-column">Due Date</div>
            <div className="list-column">Progress</div>
          </div>
          
          <div className="list-content">
            {getFilteredTasks().map((task, index) => (
              <motion.div
                key={task._id}
                className="list-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, x: 5 }}
                onClick={() => {
                  setSelectedTask(task);
                  setShowTaskModal(true);
                }}
              >
                <div className="list-column">
                  <div className="task-title">{task.title}</div>
                  {task.description && (
                    <div className="task-description">{task.description}</div>
                  )}
                </div>
                <div className="list-column">
                  <div className="assignee-info">
                    {task.assignedTo && task.assignedTo.length > 0 ? (
                      <>
                        <div className="assignees-group">
                          {task.assignedTo.slice(0, 2).map((assignee, idx) => (
                            <div 
                              key={assignee._id || idx} 
                              className="assignee-avatar"
                              title={assignee.name}
                              style={{ marginLeft: idx > 0 ? '-8px' : '0', zIndex: 2 - idx }}
                            >
                              {assignee.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                          ))}
                          {task.assignedTo.length > 2 && (
                            <div className="assignee-avatar more" style={{ marginLeft: '-8px' }}>
                              +{task.assignedTo.length - 2}
                            </div>
                          )}
                        </div>
                        <span>
                          {task.assignedTo.length === 1 
                            ? task.assignedTo[0].name 
                            : `${task.assignedTo.length} members`}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="assignee-avatar">?</div>
                        <span>Unassigned</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="list-column">
                  <span className={`status-badge ${task.status.toLowerCase().replace(' ', '-')}`}>
                    {task.status}
                  </span>
                </div>
                <div className="list-column">
                  <span 
                    className="priority-badge"
                    style={{ background: priorityColors[task.priority] || '#6B7280' }}
                  >
                    {task.priority}
                  </span>
                </div>
                <div className="list-column">
                  {task.dueDate ? (
                    <span className={`due-date ${formatDueDate(task.dueDate)?.color === '#EF4444' ? 'overdue' : ''}`}>
                      {formatDueDate(task.dueDate)?.text}
                    </span>
                  ) : (
                    <span className="no-due-date">No due date</span>
                  )}
                </div>
                <div className="list-column">
                  <div className="progress-container">
                    <div 
                      className="progress-bar"
                      style={{ width: `${task.progress || 0}%` }}
                    ></div>
                    <span>{task.progress || 0}%</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Task Detail Modal */}
      <AnimatePresence>
        {showTaskModal && selectedTask && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTaskModal(false)}
          >
            <motion.div 
              className="modal-content task-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>{selectedTask.title}</h3>
                <div className="modal-header-actions">
                  {user && user.role === 'admin' && (
                    <button 
                      className="delete-task-btn"
                      onClick={() => handleDeleteTask(selectedTask._id)}
                      title="Delete Task"
                    >
                      🗑️
                    </button>
                  )}
                  <button onClick={() => setShowTaskModal(false)}>✕</button>
                </div>
              </div>
              
              <div className="modal-body">
                <div className="task-details">
                  <div className="detail-row">
                    <span className="detail-label">Description:</span>
                    <span className="detail-value">{selectedTask.description || 'No description'}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Assigned To:</span>
                    <div className="detail-value">
                      {selectedTask.assignedTo && selectedTask.assignedTo.length > 0 ? (
                        <div className="assignees-list">
                          {selectedTask.assignedTo.map((assignee, idx) => (
                            <span key={assignee._id || idx} className="assignee-tag">
                              {assignee.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        'Unassigned'
                      )}
                    </div>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span className={`status-badge ${selectedTask.status.toLowerCase().replace(' ', '-')}`}>
                      {selectedTask.status}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Priority:</span>
                    <span 
                      className="priority-badge"
                      style={{ background: priorityColors[selectedTask.priority] || '#6B7280' }}
                    >
                      {selectedTask.priority}
                    </span>
                  </div>
                  
                  {selectedTask.dueDate && (
                    <div className="detail-row">
                      <span className="detail-label">Due Date:</span>
                      <span className="detail-value">
                        {new Date(selectedTask.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  <div className="detail-row">
                    <span className="detail-label">Progress:</span>
                    <div className="progress-container">
                      <div 
                        className="progress-bar"
                        style={{ width: `${selectedTask.progress || 0}%` }}
                      ></div>
                      <span>{selectedTask.progress || 0}%</span>
                    </div>
                  </div>

                  {/* Proof Files Section - Show for assigned members and admins */}
                  {((selectedTask.assignedTo && selectedTask.assignedTo.length > 0 && selectedTask.assignedTo.some(
                    assignee => {
                      // Handle both populated (object with _id) and non-populated (ID string) cases
                      const assigneeId = assignee._id || assignee.id || assignee;
                      const userId = user?._id || user?.id;
                      return String(assigneeId) === String(userId);
                    }
                  )) || user?.role === 'admin') && (
                    <div className="detail-row proof-section">
                      <span className="detail-label">Proof of Completion:</span>
                      <div className="proof-files-container">
                        {selectedTask.proofFiles && selectedTask.proofFiles.length > 0 ? (
                          <div className="proof-files-list">
                            {selectedTask.proofFiles.map((proof, idx) => (
                              <div key={idx} className="proof-file-item">
                                <span className="proof-file-icon">📎</span>
                                <a 
                                  href={`${(import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://techm4-collab-backend-1.onrender.com')}/${proof.fileUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="proof-file-link"
                                >
                                  {proof.fileName}
                                </a>
                                <span className="proof-file-date">
                                  {new Date(proof.uploadedAt).toLocaleDateString()}
                                  {proof.uploadedBy && proof.uploadedBy.name && (
                                    <span style={{ marginLeft: '0.5rem', color: '#9ca3af', fontSize: '0.75rem' }}>
                                      by {proof.uploadedBy.name}
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="no-proof-message">No proof files uploaded yet</p>
                        )}
                        
                        {/* Upload section - Only show for assigned members, not admins */}
                        {selectedTask.assignedTo && selectedTask.assignedTo.length > 0 && selectedTask.assignedTo.some(
                          assignee => {
                            const assigneeId = assignee._id || assignee.id || assignee;
                            const userId = user?._id || user?.id;
                            return String(assigneeId) === String(userId);
                          }
                        ) && (
                        <div className="proof-upload-section">
                          <input
                            type="file"
                            ref={proofFileInputRef}
                            onChange={(e) => setProofFile(e.target.files[0])}
                            style={{ display: 'none' }}
                            accept="image/*,.pdf,.doc,.docx,.txt"
                          />
                          <button
                            type="button"
                            className="upload-proof-btn"
                            onClick={() => proofFileInputRef.current?.click()}
                            disabled={uploadingProof}
                          >
                            📤 {proofFile ? 'Change File' : 'Upload Proof'}
                          </button>
                          {proofFile && (
                            <div className="proof-file-preview">
                              <span>{proofFile.name}</span>
                              <button
                                type="button"
                                className="remove-proof-btn"
                                onClick={() => setProofFile(null)}
                              >
                                ✕
                              </button>
                            </div>
                          )}
                          {proofFile && (
                            <button
                              type="button"
                              className="submit-proof-btn"
                              onClick={async () => {
                                if (!proofFile) return;
                                
                                // Double-check assignment before upload (UI check, backend is source of truth)
                                const isAssigned = selectedTask.assignedTo && selectedTask.assignedTo.some(
                                  assignee => {
                                    const assigneeId = assignee._id || assignee.id || assignee;
                                    const userId = user?._id || user?.id;
                                    return String(assigneeId) === String(userId);
                                  }
                                );
                                
                                if (!isAssigned) {
                                  alert('You can only upload proof for tasks assigned to you.');
                                  return;
                                }
                                
                                setUploadingProof(true);
                                try {
                                  const formData = new FormData();
                                  formData.append('file', proofFile);
                                  
                                  const res = await api.post(`/tasks/${selectedTask._id}/proof`, formData, {
                                    headers: { 'Content-Type': 'multipart/form-data' }
                                  });
                                  
                                  // Update selected task with new proof
                                  setSelectedTask(res.data.task);
                                  setProofFile(null);
                                  // Refresh tasks list
                                  fetchTasks();
                                } catch (err) {
                                  console.error('Proof upload error:', err);
                                  const errorMessage = err.response?.data?.error || 'Failed to upload proof';
                                  alert(errorMessage);
                                } finally {
                                  setUploadingProof(false);
                                }
                              }}
                              disabled={uploadingProof}
                            >
                              {uploadingProof ? 'Uploading...' : 'Submit Proof'}
                            </button>
                          )}
                        </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TaskBoard;