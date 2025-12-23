import React, { useState } from 'react';
import api from '../utils/axiosConfig';
import './AddTaskModal.css';

const AddTaskModal = ({ users, tasks, onClose, onTaskAdded }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedTo: [],
    dueDate: '',
    dependency: '',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleMultiSelectChange = (e) => {
    const options = Array.from(e.target.selectedOptions);
    const values = options.map(option => option.value);
    setForm({ ...form, assignedTo: values });
    setError('');
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) {
      setError('Title is required');
      return;
    }
    setLoading(true);

    let fileUrl = '';
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        fileUrl = res.data.file;
      } catch (err) {
        setError('File upload failed');
        setLoading(false);
        return;
      }
    }

    try {
      await api.post('/tasks', {
        ...form,
        assignedTo: form.assignedTo.length > 0 ? form.assignedTo : undefined,
        dependency: form.dependency || undefined,
        files: fileUrl ? [fileUrl] : [],
      });
      onTaskAdded();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  console.log('Users for assignment:', users);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Task</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="add-task-form">
          <div className="form-group">
            <label htmlFor="title">Task Title *</label>
            <input
              id="title"
              name="title"
              placeholder="Enter task title..."
              value={form.title}
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
              placeholder="Describe the task details..."
              value={form.description}
              onChange={handleChange}
              className="form-textarea"
              rows="4"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="assignedTo">
                Assign To (Multiple)
                {form.assignedTo.length > 0 && (
                  <span className="selected-count">
                    {form.assignedTo.length} selected
                  </span>
                )}
              </label>
              <select 
                id="assignedTo" 
                name="assignedTo" 
                value={form.assignedTo} 
                onChange={handleMultiSelectChange}
                className="form-select form-select-multiple"
                multiple
                size="5"
              >
                {users
                  .filter((u) => u.role && u.role.toLowerCase() === 'member')
                  .map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
              </select>
              <small className="form-hint">Hold Ctrl/Cmd to select multiple members</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="dueDate">Due Date</label>
              <input 
                id="dueDate"
                name="dueDate" 
                type="date" 
                value={form.dueDate} 
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="dependency">Dependency</label>
            <select 
              id="dependency"
              name="dependency" 
              value={form.dependency} 
              onChange={handleChange}
              className="form-select"
            >
              <option value="">No dependency</option>
              {tasks.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="file" className="file-label">
              <span className="file-icon">📎</span>
              Attach File
            </label>
            <input 
              id="file"
              name="file" 
              type="file" 
              onChange={handleFileChange}
              className="file-input"
            />
            {file && (
              <div className="file-preview">
                <span className="file-name">📄 {file.name}</span>
                <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
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
                  Creating...
                </>
              ) : (
                <>
                  <span className="btn-icon">✨</span>
                  Create Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal; 