import { useEffect, useState, useRef, useContext } from 'react';
import socket from '../socket';
import api from '../utils/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import FileCollaboration from './FileCollaboration';
import { motion, AnimatePresence } from 'framer-motion';
import './ChatRoom.css';

function ChatRoom() {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFileCollaboration, setShowFileCollaboration] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showReactions, setShowReactions] = useState({});
  const [messageReactions, setMessageReactions] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  
  const channel = 'general';
  const chatBoxRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Emoji reactions
  const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '💯', ''];

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('userJoined', (userData) => {
      setOnlineUsers(prev => [...prev.filter(u => u._id !== userData._id), userData]);
      addSystemMessage(`${userData.name} joined the chat`, 'join');
    });

    socket.on('userLeft', (userData) => {
      setOnlineUsers(prev => prev.filter(u => u._id !== userData._id));
      addSystemMessage(`${userData.name} left the chat`, 'leave');
    });

    socket.on('typingStart', (userData) => {
      setTypingUsers(prev => [...prev.filter(u => u._id !== userData._id), userData]);
    });

    socket.on('typingStop', (userData) => {
      setTypingUsers(prev => prev.filter(u => u._id !== userData._id));
    });

    socket.on('reactionAdded', ({ messageId, reaction, userData }) => {
      setMessageReactions(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          [reaction]: [...(prev[messageId]?.[reaction] || []), userData]
        }
      }));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('typingStart');
      socket.off('typingStop');
      socket.off('reactionAdded');
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    socket.emit('joinRoom', { room: channel, user });
    socket.on('receiveMessage', (msg) => {
      console.log('Received message:', msg);
      setMessages((prev) => [...prev, msg]);
      setMessageCount(prev => prev + 1);
      
      // Auto-scroll with smooth animation
      setTimeout(() => {
        if (chatBoxRef.current) {
          chatBoxRef.current.scrollTo({
            top: chatBoxRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    });
    return () => socket.off('receiveMessage');
  }, [channel, user]);

  useEffect(() => {
    setLoading(true);
    api.get(`/messages/${channel}`)
      .then((res) => {
        setMessages(res.data);
        setMessageCount(res.data.length);
      })
      .catch(() => setError('Failed to load messages'))
      .finally(() => setLoading(false));
  }, [channel]);

  const addSystemMessage = (text, type) => {
    const systemMsg = {
      _id: Date.now(),
      text,
      type,
      timestamp: new Date(),
      isSystem: true
    };
    setMessages(prev => [...prev, systemMsg]);
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typingStart', { room: channel, user });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typingStop', { room: channel, user });
    }, 1000);
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const messageData = {
        sender: user._id,
        channel,
        text: `Shared a file: ${selectedFile.name}`,
        fileUrl: res.data.file,
        timestamp: new Date(),
      };
      socket.emit('sendMessage', { room: channel, messageData });
    } catch (err) {
      setError('File upload failed');
    }
  };

  const sendMessage = () => {
    if (!text.trim()) return;
    
    const messageData = {
      sender: user._id,
      channel,
      text,
      timestamp: new Date(),
    };
    socket.emit('sendMessage', { room: channel, messageData });
    setText('');
    setIsTyping(false);
    socket.emit('typingStop', { room: channel, user });
  };

  const addReaction = (messageId, reaction) => {
    socket.emit('addReaction', { room: channel, messageId, reaction, user });
    setShowReactions(prev => ({ ...prev, [messageId]: false }));
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return messageTime.toLocaleDateString();
  };

  if (loading) return (
    <motion.div 
      className="chat-room loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="loading-spinner"></div>
      <p>Loading chat...</p>
    </motion.div>
  );
  
  if (error) return (
    <motion.div 
      className="chat-room error"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {error}
    </motion.div>
  );

  const isViewer = user && user.role === 'viewer';

  if (showFileCollaboration) {
    return (
      <FileCollaboration 
        room={channel}
        onClose={() => setShowFileCollaboration(false)}
      />
    );
  }

  return (
    <motion.div 
      className="chat-room"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Interactive Header */}
      <motion.div 
        className="chat-header"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="header-content">
          <div className="channel-info">
            <motion.h2
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              💬 #{channel}
            </motion.h2>
            <div className="connection-status">
              <motion.div 
                className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}
                animate={{ 
                  scale: isConnected ? [1, 1.2, 1] : 1,
                  opacity: isConnected ? [0.5, 1, 0.5] : 0.3
                }}
                transition={{ duration: 2, repeat: Infinity }}
              ></motion.div>
              <span>{isConnected ? 'Live' : 'Offline'}</span>
            </div>
          </div>
          
          <div className="chat-actions">
            <motion.button 
              className="online-users-btn"
              onClick={() => setShowOnlineUsers(!showOnlineUsers)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              👥 {onlineUsers.length}
            </motion.button>
            
            <motion.button 
              className="file-collab-btn"
              onClick={() => setShowFileCollaboration(true)}
              disabled={isViewer}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              📁 Files
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Online Users Sidebar */}
      <AnimatePresence>
        {showOnlineUsers && (
          <motion.div 
            className="online-users-sidebar"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
          >
            <h3>Online Users ({onlineUsers.length})</h3>
            {onlineUsers.map(user => (
              <motion.div 
                key={user._id} 
                className="online-user"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="user-avatar">{user.name[0].toUpperCase()}</div>
                <span>{user.name}</span>
                <div className="user-status online"></div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Chat Box */}
      <div className={`chat-box ${showOnlineUsers ? 'with-sidebar' : ''}`} ref={chatBoxRef}>
        <AnimatePresence>
          {messages.map((msg, index) => {
            const isOwn = msg.sender?._id === user._id || msg.sender === user._id;
            const isSystem = msg.isSystem;
            
            return (
              <motion.div
                key={msg._id || index}
                className={`chat-message ${isOwn ? 'own-message' : ''} ${isSystem ? 'system-message' : ''}`}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.3,
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ scale: 1.02 }}
                layout
              >
                {!isSystem && (
                  <motion.div 
                    className="chat-avatar"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    animate={{ 
                      scale: [1, 1.05, 1],
                      rotate: [0, 2, -2, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
                  >
                    {msg.sender?.name ? msg.sender.name[0].toUpperCase() : '?'}
                  </motion.div>
                )}
                
                <div className="chat-message-content">
                  {!isSystem && (
                    <div className="chat-message-header">
                      <span className="chat-sender">
                        {isOwn ? 'You' : msg.sender?.name || 'User'}
                      </span>
                      <span className="chat-timestamp">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  )}
                  
                  <div className="chat-text">
                    {isSystem ? (
                      <motion.div 
                        className="system-message-text"
                        animate={{ 
                          background: ['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.1)']
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {msg.text}
                      </motion.div>
                    ) : (
                      msg.text
                    )}
                  </div>
                  
                  {msg.fileUrl && (
                    <motion.div 
                      className="chat-file"
                      whileHover={{ scale: 1.05 }}
                    >
                      <a href={`http://localhost:5000/${msg.fileUrl}`} target="_blank" rel="noopener noreferrer">
                        📎 View Attachment
                      </a>
                    </motion.div>
                  )}

                  {/* Message Reactions */}
                  {messageReactions[msg._id] && (
                    <div className="message-reactions">
                      {Object.entries(messageReactions[msg._id]).map(([reaction, users]) => (
                        <motion.div 
                          key={reaction}
                          className="reaction-badge"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          whileHover={{ scale: 1.2 }}
                        >
                          <span>{reaction}</span>
                          <span className="reaction-count">{users.length}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Reaction Button */}
                  {!isSystem && (
                    <motion.button
                      className="reaction-btn"
                      onClick={() => setShowReactions(prev => ({ ...prev, [msg._id]: !prev[msg._id] }))}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      😊
                    </motion.button>
                  )}
                </div>

                {/* Reaction Picker */}
                <AnimatePresence>
                  {showReactions[msg._id] && (
                    <motion.div 
                      className="reaction-picker"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      {emojis.map((emoji, idx) => (
                        <motion.button
                          key={emoji}
                          onClick={() => addReaction(msg._id, emoji)}
                          whileHover={{ scale: 1.3 }}
                          whileTap={{ scale: 0.8 }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          {emoji}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div 
              className="typing-indicator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="typing-avatar">?</div>
              <div className="typing-content">
                <span className="typing-text">
                  {typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing
                </span>
                <div className="typing-dots">
                  <motion.div 
                    className="dot"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  ></motion.div>
                  <motion.div 
                    className="dot"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  ></motion.div>
                  <motion.div 
                    className="dot"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  ></motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Enhanced Input Area */}
      <motion.div 
        className="chat-input-wrap"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button 
          className="attach-btn"
          onClick={() => fileInputRef.current.click()} 
          disabled={isViewer}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
        >
          📎
        </motion.button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        <motion.button
          className="emoji-btn"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          😊
        </motion.button>
        
        <motion.input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => !isViewer && e.key === 'Enter' && sendMessage()}
          placeholder={isViewer ? 'View-only: You cannot send messages.' : 'Type your message...'}
          disabled={isViewer}
          whileFocus={{ scale: 1.02 }}
        />
        
        <motion.button 
          onClick={sendMessage} 
          disabled={isViewer}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="send-btn"
        >
          <motion.span
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            Send
          </motion.span>
        </motion.button>
      </motion.div>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div 
            className="emoji-picker"
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
          >
            {emojis.map((emoji, idx) => (
              <motion.button
                key={emoji}
                onClick={() => {
                  setText(prev => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.8 }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Counter */}
      <motion.div 
        className="message-counter"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.span
          key={messageCount}
          initial={{ scale: 1.5, color: '#10B981' }}
          animate={{ scale: 1, color: '#6B7280' }}
          transition={{ duration: 0.5 }}
        >
          {messageCount} messages
        </motion.span>
      </motion.div>

      {isViewer && (
        <motion.div 
          className="chat-readonly-note"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          You have view-only access to chat.
        </motion.div>
      )}
    </motion.div>
  );
}

export default ChatRoom;
