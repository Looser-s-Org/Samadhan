import React from 'react';

const InfoSection: React.FC = () => {
  return (
    <div className="info-section">
      <p>This application uses enhanced face recognition technology with 4x upscaling. For optimal results:</p>
      <ul className="info-list">
        <li>Use a clear, well-lit image for registration</li>
        <li>Ensure your face is fully visible during authentication</li>
        <li>Remove glasses or other accessories that might obstruct facial features</li>
        <li>When multiple failed attempts are detected, a security call will be made to the registered phone number</li>
      </ul>
    </div>
  );
};

export default InfoSection;