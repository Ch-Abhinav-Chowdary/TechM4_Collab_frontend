import { io } from 'socket.io-client';

// Use the same backend URL as the API, but without /api suffix
// If VITE_API_URL is set, extract the base URL (remove /api if present)
// Otherwise use VITE_SOCKET_URL or fallback to the Render backend
const getBackendURL = () => {
  // Priority 1: Use VITE_API_URL and remove /api suffix
  if (import.meta.env.VITE_API_URL) {
    const apiUrl = import.meta.env.VITE_API_URL;
    const baseUrl = apiUrl.replace('/api', '').replace(/\/$/, ''); // Remove /api and trailing slash
    console.log('🔌 Socket connecting to:', baseUrl, '(from VITE_API_URL)');
    return baseUrl;
  }
  
  // Priority 2: Use VITE_SOCKET_URL if explicitly set
  if (import.meta.env.VITE_SOCKET_URL) {
    const socketUrl = import.meta.env.VITE_SOCKET_URL;
    console.log('🔌 Socket connecting to:', socketUrl, '(from VITE_SOCKET_URL)');
    return socketUrl;
  }
  
  // Priority 3: Default to Render backend
  const defaultUrl = 'https://techm4-collab-backend-1.onrender.com';
  console.log('🔌 Socket connecting to:', defaultUrl, '(default fallback)');
  return defaultUrl;
};

const backendURL = getBackendURL();

// Ensure we never use the old wrong URL
if (backendURL.includes('realtimecollaborationtool.vercel.app')) {
  console.error('❌ ERROR: Detected wrong backend URL! Using fallback.');
  const fallbackUrl = 'https://techm4-collab-backend-1.onrender.com';
  console.log('🔌 Socket connecting to:', fallbackUrl, '(fallback due to wrong URL detected)');
  var socket = io(fallbackUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });
} else {
  var socket = io(backendURL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });
}

// Log connection events for debugging
socket.on('connect', () => {
  console.log('✅ Socket.IO connected to:', backendURL, 'Socket ID:', socket.id);
  
  // Get user from localStorage and notify server
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      if (user.id || user._id) {
        socket.emit('userConnected', { userId: user.id || user._id });
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
  }
});

socket.on('connect_error', (error) => {
  console.error('❌ Socket.IO connection error:', error.message);
  console.error('🔍 Attempted URL:', backendURL);
});

socket.on('disconnect', (reason) => {
  console.warn('⚠️ Socket.IO disconnected:', reason);
});

export default socket;
