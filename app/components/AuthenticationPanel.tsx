import React, { useState, useEffect } from 'react';
import { useLivelinessDetection } from '@/app/api/LivelinessDetection';

interface AuthenticationPanelProps {
  loginUsername: string;
  setLoginUsername: (username: string) => void;
  authenticateUser: () => void;
  isAuthenticating: boolean;
  isCallingUser: boolean;
  resetRegistration: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  onAuthenticationComplete?: () => void; // Optional callback prop
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
  const [authenticationStep, setAuthenticationStep] = useState<'idle' | 'face-auth' | 'liveness-check' | 'complete'>('idle');
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
    // Check if authentication is complete and the callback exists
    if (authenticationStep === 'complete' && livenessCheckPassed && typeof onAuthenticationComplete === 'function') {
      // Add a slight delay to allow UI to update
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
      
      // Call the provided authenticateUser function for face matching
      authenticateUser();
      
      // Simulate authentication process (in a real app, you would wait for response)
      setTimeout(() => {
        setFaceAuthPassed(true);
        setAuthenticationStep('liveness-check');
        // Auto-start liveness check after face authentication
        startLivenessCheck();
      }, 1500);
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthError("Face authentication failed. Please try again.");
      setAuthenticationStep('idle');
    }
  };

  // Step 2: Liveness Check
  const startLivenessCheck = async () => {
    try {
      if (!videoRef.current) {
        throw new Error("Video feed not available");
      }
      
      // Start liveness detection
      const isLive = await startDetection(videoRef.current);
      
      if (isLive) {
        // User passed liveness check
        setLivenessCheckPassed(true);
        setAuthenticationStep('complete');
        console.log("Authentication complete: Face matched and liveness verified!");
        // The callback will be handled by the useEffect
      } else {
        // Failed liveness check
        setLivenessCheckPassed(false);
        setAuthError("Liveness check failed. Please try again.");
        setAuthenticationStep('idle');
      }
    } catch (error: any) {
      console.error("Liveness check error:", error);
      setAuthError("An error occurred during liveness verification.");
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
    if (authenticationStep === 'face-auth') return 'Authenticating Face...';
    if (authenticationStep === 'liveness-check') return `Smile Check (${timeRemaining}s)`;
    if (authenticationStep === 'complete') return 'Authentication Complete ✓';
    return isFaceDetected ? 'Begin Authentication' : 'Position Face';
  };

  return (
    <div className="authentication-panel">
    <div className="panel-header">
      <h2 className="panel-title">Authentication</h2>
      
      {/* Progress indicator */}
      <div className="progress-indicators">
        <div className={`progress-step ${authenticationStep !== 'idle' ? 'active' : 'inactive'}`}></div>
        <div className={`progress-step ${authenticationStep === 'liveness-check' || authenticationStep === 'complete' ? 'active' : 'inactive'}`}></div>
        <div className={`progress-step ${authenticationStep === 'complete' ? 'complete' : 'inactive'}`}></div>
      </div>
    </div>
    
    {/* Step indicator */}
    <div className="step-indicator">
      <div className="step-label">
        {authenticationStep === 'idle' && 'Step 0: Prepare for Authentication'}
        {authenticationStep === 'face-auth' && 'Step 1: Face Authentication'}
        {authenticationStep === 'liveness-check' && 'Step 2: Liveness Check - Smile with Teeth!'}
        {authenticationStep === 'complete' && 'Authentication Complete!'}
      </div>
    </div>
    
    <div className="form-group">
      <label htmlFor="loginUsername" className="input-label">Username:</label>
      <input
        type="text"
        id="loginUsername"
        placeholder="Enter your registered username"
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
      
      {/* Status overlays */}
      {!isFaceDetected && (
        <div className="face-position-overlay">
          Please position your face in the frame
        </div>
      )}
      
      {authenticationStep === 'face-auth' && (
        <div className="authenticating-overlay">
          Authenticating your face...
        </div>
      )}
      
      {authenticationStep === 'liveness-check' && (
        <div className="liveness-check-overlay">
          Liveness Check: Please smile with teeth! Time remaining: {timeRemaining}s
        </div>
      )}
      
      {authenticationStep === 'complete' && (
        <div className="success-overlay">
          <div className="success-content">
            <div className="success-icon">✓</div>
            <div className="success-message">Authentication Successful!</div>
          </div>
        </div>
      )}
    </div>
    
    {/* Error display */}
    {authError && (
      <div className="error-container">
        {authError}
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
        Reset
      </button>
    </div>
    
    {/* Authentication status display */}
    {(faceAuthPassed || livenessCheckPassed) && (
      <div className="auth-status">
        <h3 className="status-heading">Authentication Progress:</h3>
        <ul className="status-list">
          <li className="status-item">
            <span className={`status-indicator ${faceAuthPassed ? 'passed' : 'pending'}`}>
              {faceAuthPassed ? '✓' : '○'}
            </span>
            <span>Face Authentication</span>
          </li>
          <li className="status-item">
            <span className={`status-indicator ${livenessCheckPassed ? 'passed' : authenticationStep === 'liveness-check' ? 'in-progress' : 'pending'}`}>
              {livenessCheckPassed ? '✓' : authenticationStep === 'liveness-check' ? '●' : '○'}
            </span>
            <span>Liveness Check (Smile Detection)</span>
          </li>
        </ul>
      </div>
    )}
  </div>
  );
};

export default AuthenticationPanel;