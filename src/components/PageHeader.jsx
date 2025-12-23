import React from 'react';
import { HiStar } from 'react-icons/hi';
import './PageHeader.css';

const PageHeader = ({ title, subtitle }) => {
  return (
    <div className="page-header">
      <div className="page-header-brand">
        <div className="page-header-logo">
          <HiStar />
        </div>
        <div className="page-header-info">
          <h1 className="page-header-title">TechM4India</h1>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
      </div>
      {title && (
        <div className="page-header-section">
          <h2 className="page-header-section-title">{title}</h2>
        </div>
      )}
    </div>
  );
};

export default PageHeader;

