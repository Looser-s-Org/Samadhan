'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SupportChoicePage() {
  const router = useRouter();
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  const handleOptionClick = (path: string) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 text-white relative"
      style={{
        backgroundImage: "url('https://static.vecteezy.com/system/resources/previews/023/221/109/non_2x/banking-and-finance-concept-digital-connect-system-financial-and-banking-technology-with-integrated-circles-glowing-line-icons-and-on-blue-background-design-vector.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed"
      }}
    >
      <h1 className="text-3xl md:text-4xl font-bold mb-12 text-center drop-shadow-lg">
        How would you like to contact support?
      </h1>
      
      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8 px-4 justify-center">
        {/* Audio Option */}
        <div
          className={`flex flex-col items-center p-6 md:p-8 rounded-xl cursor-pointer text-center
                     transition-all duration-300 aspect-[3/2] md:aspect-auto md:w-96
                     ${hoveredOption === 'audio' ? 'transform -translate-y-2' : ''}`}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: hoveredOption === 'audio' 
              ? '0 8px 32px rgba(0, 0, 0, 0.5)' 
              : '0 4px 16px rgba(0, 0, 0, 0.3)'
          }}
          onMouseEnter={() => setHoveredOption('audio')}
          onMouseLeave={() => setHoveredOption(null)}
          onClick={() => handleOptionClick('/support/audio')}
        >
          <div className="text-white mb-6 w-16 h-16">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
          </div>
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Audio Support</h2>
          <p className="mb-6 opacity-90 leading-relaxed">
            Speak with our support team directly through a voice call.
          </p>
          <button className="mt-auto bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-full 
                         font-semibold transition-all duration-300 hover:scale-105">
            Start Audio recorder
          </button>
        </div>
        
        {/* Text Option */}
        <div
          className={`flex flex-col items-center p-6 md:p-8 rounded-xl cursor-pointer text-center
                     transition-all duration-300 aspect-[3/2] md:aspect-auto md:w-96
                     ${hoveredOption === 'text' ? 'transform -translate-y-2' : ''}`}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: hoveredOption === 'text' 
              ? '0 8px 32px rgba(0, 0, 0, 0.5)' 
              : '0 4px 16px rgba(0, 0, 0, 0.3)'
          }}
          onMouseEnter={() => setHoveredOption('text')}
          onMouseLeave={() => setHoveredOption(null)}
          onClick={() => handleOptionClick('/support/text')}
        >
          <div className="text-white mb-6 w-16 h-16">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Call Support</h2>
          <p className="mb-6 opacity-90 leading-relaxed">
            Chat with our support team through text messaging.
          </p>
          <button className="mt-auto bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-full 
                         font-semibold transition-all duration-300 hover:scale-105">
            Share Text problem
          </button>
        </div>
      </div>
    </div>
  );
}