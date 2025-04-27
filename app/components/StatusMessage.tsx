// components/StatusMessage.tsx
import React from 'react';

interface StatusMessageProps {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export const StatusMessage: React.FC<StatusMessageProps> = ({ message, type }) => {
  return (
    <div id="status" className={`status-message status-${type}`}>
      {message}
    </div>
  );
};