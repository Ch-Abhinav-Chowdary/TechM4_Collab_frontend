import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import socket from '../socket';
import api from '../utils/axiosConfig';
import { motion, AnimatePresence } from 'framer-motion';
import './FileEditor.css';

const FileEditor = ({ fileId, room, onClose }) => {
  const { user } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [content, setContent] = useState('');
  const [fileType, setFileType] = useState('text');
  const [version, setVersion] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [cursors, setCursors] = useState({});
  const [cursorPosition, setCursorPosition] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveInterval, setAutoSaveInterval] = useState(null);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [error, setError] = useState('');
  
  const textareaRef = useRef(null);
  const lastEditRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Load file data
  useEffect(() => {
    const loadFile = async () => {
      try {
        setIsLoading(true);
        setError('');
        console.log('Loading file:', fileId);
        const response = await api.get(`/files/${fileId}`);
        const fileData = response.data;
        console.log('File loaded:', fileData);
        
        setFile(fileData);
        setContent(fileData.content || '');
        setFileType(fileData.fileType || 'text');
        setVersion(fileData.version || 1);
        
        const initialCollaborators = fileData.collaborators || [];
        const currentUserInCollaborators = initialCollaborators.find(c => 
          (c.user || c)._id === user._id
        );
        
        if (!currentUserInCollaborators && user) {
          initialCollaborators.push({ user });
        }
        
        setCollaborators(initialCollaborators);
      } catch (error) {
        console.error('Error loading file:', error);
        setError('Failed to load file. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (fileId && user) {
      loadFile();
    }
  }, [fileId, user]);

  // Join file editing session
  useEffect(() => {
    if (file && user && fileId) {
      const joinFileSession = () => {
        console.log('Joining file session:', { fileId, user });
        socket.emit('joinFile', { fileId, user });
      };

      const timeoutId = setTimeout(joinFileSession, 100);
      
      return () => {
        clearTimeout(timeoutId);
        if (fileId) {
          console.log('Leaving file session:', { fileId, user });
          socket.emit('leaveFile', { fileId, user });
        }
      };
    }
  }, [fileId, user, file]);

  // Socket event listeners
  useEffect(() => {
    const handleFileEdited = ({ content: newContent, version: newVersion, user: editingUser }) => {
      if (editingUser._id !== user._id) {
        console.log('File edited by another user:', editingUser.name);
        setContent(newContent);
        setVersion(newVersion);
        setHasUnsavedChanges(false);
      }
    };

    const handleCursorMoved = ({ user: movingUser, position, color }) => {
      if (movingUser._id !== user._id) {
        setCursors(prev => ({
          ...prev,
          [movingUser._id]: { position, name: movingUser.name, color }
        }));
      }
    };

    const handleUserJoinedFile = ({ user: joiningUser, cursor }) => {
      console.log('User joined file:', joiningUser.name);
      setCollaborators(prev => {
        const exists = prev.find(c => {
          const user = c.user || c;
          return user._id === joiningUser._id;
        });
        if (!exists) {
          return [...prev, { user: joiningUser }];
        }
        return prev;
      });
      setCursors(prev => ({
        ...prev,
        [joiningUser._id]: cursor
      }));
    };

    const handleUserLeftFile = ({ user: leavingUser }) => {
      console.log('User left file:', leavingUser.name);
      setCollaborators(prev => prev.filter(c => c.user._id !== leavingUser._id));
      setCursors(prev => {
        const newCursors = { ...prev };
        delete newCursors[leavingUser._id];
        return newCursors;
      });
    };

    const handleFileSaved = ({ savedBy, version: newVersion, file: updatedFile }) => {
      setVersion(newVersion);
      setHasUnsavedChanges(false);
      setSaveStatus(`Saved by ${savedBy.name}`);
      setTimeout(() => setSaveStatus(''), 3000);
      
      if (updatedFile) {
        setFile(updatedFile);
        setContent(updatedFile.content);
        setCollaborators(updatedFile.collaborators || []);
      }
    };

    const handleSaveConflict = ({ currentVersion, currentContent }) => {
      setVersion(currentVersion);
      setContent(currentContent);
      setHasUnsavedChanges(false);
      setSaveStatus('Version conflict - file updated');
      setTimeout(() => setSaveStatus(''), 5000);
    };

    const handleFileState = ({ file: fileState, cursors: fileCursors, activeCollaborators }) => {
      setFile(fileState);
      setContent(fileState.content);
      setVersion(fileState.version);
      setCursors(fileCursors);
      
      if (activeCollaborators && activeCollaborators.length > 0) {
        const activeCollaboratorsList = activeCollaborators.map(user => ({ user }));
        const currentUserInActive = activeCollaboratorsList.find(c => c.user._id === user._id);
        if (!currentUserInActive && user) {
          activeCollaboratorsList.push({ user });
        }
        setCollaborators(activeCollaboratorsList);
      } else {
        const dbCollaborators = fileState.collaborators || [];
        setCollaborators(dbCollaborators);
      }
    };

    const handleActiveCollaborators = ({ collaborators }) => {
      const activeCollaborators = collaborators.map(user => ({ user }));
      const currentUserInActive = activeCollaborators.find(c => c.user._id === user._id);
      if (!currentUserInActive && user) {
        activeCollaborators.push({ user });
      }
      setCollaborators(activeCollaborators);
    };

    socket.on('fileEdited', handleFileEdited);
    socket.on('cursorMoved', handleCursorMoved);
    socket.on('userJoinedFile', handleUserJoinedFile);
    socket.on('userLeftFile', handleUserLeftFile);
    socket.on('fileSaved', handleFileSaved);
    socket.on('saveConflict', handleSaveConflict);
    socket.on('fileState', handleFileState);
    socket.on('activeCollaborators', handleActiveCollaborators);

    return () => {
      socket.off('fileEdited', handleFileEdited);
      socket.off('cursorMoved', handleCursorMoved);
      socket.off('userJoinedFile', handleUserJoinedFile);
      socket.off('userLeftFile', handleUserLeftFile);
      socket.off('fileSaved', handleFileSaved);
      socket.off('saveConflict', handleSaveConflict);
      socket.off('fileState', handleFileState);
      socket.off('activeCollaborators', handleActiveCollaborators);
    };
  }, [user]);

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges && !autoSaveInterval) {
      const interval = setInterval(() => {
        handleSave();
      }, 30000);
      setAutoSaveInterval(interval);
    }

    return () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
    };
  }, [hasUnsavedChanges, autoSaveInterval]);

  // Debounced content update
  const handleContentChange = useCallback((e) => {
    const newContent = e.target.value;
    setContent(newContent);
    setHasUnsavedChanges(true);
    setCursorPosition(e.target.selectionStart);

    // Emit cursor position
    if (fileId && user) {
      socket.emit('cursorMove', {
        fileId,
        user,
        position: e.target.selectionStart
      });
    }

    // Debounce file edit emission
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (fileId && user) {
        socket.emit('fileEdit', {
          fileId,
          content: newContent,
          version,
          user
        });
      }
    }, 500);
  }, [fileId, user, version]);

  // Save file
  const handleSave = async () => {
    if (!fileId || !hasUnsavedChanges) return;

    setIsSaving(true);
    try {
      console.log('Saving file:', { fileId, content, version });
      const response = await api.put(`/files/${fileId}`, {
        content,
        version
      });

      setVersion(response.data.version);
      setHasUnsavedChanges(false);
      setSaveStatus('Saved successfully');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving file:', error);
      if (error.response?.status === 409) {
        // Version conflict
        const { currentVersion, currentContent } = error.response.data;
        setVersion(currentVersion);
        setContent(currentContent);
        setHasUnsavedChanges(false);
        setSaveStatus('Version conflict - file updated');
        setTimeout(() => setSaveStatus(''), 5000);
      } else {
        setError('Failed to save file');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  // Get language class for syntax highlighting
  const getLanguageClass = () => {
    const languageMap = {
      javascript: 'javascript',
      python: 'python',
      html: 'html',
      css: 'css',
      json: 'json',
      xml: 'xml',
      yaml: 'yaml',
      sql: 'sql',
      markdown: 'markdown'
    };
    return languageMap[fileType] || 'text';
  };

  if (isLoading) {
    return (
      <motion.div 
        className="file-editor loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="loading-spinner"></div>
        <p>Loading file...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="file-editor error"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="error-message">
          <h3>Error Loading File</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="file-editor"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="editor-header">
        <div className="header-content">
          <div className="file-info">
            <h3>{file?.name || 'Untitled'}</h3>
            <span className="file-type-badge">{fileType}</span>
          </div>
          
          <div className="editor-actions">
            <motion.button
              className="collaborators-btn"
              onClick={() => setShowCollaborators(!showCollaborators)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              👥 {collaborators.length} Collaborators
            </motion.button>
            
            <motion.button
              className="save-btn"
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSaving ? '💾 Saving...' : 'Save'}
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
        
        {saveStatus && (
          <motion.div 
            className="save-status"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {saveStatus}
          </motion.div>
        )}
      </div>

      <div className="editor-content">
        <div className="editor-main">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            className={`code-editor ${getLanguageClass()}`}
            placeholder="Start typing your code..."
            spellCheck={false}
          />
          
          {/* Cursor indicators */}
          <div className="cursor-indicators">
            {Object.entries(cursors).map(([userId, cursor]) => (
              <div
                key={userId}
                className="cursor-indicator"
                style={{
                  left: `${(cursor.position / content.length) * 100}%`,
                  backgroundColor: cursor.color
                }}
                title={`${cursor.name}'s cursor`}
              />
            ))}
          </div>
        </div>

        {/* Collaborators sidebar */}
        <AnimatePresence>
          {showCollaborators && (
            <motion.div 
              className="collaborators-sidebar"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
            >
              <h4>Active Collaborators</h4>
              <div className="collaborators-list">
                {collaborators.map((collaborator, index) => {
                  const user = collaborator.user || collaborator;
                  return (
                    <motion.div
                      key={user._id}
                      className="collaborator-item"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div 
                        className="collaborator-avatar"
                        style={{ backgroundColor: cursors[user._id]?.color || '#667eea' }}
                      >
                        {user.name[0].toUpperCase()}
                      </div>
                      <span className="collaborator-name">{user.name}</span>
                      {cursors[user._id] && (
                        <div className="cursor-status">●</div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default FileEditor; 