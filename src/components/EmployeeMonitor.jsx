import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axiosConfig';
import { motion } from 'framer-motion';
import { HiUser, HiChartBar, HiCheckCircle, HiClock, HiTrendingUp } from 'react-icons/hi';
import './EmployeeMonitor.css';

const EmployeeMonitor = () => {
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeTasks, setEmployeeTasks] = useState([]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchEmployees();
    }
  }, [user]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/users');
      const members = res.data.filter(u => u.role === 'member');
      
      // Fetch tasks for each employee
      const employeesWithTasks = await Promise.all(
        members.map(async (employee) => {
          try {
            const tasksRes = await api.get('/tasks');
            const tasks = tasksRes.data || [];
            
            // Filter tasks assigned to this employee
            const assignedTasks = tasks.filter(task => 
              task.assignedTo && Array.isArray(task.assignedTo) && 
              task.assignedTo.some(assignee => 
                (assignee._id || assignee) === employee._id
              )
            );
            
            const completedTasks = assignedTasks.filter(t => t.status === 'Done').length;
            const inProgressTasks = assignedTasks.filter(t => t.status === 'In Progress').length;
            const todoTasks = assignedTasks.filter(t => t.status === 'To Do').length;
            
            return {
              ...employee,
              totalTasks: assignedTasks.length,
              completedTasks,
              inProgressTasks,
              todoTasks,
              completionRate: assignedTasks.length > 0 
                ? Math.round((completedTasks / assignedTasks.length) * 100) 
                : 0
            };
          } catch (err) {
            console.error(`Error fetching tasks for ${employee.name}:`, err);
            return {
              ...employee,
              totalTasks: 0,
              completedTasks: 0,
              inProgressTasks: 0,
              todoTasks: 0,
              completionRate: 0
            };
          }
        })
      );
      
      setEmployees(employeesWithTasks);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeClick = async (employee) => {
    setSelectedEmployee(employee);
    try {
      const res = await api.get('/tasks');
      const tasks = res.data || [];
      const assignedTasks = tasks.filter(task => 
        task.assignedTo && Array.isArray(task.assignedTo) && 
        task.assignedTo.some(assignee => 
          (assignee._id || assignee) === employee._id
        )
      );
      setEmployeeTasks(assignedTasks);
    } catch (err) {
      console.error('Error fetching employee tasks:', err);
    }
  };

  if (user?.role !== 'admin') {
    return <div className="unauthorized">Only admins can access this page.</div>;
  }

  if (loading) {
    return <div className="loading">Loading employee data...</div>;
  }

  return (
    <motion.div 
      className="employee-monitor"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="monitor-header">
        <h2>👥 Employee Monitor</h2>
        <p>Track and manage all team members performance</p>
      </div>

      <div className="monitor-grid">
        {employees.map((employee, index) => (
          <motion.div
            key={employee._id}
            className="employee-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)' }}
            onClick={() => handleEmployeeClick(employee)}
          >
            <div className="employee-card-header">
              <div className="employee-avatar">
                {employee.name?.charAt(0).toUpperCase()}
              </div>
              <div className="employee-info">
                <h3>{employee.name}</h3>
                <p className="employee-email">{employee.email}</p>
                <span className={`status-badge ${employee.online ? 'online' : 'offline'}`}>
                  {employee.online ? '🟢 Online' : '⚪ Offline'}
                </span>
              </div>
            </div>

            <div className="employee-stats">
              <div className="stat-item">
                <HiChartBar className="stat-icon" />
                <div>
                  <span className="stat-value">{employee.totalTasks}</span>
                  <span className="stat-label">Total Tasks</span>
                </div>
              </div>

              <div className="stat-item">
                <HiCheckCircle className="stat-icon success" />
                <div>
                  <span className="stat-value">{employee.completedTasks}</span>
                  <span className="stat-label">Completed</span>
                </div>
              </div>

              <div className="stat-item">
                <HiClock className="stat-icon warning" />
                <div>
                  <span className="stat-value">{employee.inProgressTasks}</span>
                  <span className="stat-label">In Progress</span>
                </div>
              </div>

              <div className="stat-item">
                <HiTrendingUp className="stat-icon" />
                <div>
                  <span className="stat-value">{employee.completionRate}%</span>
                  <span className="stat-label">Completion Rate</span>
                </div>
              </div>
            </div>

            <div className="employee-progress">
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill"
                  style={{ width: `${employee.completionRate}%` }}
                ></div>
              </div>
            </div>

            <div className="employee-footer">
              <div className="level-badge">
                ⭐ Level {employee.level || 1}
              </div>
              <div className="points-badge">
                💎 {employee.points || 0} pts
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedEmployee(null)}
        >
          <motion.div 
            className="employee-detail-modal"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>📊 {selectedEmployee.name}'s Tasks</h3>
              <button onClick={() => setSelectedEmployee(null)}>✕</button>
            </div>
            
            <div className="modal-body">
              {employeeTasks.length === 0 ? (
                <p className="no-tasks">No tasks assigned yet</p>
              ) : (
                <div className="tasks-list">
                  {employeeTasks.map((task) => (
                    <div key={task._id} className="task-item">
                      <div className="task-item-header">
                        <h4>{task.title}</h4>
                        <span className={`status-badge ${task.status.toLowerCase().replace(' ', '-')}`}>
                          {task.status}
                        </span>
                      </div>
                      {task.description && (
                        <p className="task-description">{task.description}</p>
                      )}
                      {task.dueDate && (
                        <p className="task-due-date">
                          📅 Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmployeeMonitor;

