import React, { useState, useEffect } from 'react';
import { useLivelinessDetection } from '@/app/api/LivelinessDetection';

interface AuthenticationPanelProps {
  loginUsername: string;
  setLoginUsername: (username: string) => void;
  authenticateUser: () => Promise<boolean>;
  isAuthenticating: boolean;
  isCallingUser: boolean;
  resetRegistration: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  onAuthenticationComplete?: () => void;
}

const AuthenticationPanel: React.FC<AuthenticationPanelProps> = ({
  loginUsername,
  setLoginUsername,
  authenticateUser,
  isAuthenticating,
  isCallingUser,
  resetRegistration,
  videoRef,
  onAuthenticationComplete
}) => {
  const [authenticationStep, setAuthenticationStep] = useState<'idle' | 'face-auth' | 'face-complete' | 'liveness-check' | 'complete'>('idle');
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [faceAuthPassed, setFaceAuthPassed] = useState(false);
  const [livenessCheckPassed, setLivenessCheckPassed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize liveness detection hook
  const { 
    isDetecting, 
    timeRemaining, 
    startDetection, 
    stopDetection 
  } = useLivelinessDetection({
    timeLimit: 7,
    marThreshold: 0.3,
    detectionInterval: 200,
    requiredFrames: 2,
    smileConfidence: 0.6
  });

  // Add face detection without drawing bounding box
  useEffect(() => {
    if (!videoRef.current) return;
    
    const checkFace = async () => {
      if (typeof (window as any).faceapi === 'undefined') return;
      
      const faceapi = (window as any).faceapi;
      const video = videoRef.current;
      
      if (video.paused || video.ended || !video.srcObject) return;
      
      // Detect face in current frame without drawing
      const detectOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
      const result = await faceapi.detectSingleFace(video, detectOptions).withFaceLandmarks();
      
      setIsFaceDetected(!!result);
    };
    
    const interval = setInterval(checkFace, 200);
    return () => clearInterval(interval);
  }, [videoRef]);

  // Effect to handle authentication completion
  useEffect(() => {
    if (authenticationStep === 'complete' && livenessCheckPassed && typeof onAuthenticationComplete === 'function') {
      const timer = setTimeout(() => {
        onAuthenticationComplete();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [authenticationStep, livenessCheckPassed, onAuthenticationComplete]);

  // Step 1: Face Authentication
  const startFaceAuthentication = async () => {
    try {
      setAuthError(null);
      setAuthenticationStep('face-auth');
      
      const faceAuthenticated = await authenticateUser();
      
      if (faceAuthenticated) {
        setFaceAuthPassed(true);
        setAuthenticationStep('face-complete');
        setTimeout(() => {
          setAuthenticationStep('liveness-check');
          startLivenessCheck();
        }, 1500);
      } else {
        setFaceAuthPassed(false);
        setAuthError("Facial identity mismatch. Your face doesn't match our records.");
        setAuthenticationStep('idle');
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthError("Facial authentication failed. Please recalibrate and try again.");
      setAuthenticationStep('idle');
    }
  };

  // Step 2: Liveness Check
  const startLivenessCheck = async () => {
    try {
      if (!videoRef.current) {
        throw new Error("Video feed not available");
      }
      
      const isLive = await startDetection(videoRef.current);
      
      if (isLive) {
        setLivenessCheckPassed(true);
        setAuthenticationStep('complete');
        console.log("Authentication complete: Face matched and liveness verified!");
      } else {
        setLivenessCheckPassed(false);
        setAuthError("Liveness verification protocol failed. Please attempt recalibration.");
        setAuthenticationStep('idle');
      }
    } catch (error: any) {
      console.error("Liveness check error:", error);
      setAuthError("Quantum encryption verification error. System recalibration required.");
      setAuthenticationStep('idle');
    }
  };

  // Reset all states
  const handleReset = () => {
    setAuthenticationStep('idle');
    setFaceAuthPassed(false);
    setLivenessCheckPassed(false);
    setAuthError(null);
    stopDetection();
    resetRegistration();
  };

  // Get appropriate button text based on the current state
  const getButtonText = () => {
    if (authenticationStep === 'face-auth') return 'Scanning Facial Patterns...';
    if (authenticationStep === 'face-complete') return 'Identity Verified ✓';
    if (authenticationStep === 'liveness-check') return `Smile Detection Protocol (${timeRemaining}s)`;
    if (authenticationStep === 'complete') return 'Facial Authentication Complete ✓';
    return isFaceDetected ? 'Initiate Facial Scan' : 'Position Face in Facial Scanner';
  };

  return (
    <div className="authentication-panel">
      <div className="panel-header">
        <h2 className="panel-title">AI Facial Authentication</h2>
        
        {/* Progress indicator */}
        <div className="progress-indicators">
          <div className={`progress-step ${authenticationStep !== 'idle' ? 'active' : 'inactive'}`}>
            <span className="step-number">1</span>
          </div>
          <div className="progress-connector"></div>
          <div className={`progress-step ${authenticationStep === 'face-complete' || authenticationStep === 'liveness-check' || authenticationStep === 'complete' ? 'active' : 'inactive'}`}>
            <span className="step-number">2</span>
          </div>
          <div className="progress-connector"></div>
          <div className={`progress-step ${authenticationStep === 'complete' ? 'complete' : 'inactive'}`}>
            <span className="step-number">✓</span>
          </div>
        </div>
      </div>
      
      {/* Dynamic security message */}
      <div className="security-message">
        <div className="lock-icon"></div>
        <p>Your Identity is Protected by Our Advanced Vault™</p>
      </div>
      
      {/* Step indicator */}
      <div className="step-indicator">
        <div className="step-label">
          {authenticationStep === 'idle' && 'Initiate Facial Authentication Protocol'}
          {authenticationStep === 'face-auth' && 'Protocol 1:  Facial Recognition in Progress'}
          {authenticationStep === 'face-complete' && 'Protocol 1:  Facial Recognition Verified ✓'}
          {authenticationStep === 'liveness-check' && 'Protocol 2: Liveness Verification - Smile Authentication Required'}
          {authenticationStep === 'complete' && 'Facial Authentication Successful! ✓'}
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="loginUsername" className="input-label">Face ID:</label>
        <input
          type="text"
          id="loginUsername"
          placeholder="Enter your registered Facial ID"
          value={loginUsername}
          onChange={(e) => setLoginUsername(e.target.value)}
          className="text-input"
          disabled={authenticationStep !== 'idle'}
        />
      </div>
      
      <div className="video-container">
        <video
          id="video"
          width="640"
          height="480"
          autoPlay
          muted
          ref={videoRef}
          className="video-element"
        />
        
        {/* Animated detection box */}
        {isFaceDetected && (
          <div className={`detection-box ${
            authenticationStep === 'face-auth' ? 'scanning' :
            authenticationStep === 'face-complete' || authenticationStep === 'complete' ? 'success' :
            authenticationStep === 'liveness-check' ? 'liveness' : ''
          }`}></div>
        )}
        
        {/* Dynamic floating holograms */}
        <div className="floating-holograms">
          <div className="hologram hologram-1"></div>
          <div className="hologram hologram-2"></div>
          <div className="hologram hologram-3"></div>
        </div>
        
        {/* Status overlays */}
        {!isFaceDetected && authenticationStep === 'idle' && (
          <div className="face-position-overlay">
            <div className="position-icon"></div>
            <p>Please align facial features with our scanner</p>
          </div>
        )}
        
        {authenticationStep === 'face-auth' && (
          <div className="authenticating-overlay">
            <div className="scanning-animation"></div>
            <div className="overlay-text">
              <span className="typing-text">Scanning Facial Patterns...</span>
            </div>
          </div>
        )}
        
        {authenticationStep === 'face-complete' && (
          <div className="success-overlay step-success">
            <div className="success-content">
              <div className="success-icon">✓</div>
              <div className="success-message">Facial Identity Verified!</div>
              <div className="success-submessage">Proceeding to liveness verification protocol...</div>
            </div>
          </div>
        )}
        
        {authenticationStep === 'liveness-check' && (
          <div className="liveness-check-overlay">
            <div className="overlay-text">Liveness Protocol: Please smile with teeth to verify!</div>
            <div className="timer-container">
              <div className="timer-circle">
                <div className="timer-count">{timeRemaining}</div>
                <svg className="timer-svg" viewBox="0 0 100 100">
                  <circle 
                    className="timer-background" 
                    cx="50" cy="50" r="45"
                  />
                  <circle 
                    className="timer-progress" 
                    cx="50" cy="50" r="45"
                    style={{ 
                      strokeDashoffset: `${(1 - timeRemaining / 7) * 283}` 
                    }}
                  />
                </svg>
              </div>
            </div>
          </div>
        )}
        
        {authenticationStep === 'complete' && (
          <div className="success-overlay">
            <div className="success-content">
              <div className="success-icon">✓</div>
              <div className="success-message">Facial Authentication Complete!</div>
              <div className="success-submessage">Identity verified and secured in Facial Vault™</div>
              <div className="confetti-animation"></div>
            </div>
          </div>
        )}
        
        {/* Dynamic watermark */}
        <div className="security-watermark"></div>
      </div>
      
      {/* Error display */}
      {authError && (
        <div className="error-container">
          <div className="error-icon">!</div>
          <div className="error-message">{authError}</div>
        </div>
      )}
      
      <div className="action-buttons">
        <button
          onClick={startFaceAuthentication}
          disabled={
            !isFaceDetected || 
            authenticationStep !== 'idle' ||
            isAuthenticating || 
            isCallingUser ||
            !loginUsername
          }
          className={`auth-button ${
            isFaceDetected && authenticationStep === 'idle' 
              ? 'active' 
              : authenticationStep === 'complete'
              ? 'complete'
              : 'disabled'
          }`}
        >
          {getButtonText()}
        </button>
        
        <button 
          onClick={handleReset}
          className="reset-button"
          disabled={authenticationStep === 'liveness-check' && isDetecting}
        >
          Reset Facial Scan
        </button>
      </div>
      
      {/* Authentication status display */}
      <div className="auth-status">
        <h3 className="status-heading">Facial Authentication Progress:</h3>
        <ul className="status-list">
          <li className="status-item">
            <span className={`status-indicator ${
              faceAuthPassed ? 'passed' : 
              authenticationStep === 'face-auth' ? 'in-progress' : 
              'pending'
            }`}>
              {faceAuthPassed ? '✓' : authenticationStep === 'face-auth' ? '●' : '○'}
            </span>
            <span className="status-text">Protocol 1: Facial Recognition</span>
            {faceAuthPassed && <span className="status-passed">Verified</span>}
          </li>
          <li className="status-item">
            <span className={`status-indicator ${
              livenessCheckPassed ? 'passed' : 
              authenticationStep === 'liveness-check' ? 'in-progress' : 
              'pending'
            }`}>
              {livenessCheckPassed ? '✓' : authenticationStep === 'liveness-check' ? '●' : '○'}
            </span>
            <span className="status-text">Protocol 2: Facial Liveness Verification</span>
            {livenessCheckPassed && <span className="status-passed">Verified</span>}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AuthenticationPanel;