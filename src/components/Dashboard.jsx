import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import MemberDashboard from './MemberDashboard';
import ViewerDashboard from './ViewerDashboard';
import ActivityFeed from './ActivityFeed';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <div className="dashboard-loading">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'member':
      return <MemberDashboard />;
    case 'viewer':
      return <ViewerDashboard />;
    default:
      return <MemberDashboard />;
  }
};

export default Dashboard;
