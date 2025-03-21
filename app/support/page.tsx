'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MessageSquare } from 'lucide-react';
import '@/app/styles/support.css';

export default function SupportChoicePage() {
  const router = useRouter();
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  const handleOptionClick = (path: string) => {
    router.push(path);
  };

  return (
    <div 
      className="support-container"
      style={{
        backgroundImage: "url('/supportbg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed"
      }}
    >
      <h1 className="support-title">How would you like to contact support?</h1>
      
      <div className="support-options-wrapper">
        {/* Audio Option */}
        <div 
          className={`support-option ${hoveredOption === 'audio' ? 'support-option-hovered' : ''}`}
          onMouseEnter={() => setHoveredOption('audio')}
          onMouseLeave={() => setHoveredOption(null)}
          onClick={() => handleOptionClick('/support/audio')}
        >
          <Mic 
            size={64} 
            className={`option-icon ${hoveredOption === 'audio' ? 'option-icon-hovered' : ''}`} 
          />
          <h2 className="option-title">Audio Support</h2>
          <p className="option-description">Speak with our support team directly through a voice call.</p>
          <button className="option-button">
            Start Voice Call
          </button>
        </div>
  
        {/* Text Option */}
        <div 
          className={`support-option ${hoveredOption === 'text' ? 'support-option-hovered' : ''}`}
          onMouseEnter={() => setHoveredOption('text')}
          onMouseLeave={() => setHoveredOption(null)}
          onClick={() => handleOptionClick('/support/text')}
        >
          <MessageSquare 
            size={64} 
            className={`option-icon ${hoveredOption === 'text' ? 'option-icon-hovered' : ''}`} 
          />
          <h2 className="option-title">Text Support</h2>
          <p className="option-description">Chat with our support team through text messaging.</p>
          <button className="option-button">
            Start Text Chat
          </button>
        </div>
      </div>
    </div>
  );
}