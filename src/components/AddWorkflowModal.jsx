import React, { useState } from 'react';
import api from '../utils/axiosConfig';
import './AddWorkflowModal.css';

const AddWorkflowModal = ({ onClose, onWorkflowAdded }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    triggerEvent: 'task.completed',
    action: 'create.task',
    actionParams: {
      title: 'Follow-up on: {task.title}',
      description: 'This is a follow-up task for: {task.title}',
      priority: 'Medium'
    },
    runOnce: false,
    priority: 1,
    tags: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  const triggerEvents = [
    { value: 'task.completed', label: 'Task Completed' },
    { value: 'task.created', label: 'Task Created' },
    { value: 'task.assigned', label: 'Task Assigned' },
    { value: 'task.overdue', label: 'Task Overdue' },
    { value: 'file.uploaded', label: 'File Uploaded' },
    { value: 'file.modified', label: 'File Modified' },
    { value: 'user.joined', label: 'User Joined' },
    { value: 'user.levelup', label: 'User Level Up' },
    { value: 'message.sent', label: 'Message Sent' },
    { value: 'workflow.executed', label: 'Workflow Executed' }
  ];

  const actions = [
    { value: 'create.task', label: 'Create Task' },
    { value: 'send.email', label: 'Send Email' },
    { value: 'send.notification', label: 'Send Notification' },
    { value: 'update.status', label: 'Update Status' },
    { value: 'send.slack', label: 'Send Slack Message' },
    { value: 'send.discord', label: 'Send Discord Message' },
    { value: 'create.file', label: 'Create File' },
    { value: 'move.file', label: 'Move File' },
    { value: 'archive.task', label: 'Archive Task' },
    { value: 'assign.task', label: 'Assign Task' },
    { value: 'award.points', label: 'Award Points' },
    { value: 'create.reminder', label: 'Create Reminder' },
    { value: 'send.webhook', label: 'Send Webhook' }
  ];

  const priorities = [
    { value: 1, label: 'Low' },
    { value: 2, label: 'Medium' },
    { value: 3, label: 'High' },
    { value: 4, label: 'Critical' }
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setDebugInfo('');
  };

  const handleActionParamChange = (field, value) => {
    setForm({
      ...form,
      actionParams: {
        ...form.actionParams,
        [field]: value
      }
    });
    setError('');
    setDebugInfo('');
  };

  const handleTagChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setForm({ ...form, tags });
    setError('');
    setDebugInfo('');
  };

  const getActionParamFields = () => {
    switch (form.action) {
      case 'create.task':
        return (
          <>
            <div className="form-group">
              <label>Task Title *</label>
              <input
                type="text"
                placeholder="e.g., Follow-up on: {task.title}"
                value={form.actionParams.title || ''}
                onChange={(e) => handleActionParamChange('title', e.target.value)}
                className="form-input"
                required
              />
              <small className="form-help">Use {task.title} to reference the original task</small>
            </div>
            <div className="form-group">
              <label>Task Description</label>
              <textarea
                placeholder="e.g., This is a follow-up task for: {task.title}"
                value={form.actionParams.description || ''}
                onChange={(e) => handleActionParamChange('description', e.target.value)}
                className="form-textarea"
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select
                value={form.actionParams.priority || 'Medium'}
                onChange={(e) => handleActionParamChange('priority', e.target.value)}
                className="form-select"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </>
        );

      case 'send.email':
        return (
          <>
            <div className="form-group">
              <label>Subject *</label>
              <input
                type="text"
                placeholder="e.g., Task Completed: {task.title}"
                value={form.actionParams.subject || ''}
                onChange={(e) => handleActionParamChange('subject', e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Body *</label>
              <textarea
                placeholder="e.g., Congratulations! The task {task.title} has been completed."
                value={form.actionParams.body || ''}
                onChange={(e) => handleActionParamChange('body', e.target.value)}
                className="form-textarea"
                rows="4"
                required
              />
            </div>
          </>
        );

      case 'send.notification':
        return (
          <div className="form-group">
            <label>Message *</label>
            <textarea
              placeholder="e.g., New task assigned: {task.title}. Please review and start working on it."
              value={form.actionParams.message || ''}
              onChange={(e) => handleActionParamChange('message', e.target.value)}
              className="form-textarea"
              rows="3"
              required
            />
          </div>
        );

      case 'award.points':
        return (
          <div className="form-group">
            <label>Points to Award *</label>
            <input
              type="number"
              placeholder="e.g., 10"
              value={form.actionParams.points || ''}
              onChange={(e) => handleActionParamChange('points', parseInt(e.target.value))}
              className="form-input"
              min="1"
              required
            />
          </div>
        );

      default:
        return (
          <div className="form-group">
            <label>Parameters</label>
            <textarea
              placeholder="Enter action parameters as JSON..."
              value={JSON.stringify(form.actionParams, null, 2)}
              onChange={(e) => {
                try {
                  const params = JSON.parse(e.target.value);
                  setForm({ ...form, actionParams: params });
                } catch (err) {
                  // Invalid JSON, keep as is
                }
              }}
              className="form-textarea"
              rows="4"
            />
            <small className="form-help">Enter parameters as JSON format</small>
          </div>
        );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    setDebugInfo('');

    // Validation
    if (!form.name.trim()) {
      setError('Workflow name is required');
      return;
    }

    if (!form.triggerEvent) {
      setError('Trigger event is required');
      return;
    }

    if (!form.action) {
      setError('Action is required');
      return;
    }

    // Show what we're sending
    setDebugInfo(`Sending to: ${api.defaults.baseURL}/workflows\nData: ${JSON.stringify(form, null, 2)}`);

    setLoading(true);
    try {
      console.log('🔄 Creating workflow with data:', form);
      
      const response = await api.post('/workflows', form);
      
      console.log('✅ Workflow created successfully:', response.data);
      setDebugInfo(`✅ Success! Workflow ID: ${response.data._id}`);
      
      onWorkflowAdded();
    } catch (err) {
      console.error('❌ Error creating workflow:', err);
      
      let errorMessage = 'Failed to create workflow';
      if (err.response) {
        // Server responded with error
        errorMessage = err.response.data?.error || `Server error: ${err.response.status}`;
        setDebugInfo(`❌ Server Error (${err.response.status}): ${JSON.stringify(err.response.data, null, 2)}`);
      } else if (err.request) {
        // Network error
        errorMessage = 'Network error - please check your connection';
        setDebugInfo(`❌ Network Error: ${err.message}`);
      } else {
        // Other error
        errorMessage = err.message;
        setDebugInfo(`❌ Error: ${err.message}`);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔄 Create New Workflow</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="add-workflow-form">
          <div className="form-group">
            <label htmlFor="name">Workflow Name *</label>
            <input
              id="name"
              name="name"
              placeholder="Enter workflow name..."
              value={form.name}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              placeholder="Describe what this workflow does..."
              value={form.description}
              onChange={handleChange}
              className="form-textarea"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="triggerEvent">Trigger Event *</label>
              <select
                id="triggerEvent"
                name="triggerEvent"
                value={form.triggerEvent}
                onChange={handleChange}
                className="form-select"
                required
              >
                {triggerEvents.map(event => (
                  <option key={event.value} value={event.value}>
                    {event.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="action">Action *</label>
              <select
                id="action"
                name="action"
                value={form.action}
                onChange={handleChange}
                className="form-select"
                required
              >
                {actions.map(action => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="form-select"
              >
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags</label>
              <input
                id="tags"
                name="tags"
                type="text"
                placeholder="automation, notification, follow-up"
                value={form.tags.join(', ')}
                onChange={handleTagChange}
                className="form-input"
              />
              <small className="form-help">Comma-separated tags</small>
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="runOnce"
                checked={form.runOnce}
                onChange={(e) => setForm({ ...form, runOnce: e.target.checked })}
                className="form-checkbox"
              />
              Run once and delete
            </label>
            <small className="form-help">If checked, this workflow will be deleted after running once</small>
          </div>

          <div className="action-params-section">
            <h3>Action Parameters</h3>
            {getActionParamFields()}
          </div>
          
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {debugInfo && (
            <div className="debug-info">
              <h4>Debug Information:</h4>
              <pre>{debugInfo}</pre>
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
                  Creating...
                </>
              ) : (
                <>
                  <span className="btn-icon">✨</span>
                  Create Workflow
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWorkflowModal; 