import { Routes, Route, useLocation } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import TaskBoard from './components/TaskBoard';
import './App.css';
import UserProfile from './components/UserProfile';
import AdminDashboard from './components/AdminDashboard';
import MemberDashboard from './components/MemberDashboard';
import Leaderboard from './components/Leaderboard';
import NavBar from './components/NavBar';
import PageHeader from './components/PageHeader';
import { AuthContext } from './context/AuthContext';
import GamificationGuide from './components/GamificationGuide';
import WorkflowManager from './components/WorkflowManager';
import { AnimatePresence, motion} from 'framer-motion';
import TaskAnalytics from './components/TaskAnalytics';
import ActivityFeed from './components/ActivityFeed';
import EmployeeMonitor from './components/EmployeeMonitor';

function App() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    const handleSidebarToggle = (event) => {
      setSidebarCollapsed(event.detail.isCollapsed);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('sidebarToggle', handleSidebarToggle);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('sidebarToggle', handleSidebarToggle);
    };
  }, []);

  // Check if current route requires auth
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  
  // Calculate sidebar width based on state
  const getSidebarWidth = () => {
    if (!user || isAuthPage) return 0;
    if (isMobile) return 0;
    return sidebarCollapsed ? 80 : 280;
  };

  return (
    <div className="app">
      {/* Sidebar - only show when user is logged in and not on auth pages */}
      {user && !isAuthPage && <NavBar />}
      
      {/* Main Wrapper for Content and Footer */}
      <div 
        className="app-main-wrapper"
        style={{
          marginLeft: `${getSidebarWidth()}px`,
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          width: `calc(100% - ${getSidebarWidth()}px)`
        }}
      >
        {/* Main Content */}
        <main className="main-content">
          {/* Page Header with Logo - only show when user is logged in */}
          {user && !isAuthPage && (
            <PageHeader subtitle="Collaboration Platform" />
          )}
          
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Routes location={location} key={location.pathname}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes */}
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/tasks" element={<ProtectedRoute><TaskBoard /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                <Route path="/activities" element={<ProtectedRoute role="admin"><ActivityFeed /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute role="admin"><TaskAnalytics /></ProtectedRoute>} />
                <Route path="/admin/workflows" element={<ProtectedRoute role="admin"><WorkflowManager /></ProtectedRoute>} />
                <Route path="/admin/employees" element={<ProtectedRoute role="admin"><EmployeeMonitor /></ProtectedRoute>} />
                <Route path="/member" element={<ProtectedRoute role="member"><MemberDashboard /></ProtectedRoute>} />
                <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                <Route path="/guide" element={<ProtectedRoute><GamificationGuide /></ProtectedRoute>} />

                <Route path="*" element={<div>404 Not Found</div>} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer - only show when user is logged in */}
        {user && !isAuthPage && (
          <footer className="footer">
            © {new Date().getFullYear()} TechM4India. All rights reserved.
          </footer>
        )}
      </div>
    </div>
  );
}

export default App;