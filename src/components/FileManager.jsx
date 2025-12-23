import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axiosConfig';
import { motion, AnimatePresence } from 'framer-motion';
import './FileManager.css';

const FileManager = ({ room, onFileSelect, onClose }) => {
  const { user } = useContext(AuthContext);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFile, setNewFile] = useState({
    name: '',
    fileType: 'text',
    content: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  // Load files for the room
  useEffect(() => {
    const loadFiles = async () => {
      try {
        setIsLoading(true);
        setError('');
        console.log('Loading files for room:', room);
        const response = await api.get(`/files/room/${room}`);
        console.log('Files loaded:', response.data);
        setFiles(response.data);
      } catch (error) {
        console.error('Error loading files:', error);
        setError('Failed to load files. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (room) {
      loadFiles();
    }
  }, [room]);

  // Create new file
  const handleCreateFile = async (e) => {
    e.preventDefault();
    if (!newFile.name.trim()) {
      setError('File name is required');
      return;
    }

    setIsCreating(true);
    setError('');
    try {
      console.log('Creating file:', { ...newFile, room });
      const response = await api.post('/files', {
        ...newFile,
        room
      });

      console.log('File created:', response.data);
      setFiles(prev => [response.data, ...prev]);
      setShowCreateModal(false);
      setNewFile({ name: '', fileType: 'text', content: '' });
      onFileSelect(response.data._id, response.data.name);
    } catch (error) {
      console.error('Error creating file:', error);
      setError(`Failed to create file: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Delete file
  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      await api.delete(`/files/${fileId}`);
      setFiles(prev => prev.filter(file => file._id !== fileId));
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Failed to delete file');
    }
  };

  // Get file type icon
  const getFileTypeIcon = (fileType) => {
    const icons = {
      text: '📄',
      javascript: '📜',
      python: '🐍',
      html: '🌐',
      css: '🎨',
      json: '📋',
      xml: '📄',
      yaml: '⚙️',
      sql: '🗄️',
      markdown: '📝'
    };
    return icons[fileType] || '📄';
  };

  // Get file type color
  const getFileTypeColor = (fileType) => {
    const colors = {
      text: '#4ec9b0',
      javascript: '#f7df1e',
      python: '#3776ab',
      html: '#e34f26',
      css: '#1572b6',
      json: '#f7df1e',
      xml: '#ff6600',
      yaml: '#cb171e',
      sql: '#336791',
      markdown: '#000000'
    };
    return colors[fileType] || '#4ec9b0';
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading) {
    return (
      <motion.div 
        className="file-manager loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="loading-spinner"></div>
        <p>Loading files...</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="file-manager"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="file-manager-header">
        <div className="header-content">
          <h2>File Manager</h2>
          <p>Manage and organize your project files</p>
        </div>
        <div className="file-manager-actions">
          <motion.button 
            className="create-file-btn"
            onClick={() => setShowCreateModal(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="btn-icon">+</span>
            New File
          </motion.button>
          <motion.button 
            className="close-btn" 
            onClick={onClose}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ✕
          </motion.button>
        </div>
      </div>

      {error && (
        <motion.div 
          className="error-message"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      <div className="file-content">
        {files.length === 0 ? (
          <motion.div 
            className="empty-state"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="empty-icon">📁</div>
            <h3>No files yet</h3>
            <p>Create your first file to get started with collaboration</p>
            <motion.button 
              className="create-first-file-btn"
              onClick={() => setShowCreateModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Create First File
            </motion.button>
          </motion.div>
        ) : (
          <motion.div 
            className="file-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {files.map((file, index) => (
              <motion.div
                key={file._id}
                className="file-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div 
                  className="file-card-content"
                  onClick={() => onFileSelect(file._id, file.name)}
                >
                  <div className="file-header">
                    <div className="file-icon">
                      <span style={{ color: getFileTypeColor(file.fileType) }}>
                        {getFileTypeIcon(file.fileType)}
                      </span>
                    </div>
                    <div className="file-actions">
                      {file.createdBy?._id === user?._id && (
                        <motion.button 
                          className="delete-file-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(file._id);
                          }}
                          title="Delete file"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          🗑️
                        </motion.button>
                      )}
                    </div>
                  </div>
                  
                  <div className="file-details">
                    <h3 className="file-name">{file.name}</h3>
                    <div className="file-meta">
                      <span className="file-type">{file.fileType}</span>
                      <span className="file-date">{formatDate(file.updatedAt)}</span>
                    </div>
                    {file.lastModifiedBy && (
                      <div className="file-author">
                        Last edited by {file.lastModifiedBy.name}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Create File Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Create New File</h3>
              <form onSubmit={handleCreateFile}>
                <div className="form-group">
                  <label>File Name</label>
                  <input
                    type="text"
                    value={newFile.name}
                    onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
                    placeholder="Enter file name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>File Type</label>
                  <select
                    value={newFile.fileType}
                    onChange={(e) => setNewFile({ ...newFile, fileType: e.target.value })}
                  >
                    <option value="text">Text</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="json">JSON</option>
                    <option value="markdown">Markdown</option>
                    <option value="sql">SQL</option>
                    <option value="xml">XML</option>
                    <option value="yaml">YAML</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Initial Content (Optional)</label>
                  <textarea
                    value={newFile.content}
                    onChange={(e) => setNewFile({ ...newFile, content: e.target.value })}
                    placeholder="Enter initial content..."
                    rows="5"
                  />
                </div>
                
                <div className="modal-actions">
                  <motion.button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="cancel-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    className="create-btn"
                    disabled={isCreating}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isCreating ? 'Creating...' : 'Create File'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FileManager; 