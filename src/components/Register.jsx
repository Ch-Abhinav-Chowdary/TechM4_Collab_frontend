import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { HiMail, HiLockClosed, HiUser, HiUserGroup, HiSparkles, HiExclamationCircle, HiEye, HiEyeOff, HiArrowRight } from 'react-icons/hi';
import { motion } from 'framer-motion';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔄 Submitting registration form...');
      await register(formData.name, formData.email, formData.password, formData.role);
      
      console.log('✅ Registration successful, navigating to dashboard...');
      navigate('/');
    } catch (err) {
      console.error('❌ Registration error:', err.message);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <motion.div 
        className="register-card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div 
          className="register-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.div 
            className="logo-container"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="logo-icon-bg">
              <HiSparkles className="logo-icon" />
            </div>
            <h1 className="register-title">
              <span className="title-gradient">TechM4India</span>
            </h1>
          </motion.div>
          <p className="register-subtitle">Create your account and start collaborating today</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="register-form">
          {error && (
            <motion.div 
              className="error-alert"
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <HiExclamationCircle className="error-alert-icon" />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="input-group">
            <label htmlFor="name" className="input-label">
              Full Name
            </label>
            <div className="input-container">
              <HiUser className="input-icon" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                className="modern-input"
                disabled={loading}
                autoComplete="name"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="email" className="input-label">
              Email Address
            </label>
            <div className="input-container">
              <HiMail className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                className="modern-input"
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password" className="input-label">
              Password
            </label>
            <div className="input-container password-container">
              <HiLockClosed className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
                className="modern-input"
                disabled={loading}
                minLength="6"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <HiEyeOff /> : <HiEye />}
              </button>
            </div>
            <small className="input-hint">Password must be at least 6 characters long</small>
          </div>

          <div className="input-group">
            <label htmlFor="role" className="input-label">
              Role
            </label>
            <div className="input-container select-container">
              <HiUserGroup className="input-icon" />
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="modern-select"
                disabled={loading}
              >
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <small className="input-hint">Choose your role in the team</small>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            className="register-button"
            whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {loading ? (
              <>
                <div className="button-spinner"></div>
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <HiArrowRight className="button-arrow" />
              </>
            )}
          </motion.button>
        </form>

        <div className="register-footer">
          <p className="footer-text">
            Already have an account?{' '}
            <Link to="/login" className="footer-link">
              Sign in here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
