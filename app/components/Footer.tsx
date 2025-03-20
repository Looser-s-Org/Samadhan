import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#ffffff0d] mt-16 py-16">
      <div className="container mx-auto px-8">
        <div className="grid grid-cols-4 gap-8">
          <div>
            <div className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
              <i className="fas fa-cube text-[#00F0FF]"></i>
              <span>NeoBank</span>
            </div>
            <p className="text-gray-400">
              Revolutionizing banking for the digital age with cutting-edge technology and security.
            </p>
          </div>
          {['Products', 'Company', 'Resources', 'Legal'].map((section) => (
            <div key={section}>
              <h3 className="font-semibold mb-6">{section}</h3>
              <ul className="space-y-3">
                {['Features', 'Security', 'Support', 'Contact'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-[#00F0FF] transition-colors cursor-pointer">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;