import React, { useState, useEffect, useRef } from 'react';

// Define message type
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

interface ChatbotWidgetProps {
  onClose: () => void;
}

// Main component
const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your AI assistant. How can I help you today?", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('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');
  const [apiKeySet, setApiKeySet] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Initial greeting messages in different languages
  const greetings: { [key: string]: string } = {
    'en': "Hello! I'm your AI assistant. How can I help you today?",
    'hi': "नमस्ते! मैं आपका AI सहायक हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ?",
    'bn': "হ্যালো! আমি আপনার AI সহায়ক। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
    'te': "హలో! నేను మీ AI సహాయకుడిని. నేను మీకు ఎలా సహాయం చేయగలను?",
    'ta': "வணக்கம்! நான் உங்கள் AI உதவியாளர். இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?",
    'kn': "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ AI ಸಹಾಯಕ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    'ml': "ഹലോ! ഞാൻ നിങ്ങളുടെ AI സഹായി ആണ്. ഇന്ന് എനിക്ക് നിങ്ങളെ എങ്ങനെ സഹായിക്കാൻ കഴിയും?",
    'gu': "નમસ્તે! હું તમારો AI સહાયક છું. આજે હું તમને કેવી રીતે મદદ કરી શકું છું?",
    'mr': "नमस्कार! मी आपला AI सहाय्यक आहे. आज मी आपल्याला कशी मदत करू शकतो?",
    'pa': "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ AI ਸਹਾਇਕ ਹਾਂ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update initial greeting based on browser language
  useEffect(() => {
    const userLanguage = navigator.language.split('-')[0];
    const greeting = greetings[userLanguage] || greetings['en'];
    
    setMessages([
      { 
        role: 'assistant', 
        content: greeting, 
        timestamp: Date.now() 
      }
    ]);
  }, []);

  // Close chat when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmitApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      setApiKeySet(true);
    }
  };

  // Function to detect language of text
  const detectLanguage = (text: string): string => {
    // Simple language detection based on script characteristics
    // This is a basic implementation - for production use, consider using a proper language detection library
    
    // Devanagari (Hindi, Marathi)
    if (/[\u0900-\u097F]/.test(text)) return 'hi';
    
    // Bengali
    if (/[\u0980-\u09FF]/.test(text)) return 'bn';
    
    // Telugu
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
    
    // Tamil
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
    
    // Kannada
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
    
    // Malayalam
    if (/[\u0D00-\u0D7F]/.test(text)) return 'ml';
    
    // Gujarati
    if (/[\u0A80-\u0AFF]/.test(text)) return 'gu';
    
    // Punjabi (Gurmukhi)
    if (/[\u0A00-\u0A7F]/.test(text)) return 'pa';
    
    // Default to English
    return 'en';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Detect language of user input
      const detectedLanguage = detectLanguage(input);
      
      // API call logic here
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
            {
              role: userMessage.role,
              content: userMessage.content,
            },
            // Add system message to instruct the model to respond in the detected language
            {
              role: 'system',
              content: `Respond in the same language as the user's query. The detected language is ${detectedLanguage}.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling API:', error);
      
      // Detect language of user input to provide error message in the same language
      const detectedLanguage = detectLanguage(input);
      let errorMessage = 'Sorry, there was an error processing your request. Please check your API key and try again.';
      
      if (detectedLanguage === 'hi') {
        errorMessage = 'क्षमा करें, आपके अनुरोध को संसाधित करने में एक त्रुटि हुई। कृपया अपनी API कुंजी जांचें और पुनः प्रयास करें।';
      } else if (detectedLanguage === 'bn') {
        errorMessage = 'দুঃখিত, আপনার অনুরোধ প্রক্রিয়া করতে একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আপনার API কী চেক করুন এবং আবার চেষ্টা করুন।';
      } else if (detectedLanguage === 'te') {
        errorMessage = 'క్షమించండి, మీ అభ్యర్థనను ప్రాసెస్ చేయడంలో లోపం జరిగింది. దయచేసి మీ API కీని తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.';
      } else if (detectedLanguage === 'ta') {
        errorMessage = 'மன்னிக்கவும், உங்கள் கோரிக்கையை செயலாக்குவதில் பிழை ஏற்பட்டது. உங்கள் API விசையைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.';
      } else if (detectedLanguage === 'kn') {
        errorMessage = 'ಕ್ಷಮಿಸಿ, ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸುವಲ್ಲಿ ದೋಷ ಉಂಟಾಗಿದೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ API ಕೀಯನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.';
      } else if (detectedLanguage === 'ml') {
        errorMessage = 'ക്ഷമിക്കണം, നിങ്ങളുടെ അഭ്യർത്ഥന പ്രോസസ്സ് ചെയ്യുന്നതിൽ ഒരു പിശക് ഉണ്ടായിരുന്നു. നിങ്ങളുടെ API കീ പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.';
      } else if (detectedLanguage === 'gu') {
        errorMessage = 'માફ કરશો, તમારી વિનંતી પર પ્રક્રિયા કરવામાં ભૂલ આવી. કૃપા કરીને તમારી API કી તપાસો અને ફરી પ્રયાસ કરો.';
      } else if (detectedLanguage === 'mr') {
        errorMessage = 'क्षमस्व, आपल्या विनंतीवर प्रक्रिया करताना त्रुटी आली. कृपया आपली API की तपासा आणि पुन्हा प्रयत्न करा.';
      } else if (detectedLanguage === 'pa') {
        errorMessage = 'ਮੁਆਫ ਕਰਨਾ, ਤੁਹਾਡੀ ਬੇਨਤੀ ਤੇ ਕਾਰਵਾਈ ਕਰਨ ਵਿੱਚ ਇੱਕ ਗਲਤੀ ਹੋਈ ਸੀ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ API ਕੁੰਜੀ ਦੀ ਜਾਂਚ ਕਰੋ ਅਤੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ';
      }
      
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: errorMessage,
          timestamp: Date.now()
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
    ref={chatRef}
    className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 backdrop-blur-lg bg-gray-900/60 border border-white/20"
    style={{
      animation: "fadeIn 0.5s ease-out forwards",
      boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
    }}
  >
    {!apiKeySet ? (
      <div className="flex items-center justify-center w-full h-full p-4">
        <div className="backdrop-blur-md bg-gray-800/70 p-6 rounded-xl shadow-xl border border-white/20 w-full max-w-md transform transition-all duration-300 hover:scale-105">
          <div className="mb-4 flex justify-center">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center transform transition-all duration-500 hover:rotate-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse">Enter API Key</h2>
          <form onSubmit={handleSubmitApiKey}>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-3 bg-gray-900/70 border border-white/20 rounded-lg mb-4 text-white text-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
              placeholder="API key..."
            />
            <button
              type="submit"
              className="w-full p-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-all focus:outline-none text-md hover:shadow-lg hover:shadow-purple-500/30 transform hover:-translate-y-1"
            >
              Start Chatting
            </button>
          </form>
        </div>
      </div>
    ) : (
      <>
        {/* Header */}
        <div className="bg-gray-800/70 p-4 border-b border-white/20 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mr-3 transform transition-all duration-300 hover:rotate-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">AI Assistant</h1>
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-400 mr-2 animate-pulse"></div>
                <span className="text-gray-300 text-sm">Online</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700/50"
            aria-label="Close chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-900/30 backdrop-blur-sm">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{
                animation: "slideIn 0.3s ease-out forwards",
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-2 self-end shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
              )}
              <div
                className={`px-4 py-3 rounded-2xl max-w-[80%] text-md ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-none shadow-lg shadow-purple-500/30 transform transition-all duration-300 hover:-translate-y-1'
                    : 'bg-gray-800/70 text-gray-100 rounded-bl-none border border-white/20 backdrop-blur-md shadow-lg transform transition-all duration-300 hover:-translate-y-1'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center ml-2 self-end shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4" style={{ animation: "fadeIn 0.3s ease-out forwards" }}>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-2 self-end shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div className="px-4 py-3 rounded-2xl max-w-[80%] bg-gray-800/70 text-gray-100 rounded-bl-none border border-white/20 backdrop-blur-md shadow-lg">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="bg-gray-800/70 p-4 border-t border-white/20 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-gray-900/70 text-white p-3 text-md rounded-l-lg focus:outline-none border-y border-l border-white/20 transition-all duration-300 focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className={`bg-gradient-to-r from-purple-500 to-blue-500 text-white p-3 rounded-r-lg transition-all duration-300 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-purple-500/30 transform hover:scale-105'
              }`}
              disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </>
    )}
  </div>
  
  );
};

export default ChatbotWidget;