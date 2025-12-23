import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import FileManager from './FileManager';
import FileEditor from './FileEditor';
import { motion, AnimatePresence } from 'framer-motion';
import './FileCollaboration.css';

const FileCollaboration = ({ room, onClose }) => {
  const { user } = useContext(AuthContext);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [showFileManager, setShowFileManager] = useState(true);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [fileStats, setFileStats] = useState({ views: 0, edits: 0, collaborators: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [fileVersion, setFileVersion] = useState(1);
  const [lastSaved, setLastSaved] = useState(new Date());
  const [autoSave, setAutoSave] = useState(true);
  const [showFileHistory, setShowFileHistory] = useState(false);
  const [fileHistory, setFileHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [bulkActions, setBulkActions] = useState(false);
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSettings, setShareSettings] = useState({ public: false, editable: true });
  const [showVersionControl, setShowVersionControl] = useState(false);
  const [versions, setVersions] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(1);
  const [showDiff, setShowDiff] = useState(false);
  const [diffData, setDiffData] = useState(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [showRecent, setShowRecent] = useState(false);
  const [recentFiles, setRecentFiles] = useState([]);
  const [showTrash, setShowTrash] = useState(false);
  const [trashedFiles, setTrashedFiles] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    autoSave: true,
    autoSaveInterval: 30,
    theme: 'light',
    fontSize: 14,
    showLineNumbers: true,
    wordWrap: true,
    minimap: true,
    autoComplete: true,
    spellCheck: true,
    collaborativeEditing: true,
    realTimeSync: true,
    conflictResolution: 'manual',
    backupEnabled: true,
    backupInterval: 24,
    notifications: true,
    soundEnabled: true,
    keyboardShortcuts: true
  });

  const notificationTimeoutRef = useRef(null);
  const autoSaveIntervalRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);

  // Simulate active users and real-time data
  useEffect(() => {
    const mockActiveUsers = [
      { id: 1, name: 'Alice Johnson', avatar: '👩‍💻', status: 'online', lastSeen: new Date() },
      { id: 2, name: 'Bob Smith', avatar: '👨‍💼', status: 'online', lastSeen: new Date() },
      { id: 3, name: 'Carol Davis', avatar: '👩‍🎨', status: 'away', lastSeen: new Date(Date.now() - 300000) },
      { id: 4, name: 'David Wilson', avatar: '👨‍🔬', status: 'online', lastSeen: new Date() }
    ];
    setActiveUsers(mockActiveUsers);

    const mockFileStats = {
      views: Math.floor(Math.random() * 1000) + 100,
      edits: Math.floor(Math.random() * 500) + 50,
      collaborators: mockActiveUsers.length
    };
    setFileStats(mockFileStats);

    // Simulate typing indicators
    const typingInterval = setInterval(() => {
      const typingUser = mockActiveUsers[Math.floor(Math.random() * mockActiveUsers.length)];
      setTypingUsers(prev => {
        if (Math.random() > 0.7) {
          return [...prev, typingUser];
        } else {
          return prev.filter(u => u.id !== typingUser.id);
        }
      });
    }, 3000);

    // Heartbeat for real-time sync
    const heartbeat = setInterval(() => {
      setLastSaved(new Date());
      setFileVersion(prev => prev + 0.1);
    }, 5000);

    heartbeatIntervalRef.current = heartbeat;

    return () => {
      clearInterval(typingInterval);
      clearInterval(heartbeat);
    };
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && selectedFileId) {
      autoSaveIntervalRef.current = setInterval(() => {
        setLastSaved(new Date());
        addNotification('File auto-saved', 'success');
      }, settings.autoSaveInterval * 1000);
    }

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [autoSave, selectedFileId, settings.autoSaveInterval]);

  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [...prev, notification]);

    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    notificationTimeoutRef.current = setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  const handleFileSelect = (fileId, fileName) => {
    setIsLoading(true);
    
    // Simulate loading
    setTimeout(() => {
    setSelectedFileId(fileId);
      setSelectedFileName(fileName);
    setShowFileManager(false);
      setIsLoading(false);
      addNotification(`Opened ${fileName}`, 'success');
      
      // Simulate file stats update
      setFileStats(prev => ({
        ...prev,
        views: prev.views + 1
      }));
    }, 800);
  };

  const handleBackToManager = () => {
    setSelectedFileId(null);
    setSelectedFileName('');
    setShowFileManager(true);
    addNotification('Returned to file manager', 'info');
  };

  const handleClose = () => {
    setSelectedFileId(null);
    setSelectedFileName('');
    setShowFileManager(true);
    onClose();
  };

  const handleBulkAction = (action) => {
    if (selectedFiles.length === 0) {
      addNotification('No files selected', 'warning');
      return;
    }

    addNotification(`${action} ${selectedFiles.length} files`, 'success');
    setSelectedFiles([]);
    setBulkActions(false);
  };

  const handleUpload = (files) => {
    setShowUploadProgress(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setShowUploadProgress(false);
          addNotification('Files uploaded successfully', 'success');
          return 0;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleShare = () => {
    setShowShareModal(true);
    addNotification('Share settings opened', 'info');
  };

  const handleExport = () => {
    setShowExportOptions(true);
    addNotification('Export options opened', 'info');
  };

  const handleVersionControl = () => {
    setShowVersionControl(true);
    addNotification('Version control opened', 'info');
  };

  const handleComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now(),
        user: user,
        text: newComment,
        timestamp: new Date(),
        replies: []
      };
      setComments(prev => [...prev, comment]);
      setNewComment('');
      addNotification('Comment added', 'success');
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    addNotification(`Template "${template.name}" selected`, 'success');
  };

  const handleBookmark = () => {
    const bookmark = {
      id: Date.now(),
      fileId: selectedFileId,
      fileName: selectedFileName,
      timestamp: new Date()
    };
    setBookmarks(prev => [...prev, bookmark]);
    addNotification('File bookmarked', 'success');
  };

  const handleFavorite = () => {
    const favorite = {
      id: Date.now(),
      fileId: selectedFileId,
      fileName: selectedFileName,
      timestamp: new Date()
    };
    setFavorites(prev => [...prev, favorite]);
    addNotification('File added to favorites', 'success');
  };

  const handleSettingsChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    addNotification(`Setting "${key}" updated`, 'info');
  };

    return (
    <motion.div 
      className="file-collaboration"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Animated Background */}
      <div className="animated-background">
        <div className="floating-shapes">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="floating-shape"
              animate={{
                x: [0, 100, 0],
                y: [0, -100, 0],
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Compact Header for File Editor */}
      <AnimatePresence>
        {!showFileManager && (
          <motion.div 
            className="compact-header"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="compact-header-content">
              <div className="file-info-compact">
                <motion.button 
                  className="back-btn-compact"
                  onClick={handleBackToManager}
                  whileHover={{ scale: 1.05, x: -3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ←
                </motion.button>
                <span className="file-icon-compact">📄</span>
                <span className="file-name-compact">{selectedFileName}</span>
                <motion.span 
                  className="editing-status-compact"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ✨ Live
                </motion.span>
              </div>

              <div className="compact-actions">
                <motion.button
                  className="focus-mode-btn"
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  title={isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isFocusMode ? '↔️' : '↕️'}
                </motion.button>
                <motion.div 
                  className="auto-save-indicator-compact"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  💾 {lastSaved.toLocaleTimeString()}
                </motion.div>
                <span className="version-indicator-compact">v{fileVersion.toFixed(1)}</span>
                <motion.button 
                  className="close-btn-compact" 
                  onClick={handleClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ✕
                </motion.button>
              </div>
            </div>

            {/* Typing indicators */}
            <AnimatePresence>
              {typingUsers.length > 0 && (
                <motion.div 
                  className="typing-indicators-compact"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {typingUsers.map(user => (
                    <motion.div 
                      key={user.id}
                      className="typing-user-compact"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <span className="user-avatar-compact">{user.avatar}</span>
                      <span className="user-name-compact">{user.name}</span>
                      <span className="typing-dots-compact">
                        <motion.span
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                        >.</motion.span>
                        <motion.span
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                        >.</motion.span>
                        <motion.span
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                        >.</motion.span>
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Header for File Manager */}
      <AnimatePresence>
        {showFileManager && (
          <motion.div 
            className="collaboration-header"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="header-content">
              <div className="header-title">
                <motion.h2
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Collaborative File Editor
                </motion.h2>
                <motion.span 
                  className="room-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.1 }}
                >
                  {room}
                </motion.span>
              </div>

              {/* Real-time Stats */}
              <div className="real-time-stats">
                <motion.div 
                  className="stat-item"
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="stat-icon">👥</span>
                  <span className="stat-value">{activeUsers.length}</span>
                  <span className="stat-label">Active</span>
                </motion.div>
                <motion.div 
                  className="stat-item"
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="stat-icon">👁️</span>
                  <span className="stat-value">{fileStats.views}</span>
                  <span className="stat-label">Views</span>
                </motion.div>
                <motion.div 
                  className="stat-item"
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="stat-icon">✏️</span>
                  <span className="stat-value">{fileStats.edits}</span>
                  <span className="stat-label">Edits</span>
                </motion.div>
              </div>

              <div className="header-actions">
                <motion.button 
                  className="close-btn" 
                  onClick={handleClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ✕
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Content Area with More Space */}
      <motion.div 
        className={`collaboration-content ${!showFileManager ? 'editor-mode' : ''}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {showFileManager ? (
            <motion.div
              key="file-manager"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.5 }}
              className="file-manager-container"
            >
        <FileManager 
          room={room} 
          onFileSelect={handleFileSelect}
          onClose={handleClose}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterType={filterType}
                setFilterType={setFilterType}
                sortBy={sortBy}
                setSortBy={setSortBy}
                viewMode={viewMode}
                setViewMode={setViewMode}
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
                bulkActions={bulkActions}
                setBulkActions={setBulkActions}
                onBulkAction={handleBulkAction}
                onUpload={handleUpload}
                showUploadProgress={showUploadProgress}
                uploadProgress={uploadProgress}
                onShare={handleShare}
                onExport={handleExport}
                onVersionControl={handleVersionControl}
                onComment={() => setShowComments(true)}
                onTemplate={() => setShowTemplates(true)}
                onBookmark={handleBookmark}
                onFavorite={handleFavorite}
                onSettings={() => setShowSettings(true)}
                bookmarks={bookmarks}
                favorites={favorites}
                recentFiles={recentFiles}
                trashedFiles={trashedFiles}
                showBookmarks={showBookmarks}
                setShowBookmarks={setShowBookmarks}
                showFavorites={showFavorites}
                setShowFavorites={setShowFavorites}
                showRecent={showRecent}
                setShowRecent={setShowRecent}
                showTrash={showTrash}
                setShowTrash={setShowTrash}
                settings={settings}
                onSettingsChange={handleSettingsChange}
              />
            </motion.div>
          ) : (
            <motion.div
              key="file-editor"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="file-editor-container"
            >
      <FileEditor 
        fileId={selectedFileId}
        room={room}
        onClose={handleBackToManager}
                activeUsers={activeUsers}
                typingUsers={typingUsers}
                onComment={handleComment}
                comments={comments}
                newComment={newComment}
                setNewComment={setNewComment}
                showComments={showComments}
                setShowComments={setShowComments}
                onShare={handleShare}
                onExport={handleExport}
                onVersionControl={handleVersionControl}
                onBookmark={handleBookmark}
                onFavorite={handleFavorite}
                settings={settings}
                onSettingsChange={handleSettingsChange}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Enhanced Notifications */}
      <div className="notifications-container">
        <AnimatePresence>
          {notifications.map(notification => (
            <motion.div
              key={notification.id}
              className={`notification notification-${notification.type}`}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <span className="notification-icon">
                {notification.type === 'success' ? '✅' : 
                 notification.type === 'warning' ? '⚠️' : 
                 notification.type === 'error' ? '❌' : 'ℹ️'}
              </span>
              <span className="notification-message">{notification.message}</span>
              <motion.button
                className="notification-close"
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
              >
                ✕
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="loading-spinner"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </motion.div>
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Loading file...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Active Users Sidebar - Only show in editor mode */}
      <AnimatePresence>
        {!showFileManager && !isFocusMode && (
          <motion.div 
            className="compact-users-sidebar"
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            transition={{ delay: 0.5 }}
          >
            <div className="compact-sidebar-header">
              <h3>👥 {activeUsers.length}</h3>
              <motion.button
                className="compact-sidebar-toggle"
                onClick={() => setShowCollaborators(!showCollaborators)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {showCollaborators ? '→' : '←'}
              </motion.button>
            </div>
            
            <AnimatePresence>
              {showCollaborators && (
                <motion.div
                  className="compact-users-list"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {activeUsers.map(user => (
                    <motion.div
                      key={user.id}
                      className="compact-user-item"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.05, x: -5 }}
                    >
                      <span className="compact-user-avatar">{user.avatar}</span>
                      <div className="compact-user-info">
                        <span className="compact-user-name">{user.name}</span>
                        <span className={`compact-user-status compact-user-status-${user.status}`}>
                          {user.status}
                        </span>
    </div>
                      <motion.div
                        className="compact-user-indicator"
                        animate={{ 
                          backgroundColor: user.status === 'online' ? '#10B981' : '#F59E0B',
                          scale: user.status === 'online' ? [1, 1.2, 1] : 1
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Quick Actions - Only show in editor mode */}
      <AnimatePresence>
        {!showFileManager && !isFocusMode && (
          <motion.div 
            className="compact-quick-actions"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
          >
            <motion.button
              className="compact-quick-action-btn"
              onClick={() => setShowComments(!showComments)}
              whileHover={{ scale: 1.2, rotate: 360 }}
              whileTap={{ scale: 0.8 }}
              title="Comments"
            >
              💬
            </motion.button>
            <motion.button
              className="compact-quick-action-btn"
              onClick={handleShare}
              whileHover={{ scale: 1.2, rotate: 360 }}
              whileTap={{ scale: 0.8 }}
              title="Share"
            >
              📤
            </motion.button>
            <motion.button
              className="compact-quick-action-btn"
              onClick={handleBookmark}
              whileHover={{ scale: 1.2, rotate: 360 }}
              whileTap={{ scale: 0.8 }}
              title="Bookmark"
            >
              🔖
            </motion.button>
            <motion.button
              className="compact-quick-action-btn"
              onClick={handleFavorite}
              whileHover={{ scale: 1.2, rotate: 360 }}
              whileTap={{ scale: 0.8 }}
              title="Favorite"
            >
              ⭐
            </motion.button>
            <motion.button
              className="compact-quick-action-btn"
              onClick={() => setShowSettings(!showSettings)}
              whileHover={{ scale: 1.2, rotate: 360 }}
              whileTap={{ scale: 0.8 }}
              title="Settings"
            >
              ⚙️
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FileCollaboration; 