import React, { useState, useEffect } from 'react';
import api from '../utils/axiosConfig';
import './EditWorkflowModal.css';

const EditWorkflowModal = ({ workflow, onClose, onWorkflowUpdated }) => {
  const [name, setName] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('task.completed');
  const [action, setAction] = useState('create.task');
  const [actionParams, setActionParams] = useState({ title: '', description: '', subject: '', body: '' });
  const [runOnce, setRunOnce] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (workflow) {
      setName(workflow.name);
      setTriggerEvent(workflow.triggerEvent);
      setAction(workflow.action);
      setActionParams(workflow.actionParams || { title: '', description: '', subject: '', body: '' });
      setRunOnce(workflow.runOnce || false);
    }
  }, [workflow]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Workflow name is required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await api.put(`/workflows/${workflow._id}`, {
        name,
        triggerEvent,
        action,
        actionParams,
        runOnce,
      });
      onWorkflowUpdated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update workflow');
    } finally {
      setLoading(false);
    }
  };

  const getTriggerEventLabel = (event) => {
    const labels = {
      'task.completed': 'A Task is Completed',
      'task.created': 'A Task is Created',
      'task.assigned': 'A Task is Assigned',
      'file.uploaded': 'A File is Uploaded'
    };
    return labels[event] || event;
  };

  const getActionLabel = (action) => {
    const labels = {
      'create.task': 'Create a new Task',
      'send.email': 'Send an Email',
      'send.notification': 'Send a Notification',
      'update.status': 'Update Status'
    };
    return labels[action] || action;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ Edit Workflow</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="edit-workflow-form">
          <div className="form-group">
            <label htmlFor="name">Workflow Name *</label>
            <input
              id="name"
              placeholder="Enter workflow name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="workflow-section">
            <div className="section-header">
              <span className="section-icon">🎯</span>
              <h3>Trigger Condition</h3>
              <p>When this happens...</p>
            </div>
            
            <div className="form-group">
              <label htmlFor="triggerEvent">Trigger Event</label>
              <select 
                id="triggerEvent"
                value={triggerEvent} 
                onChange={(e) => setTriggerEvent(e.target.value)}
                className="form-select"
              >
                <option value="task.completed">A Task is Completed</option>
                <option value="task.created">A Task is Created</option>
                <option value="task.assigned">A Task is Assigned</option>
                <option value="file.uploaded">A File is Uploaded</option>
              </select>
            </div>
          </div>

          <div className="workflow-section">
            <div className="section-header">
              <span className="section-icon">⚡</span>
              <h3>Action</h3>
              <p>Do this...</p>
            </div>
            
            <div className="form-group">
              <label htmlFor="action">Action Type</label>
              <select 
                id="action"
                value={action} 
                onChange={(e) => setAction(e.target.value)}
                className="form-select"
              >
                <option value="create.task">Create a new Task</option>
                <option value="send.email">Send an Email</option>
                <option value="send.notification">Send a Notification</option>
                <option value="update.status">Update Status</option>
              </select>
            </div>
          </div>

          <div className="placeholder-info">
            <div className="info-icon">💡</div>
            <div className="info-content">
              <strong>Available Placeholders:</strong>
              <ul>
                <li><code>{'{task.title}'}</code> - The completed task's title</li>
                <li><code>{'{task.description}'}</code> - The completed task's description</li>
                <li><code>{'{user.name}'}</code> - The user who triggered the event</li>
                <li><code>{'{date}'}</code> - Current date and time</li>
              </ul>
            </div>
          </div>

          {action === 'create.task' && (
            <div className="action-params">
              <h4>Task Details</h4>
              <div className="form-group">
                <label htmlFor="taskTitle">New Task Title *</label>
                <input
                  id="taskTitle"
                  placeholder="Enter task title..."
                  value={actionParams.title || ''}
                  onChange={(e) => setActionParams({ ...actionParams, title: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="taskDescription">Task Description</label>
                <textarea
                  id="taskDescription"
                  placeholder="Enter task description..."
                  value={actionParams.description || ''}
                  onChange={(e) => setActionParams({ ...actionParams, description: e.target.value })}
                  className="form-textarea"
                  rows="3"
                />
              </div>
            </div>
          )}

          {action === 'send.email' && (
            <div className="action-params">
              <h4>📧 Email Details</h4>
              <div className="form-group">
                <label htmlFor="emailSubject">Email Subject *</label>
                <input
                  id="emailSubject"
                  placeholder="Enter email subject..."
                  value={actionParams.subject || ''}
                  onChange={(e) => setActionParams({ ...actionParams, subject: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="emailBody">Email Body</label>
                <textarea
                  id="emailBody"
                  placeholder="Enter email body..."
                  value={actionParams.body || ''}
                  onChange={(e) => setActionParams({ ...actionParams, body: e.target.value })}
                  className="form-textarea"
                  rows="4"
                />
              </div>
            </div>
          )}

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={runOnce}
                onChange={(e) => setRunOnce(e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-custom"></span>
              <span className="checkbox-text">
                <strong>Run Once</strong> - Delete workflow after execution
              </span>
            </label>
            <p className="checkbox-help">
              Enable this option if you want the workflow to be automatically deleted after it runs once.
            </p>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  Updating...
                </>
              ) : (
                <>
                  <span className="btn-icon">💾</span>
                  Update Workflow
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditWorkflowModal; 