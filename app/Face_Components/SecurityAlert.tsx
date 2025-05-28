// components/SecurityAlert.tsx
import React from 'react';

interface SecurityAlertProps {
  failedAttempts: number;
  lastNotificationTime: number;
}

export const SecurityAlert: React.FC<SecurityAlertProps> = ({ failedAttempts, lastNotificationTime }) => {
  return (
    <div className="security-alert">
      <p>Security Alert: {failedAttempts} failed authentication attempt{failedAttempts !== 1 ? 's' : ''} detected.</p>
      {failedAttempts >= 3 && lastNotificationTime > 0 && (
        <p>Account owner has been notified via phone call.</p>
      )}
    </div>
  );
};