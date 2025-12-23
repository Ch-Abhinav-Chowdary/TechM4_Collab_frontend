import React, { useState, useEffect } from 'react';
import api from '../utils/axiosConfig';
import AddWorkflowModal from './AddWorkflowModal';
import EditWorkflowModal from './EditWorkflowModal';
import './WorkflowManager.css';

const WorkflowManager = () => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await api.get('/workflows');
      setWorkflows(res.data);
    } catch (err) {
      setError('Failed to fetch workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await api.delete(`/workflows/${id}`);
      fetchWorkflows();
    } catch (err) {
      alert('Failed to delete workflow');
    }
  };

  const handleToggle = async (id, isEnabled) => {
    try {
      await api.put(`/workflows/${id}`, { isEnabled: !isEnabled });
      fetchWorkflows();
    } catch (err) {
      alert('Failed to toggle workflow');
    }
  };

  const handleEdit = (workflow) => {
    setEditingWorkflow(workflow);
  };

  if (loading) {
    return (
      <div className="workflow-loading">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Loading workflows...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="workflow-error">
        <div className="error-content">
          <p className="error">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="workflow-manager">
      <div className="workflow-header">
        <div className="header-content">
          <h1>🔄 Workflow Automation</h1>
          <p>Manage automated workflows to streamline your team's processes</p>
        </div>
        <button className="add-workflow-btn" onClick={() => setShowAddModal(true)}>
          <span className="btn-icon">+</span>
          Add New Workflow
        </button>
      </div>

      {showAddModal && (
        <AddWorkflowModal
          onClose={() => setShowAddModal(false)}
          onWorkflowAdded={() => {
            setShowAddModal(false);
            fetchWorkflows();
          }}
        />
      )}

      {editingWorkflow && (
        <EditWorkflowModal
          workflow={editingWorkflow}
          onClose={() => setEditingWorkflow(null)}
          onWorkflowUpdated={() => {
            setEditingWorkflow(null);
            fetchWorkflows();
          }}
        />
      )}

      <div className="workflow-content">
        {workflows.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔄</div>
            <h3>No Workflows Yet</h3>
            <p>Create your first workflow to automate team processes</p>
            <button className="create-first-btn" onClick={() => setShowAddModal(true)}>
              Create First Workflow
            </button>
          </div>
        ) : (
          <div className="workflow-grid">
            {workflows.map((workflow) => (
              <div key={workflow._id} className="workflow-card">
                <div className="workflow-header-card">
                  <div className="workflow-status">
                    <span className={`status-indicator ${workflow.isEnabled ? 'enabled' : 'disabled'}`}></span>
                    <span className="status-text">{workflow.isEnabled ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="workflow-actions">
                    <button 
                      className="action-btn toggle-btn"
                      onClick={() => handleToggle(workflow._id, workflow.isEnabled)}
                      title={workflow.isEnabled ? 'Disable Workflow' : 'Enable Workflow'}
                    >
                      {workflow.isEnabled ? '⏸️' : '▶️'}
                    </button>
                    <button 
                      className="action-btn edit-btn"
                      onClick={() => handleEdit(workflow)}
                      title="Edit Workflow"
                    >
                      ✏️
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(workflow._id)}
                      title="Delete Workflow"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="workflow-body">
                  <h3 className="workflow-name">{workflow.name}</h3>
                  <div className="workflow-details">
                    <div className="detail-item">
                      <span className="detail-label">Trigger:</span>
                      <span className="detail-value">{workflow.triggerEvent}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Action:</span>
                      <span className="detail-value">{workflow.action}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowManager; 