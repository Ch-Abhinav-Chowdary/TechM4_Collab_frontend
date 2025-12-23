import React, { useState, useEffect, useRef } from 'react';
import './GamificationGuide.css';

const GamificationGuide = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showInteractiveDemo, setShowInteractiveDemo] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [userXP, setUserXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [completedActions, setCompletedActions] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const confettiRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    if (showConfetti) {
      triggerConfetti();
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [showConfetti]);

  useEffect(() => {
    if (showLevelUp) {
      setTimeout(() => setShowLevelUp(false), 2000);
    }
  }, [showLevelUp]);

  const triggerConfetti = () => {
    if (confettiRef.current) {
      const canvas = confettiRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const confetti = [];
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
      
      for (let i = 0; i < 80; i++) {
        confetti.push({
          x: Math.random() * canvas.width,
          y: -10,
          vx: (Math.random() - 0.5) * 6,
          vy: Math.random() * 2 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 3,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 8
        });
      }
      
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        confetti.forEach((piece, index) => {
          piece.x += piece.vx;
          piece.y += piece.vy;
          piece.rotation += piece.rotationSpeed;
          
          ctx.save();
          ctx.translate(piece.x, piece.y);
          ctx.rotate(piece.rotation * Math.PI / 180);
          ctx.fillStyle = piece.color;
          ctx.fillRect(-piece.size/2, -piece.size/2, piece.size, piece.size);
          ctx.restore();
          
          if (piece.y > canvas.height) {
            confetti.splice(index, 1);
          }
        });
        
        if (confetti.length > 0) {
          requestAnimationFrame(animate);
        }
      };
      
      animate();
    }
  };

  const steps = [
    {
      title: "Welcome to Your Journey!",
      content: "Discover how gamification makes collaboration fun and rewarding",
      icon: "🌟",
      color: "var(--primary-600)"
    },
    {
      title: "Earn XP Through Actions",
      content: "Every action you take earns you Experience Points",
      icon: "⭐",
      color: "var(--success-600)"
    },
    {
      title: "Level Up & Unlock Perks",
      content: "Reach new levels and unlock special features",
      icon: "🏆",
      color: "var(--warning-600)"
    },
    {
      title: "Collect Badges & Achievements",
      content: "Complete challenges and earn unique badges",
      icon: "🎖️",
      color: "var(--info-600)"
    }
  ];

  const actions = [
    { name: "Daily Login", xp: 5, icon: "📅", description: "Start your day right" },
    { name: "Send Message", xp: 1, icon: "💬", description: "Connect with team" },
    { name: "Complete Task", xp: 20, icon: "✅", description: "Major milestone" },
    { name: "Upload File", xp: 3, icon: "📁", description: "Share knowledge" },
    { name: "Help Colleague", xp: 10, icon: "🤝", description: "Team support" },
    { name: "Create Workflow", xp: 15, icon: "🔄", description: "Process improvement" }
  ];

  const badges = [
    { id: 'first-login', name: 'First Steps', icon: '👋', description: 'Welcome aboard!', requirement: 'Complete registration' },
    { id: 'task-master', name: 'Task Master', icon: '🎯', description: 'Completed your first task', requirement: 'Complete 1 task' },
    { id: 'streak-7', name: 'Week Warrior', icon: '🔥', description: '7-day login streak', requirement: 'Login for 7 consecutive days' },
    { id: 'streak-30', name: 'Monthly Master', icon: '⚡', description: '30-day login streak', requirement: 'Login for 30 consecutive days' },
    { id: 'team-player', name: 'Team Player', icon: '👥', description: 'Great collaboration', requirement: 'Send 50 messages' },
    { id: 'speed-demon', name: 'Speed Demon', icon: '🏃', description: 'Quick task completion', requirement: 'Complete 5 tasks in a day' },
    { id: 'quality-master', name: 'Quality Master', icon: '⭐', description: 'Excellence in work', requirement: 'Complete 10 tasks without rejection' },
    { id: 'collaborator', name: 'Collaborator', icon: '🤝', description: 'Team collaboration expert', requirement: 'Work on 5 shared files' },
    { id: 'innovator', name: 'Innovator', icon: '💡', description: 'Creative problem solver', requirement: 'Create 3 workflows' },
    { id: 'mentor', name: 'Mentor', icon: '🎓', description: 'Help others grow', requirement: 'Help 10 colleagues' }
  ];

  const handleActionClick = (action) => {
    if (!completedActions.includes(action.name)) {
      setUserXP(prev => prev + action.xp);
      setCompletedActions(prev => [...prev, action.name]);
      
      // Check for level up
      const newLevel = Math.floor((userXP + action.xp) / 100) + 1;
      if (newLevel > userLevel) {
        setUserLevel(newLevel);
        setShowLevelUp(true);
        setShowConfetti(true);
      }
    }
  };

  const handleBadgeClick = (badge) => {
    setSelectedBadge(badge);
    setShowBadgeModal(true);
  };

  const startInteractiveDemo = () => {
    setShowInteractiveDemo(true);
    setUserXP(0);
    setUserLevel(1);
    setCompletedActions([]);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="gamification-guide">
      <canvas 
        ref={confettiRef} 
        className={`confetti-canvas ${showConfetti ? 'active' : ''}`}
      />
      
      <div className="guide-container">
        {/* Interactive Onboarding */}
        <div className="onboarding-section">
          <div className="step-indicator">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`step-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                onClick={() => setCurrentStep(index)}
              >
                {index < currentStep ? '✓' : index + 1}
              </div>
            ))}
          </div>
          
          <div className="step-content">
            <div className="step-icon" style={{ color: steps[currentStep].color }}>
              {steps[currentStep].icon}
            </div>
            <h1>{steps[currentStep].title}</h1>
            <p>{steps[currentStep].content}</p>
            
            <div className="step-navigation">
              <button 
                className="nav-btn"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                ← Previous
              </button>
              <button 
                className="nav-btn primary"
                onClick={nextStep}
                disabled={currentStep === steps.length - 1}
              >
                {currentStep === steps.length - 1 ? 'Start Journey!' : 'Next →'}
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Demo Section */}
        <div className="demo-section">
          <div className="demo-header">
            <h2>🎮 Interactive Experience</h2>
            <p>Try out the gamification system yourself!</p>
            <button 
              className="start-demo-btn"
              onClick={startInteractiveDemo}
            >
              🚀 Start Interactive Demo
            </button>
          </div>

          {showInteractiveDemo && (
            <div className="demo-content">
              <div className="user-progress">
                <div className="progress-card">
                  <div className="progress-header">
                    <h3>Your Progress</h3>
                    <span className="level-badge">Level {userLevel}</span>
                  </div>
                  <div className="xp-bar">
                    <div 
                      className="xp-fill"
                      style={{ width: `${((userXP % 100) / 100) * 100}%` }}
                    ></div>
                  </div>
                  <div className="xp-info">
                    <span>{userXP} XP</span>
                    <span>{100 - (userXP % 100)} XP to next level</span>
                  </div>
                </div>
                
                {showLevelUp && (
                  <div className="level-up-notification">
                    <span className="level-up-icon">🎉</span>
                    <span>Level Up! You're now Level {userLevel}</span>
                  </div>
                )}
              </div>

              <div className="actions-grid">
                <h3>Try These Actions</h3>
                <div className="actions-container">
                  {actions.map((action, index) => (
                    <button
                      key={index}
                      className={`action-btn ${completedActions.includes(action.name) ? 'completed' : ''}`}
                      onClick={() => handleActionClick(action)}
                      disabled={completedActions.includes(action.name)}
                    >
                      <span className="action-icon">{action.icon}</span>
                      <div className="action-info">
                        <span className="action-name">{action.name}</span>
                        <span className="action-desc">{action.description}</span>
                      </div>
                      <span className="action-xp">+{action.xp} XP</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Badges Gallery */}
        <div className="badges-section">
          <h2>🎖️ Badge Collection</h2>
          <p>Complete challenges to unlock these amazing badges</p>
          
          <div className="badges-grid">
            {badges.map((badge, index) => (
              <div 
                key={index}
                className="badge-card"
                onClick={() => handleBadgeClick(badge)}
              >
                <div className="badge-icon">{badge.icon}</div>
                <div className="badge-info">
                  <h4>{badge.name}</h4>
                  <p>{badge.description}</p>
                  <span className="badge-requirement">{badge.requirement}</span>
                </div>
                <div className="badge-status">
                  <span className="status-indicator">🔒</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips & Strategies */}
        <div className="tips-section">
          <h2>💡 Pro Tips</h2>
          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-icon">📅</div>
              <h4>Daily Routine</h4>
              <p>Log in daily to maintain your streak and earn consistent XP</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">🎯</div>
              <h4>Set Goals</h4>
              <p>Focus on completing tasks to earn the most XP quickly</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">🤝</div>
              <h4>Collaborate</h4>
              <p>Help your teammates to earn bonus XP and unlock team badges</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">🔥</div>
              <h4>Maintain Streaks</h4>
              <p>Don't break your login streak - it's worth more than you think!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Badge Modal */}
      {showBadgeModal && selectedBadge && (
        <div className="modal-overlay" onClick={() => setShowBadgeModal(false)}>
          <div className="badge-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="badge-preview">
                <span className="badge-icon-large">{selectedBadge.icon}</span>
              </div>
              <button className="close-btn" onClick={() => setShowBadgeModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-content">
              <h3>{selectedBadge.name}</h3>
              <p className="badge-description">{selectedBadge.description}</p>
              <div className="requirement-box">
                <h4>How to Earn:</h4>
                <p>{selectedBadge.requirement}</p>
              </div>
              <div className="badge-rewards">
                <h4>Rewards:</h4>
                <ul>
                  <li>🏆 Recognition in your profile</li>
                  <li>⭐ Special status indicator</li>
                  <li>🎉 Unlock exclusive features</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamificationGuide; 