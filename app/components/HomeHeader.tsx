"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  heroBackgroundUrl: string;
}

const Header: React.FC<HeaderProps> = ({ heroBackgroundUrl }) => {
  const router = useRouter();
    const handleOptionClick = (path: string) => {
    router.push(path);
  };
  return (
    <div 
      className="relative h-[600px] w-full bg-cover bg-center"
      style={{ backgroundImage: `url(${heroBackgroundUrl})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#080810] via-[#08081099] to-transparent">
        <div className="container mx-auto px-8 py-16">
          <nav className="flex items-center justify-between mb-16">
            <div className="text-2xl font-bold text-white flex items-center gap-2">
              <i className="fas fa-cube text-[#00F0FF]"></i>
              <span>NeoBank</span>
            </div>
            <div className="flex items-center gap-8">
              {['Features', 'Security', 'Support', 'About'].map((item) => (
                <button key={item} className="text-white hover:text-[#00F0FF] transition-colors cursor-pointer whitespace-nowrap !rounded-button">
                  {item}
                </button>
              ))}
              <button 
               onClick={() => handleOptionClick('/Login')}
              className="bg-[#00F0FF] text-black px-6 py-2 font-semibold hover:bg-[#32FFBD] transition-colors cursor-pointer whitespace-nowrap !rounded-button">
                Sign In
              </button>
            </div>
          </nav>

          <div className="max-w-2xl">
            <h1 className="text-6xl font-bold mb-6 leading-tight">
              Banking Reimagined for the Digital Age
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Experience the future of finance with AI-powered insights, seamless transactions, and unparalleled security.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleOptionClick('/Login')}
              className="bg-[#BA01FF] px-8 py-3 font-semibold hover:bg-[#32FFBD] transition-colors cursor-pointer whitespace-nowrap !rounded-button">
                Get Started
              </button>
              <button className="border-2 border-[#00F0FF] px-8 py-3 font-semibold hover:bg-[#00F0FF] hover:text-black transition-all cursor-pointer whitespace-nowrap !rounded-button">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;