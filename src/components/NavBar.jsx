import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  HiHome, HiClipboardList, HiLightningBolt, HiStar, HiBookOpen,
  HiCog, HiChartBar, HiRefresh, HiUsers, HiUser, HiLogout,
  HiMenu, HiX, HiChevronLeft, HiChevronRight
} from 'react-icons/hi';
import { 
  FiHome, FiClipboard, FiZap, FiAward, FiBook,
  FiSettings, FiBarChart2, FiRefreshCw, FiUsers, FiUser
} from 'react-icons/fi';
import './NavBar.css';

const NavBar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: HiHome, iconOutline: FiHome },
    { path: '/tasks', label: 'Tasks', icon: HiClipboardList, iconOutline: FiClipboard },
    { path: '/activities', label: 'Activity', icon: HiLightningBolt, iconOutline: FiZap },
    { path: '/leaderboard', label: 'Leaderboard', icon: HiStar, iconOutline: FiAward },
    { path: '/guide', label: 'Guide', icon: HiBookOpen, iconOutline: FiBook },
    ...(user?.role === 'admin' ? [
      { path: '/analytics', label: 'Analytics', icon: HiChartBar, iconOutline: FiBarChart2 },
      { path: '/admin/workflows', label: 'Workflows', icon: HiRefresh, iconOutline: FiRefreshCw },
      { path: '/admin/employees', label: 'Employees', icon: HiUsers, iconOutline: FiUsers }
    ] : []),
    { path: '/profile', label: 'Profile', icon: HiUser, iconOutline: FiUser }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      const newCollapsedState = !isCollapsed;
      setIsCollapsed(newCollapsedState);
      // Dispatch custom event to notify App component
      window.dispatchEvent(new CustomEvent('sidebarToggle', { 
        detail: { isCollapsed: newCollapsedState } 
      }));
    }
  };

  const getRoleClass = (role) => {
    return `role-${role || 'default'}`;
  };

  // Build sidebar class names
  const sidebarClasses = [
    'sidebar',
    isCollapsed && !isMobile ? 'collapsed' : '',
    isMobile && !isMobileOpen ? 'mobile-hidden' : '',
    isMobile && isMobileOpen ? 'mobile-open' : ''
  ].filter(Boolean).join(' ');

  const overlayClasses = [
    'sidebar-overlay',
    (!isMobile || !isMobileOpen) ? 'hidden' : ''
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="mobile-menu-btn"
      >
        {isMobileOpen ? <HiX /> : <HiMenu />}
      </button>

      {/* Overlay */}
      <div 
        className={overlayClasses}
        onClick={() => setIsMobileOpen(false)} 
      />

      {/* Sidebar */}
      <aside className={sidebarClasses}>
        {/* Header */}
        <div className="sidebar-header">
          {!isCollapsed && (
            <Link to="/" className="sidebar-logo">
              <div className="sidebar-logo-icon">
                <HiHome />
              </div>
              <span className="sidebar-logo-text">TechM4India</span>
            </Link>
          )}
          {isCollapsed && !isMobile && (
            <Link to="/" className="sidebar-logo">
              <div className="sidebar-logo-icon">
                <HiHome />
              </div>
            </Link>
          )}
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              className="sidebar-toggle-btn"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <HiChevronRight /> : <HiChevronLeft />}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = active ? item.icon : item.iconOutline;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-nav-item ${active ? 'active' : ''}`}
                onClick={() => isMobile && setIsMobileOpen(false)}
              >
                {active && <div className="sidebar-nav-item-indicator" />}
                <div className="sidebar-nav-item-icon">
                  <Icon />
                </div>
                <span className="sidebar-nav-item-label">{item.label}</span>
                <div className="sidebar-nav-item-tooltip">{item.label}</div>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="sidebar-user-section">
          <div className="sidebar-user-card">
            <div className="sidebar-user-info">
              <div className={`sidebar-user-avatar ${getRoleClass(user?.role)}`}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="sidebar-user-details">
                <span className="sidebar-user-name">{user?.name}</span>
                <span className="sidebar-user-role">{user?.role}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="sidebar-logout-btn"
            >
              <HiLogout style={{ fontSize: '18px' }} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default NavBar;
