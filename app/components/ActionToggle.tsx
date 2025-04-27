// components/ActionToggle.tsx
import React from 'react';

interface ActionToggleProps {
  showAuthentication: boolean;
  setShowAuthentication: (show: boolean) => void;
  registeredUsername: string | null;
  startVideo: () => void;
  updateStatus: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const ActionToggle: React.FC<ActionToggleProps> = ({
  showAuthentication,
  setShowAuthentication,
  registeredUsername,
  startVideo,
  updateStatus
}) => {
  return (
    <div className="action-buttons">
      <div className={`toggle-container ${showAuthentication ? 'authenticate-active' : ''}`}>
        <button 
          onClick={() => setShowAuthentication(false)}
          className={`register-button ${!showAuthentication ? 'active' : ''}`}
        >
          Register Face
        </button>
        <button 
          onClick={() => {
            if (registeredUsername) {
              setShowAuthentication(true);
              startVideo();
            } else {
              updateStatus('No user registered! Please register first.', 'warning');
            }
          }}
          className={`authenticate-button ${showAuthentication ? 'active' : ''}`}
        >
          Authenticate Face
        </button>
      </div>
    </div>
  );
};