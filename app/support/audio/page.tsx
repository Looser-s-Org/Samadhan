"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { processAudioQuery, AudioMessage, VoiceResponse } from '@/app/api/audio-support';
import '@/app/styles/audio.css'; // Ensure you have the correct path to your CSS file

// Add missing properties to the Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

interface AudioQuerySolverProps {
  onResponse?: (response: VoiceResponse) => void;
}

const AudioQuerySolver: React.FC<AudioQuerySolverProps> = ({ onResponse }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<AudioMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [liveTranscription, setLiveTranscription] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  // Add this type declaration above your component or at the top of the file
  type SpeechRecognitionType = typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition;
  
  // Use the correct type for the ref
  const recognitionRef = useRef<InstanceType<SpeechRecognitionType> | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize audio context for visualization
  useEffect(() => {
    const initAudioContext = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
      } catch (error) {
        console.warn('Audio context initialization failed:', error);
      }
    };
    initAudioContext();

    // Initialize speech recognition
    initSpeechRecognition();
  }, []);

  // Function to sanitize language input - converts Urdu to Hindi
  const sanitizeLanguage = (language: string): string => {
    if (language === 'ur' || language === 'urdu' || language.toLowerCase().includes('urdu')) {
      return 'hi'; // Convert Urdu to Hindi
    }
    return language;
  };

  const initSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US'; // You can make this dynamic based on user preference
      
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update live transcription with interim results
        const fullTranscript = finalTranscript + interimTranscript;
        if (fullTranscript.trim()) {
          setLiveTranscription(fullTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setCurrentTranscription('Microphone permission denied');
        } else if (event.error === 'no-speech') {
          // This is normal, don't show error
          console.log('No speech detected');
        }
      };
      
      recognitionRef.current.onend = () => {
        // Speech recognition ended
        if (isListening) {
          // Restart if we're still supposed to be listening
          try {
            recognitionRef.current?.start();
          } catch (error) {
            console.warn('Failed to restart speech recognition:', error);
          }
        }
      };
      
      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
      };
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
  };

  // Audio level visualization
  const updateAudioLevel = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
    setAudioLevel(average / 255);
    
    if (isListening) {
      requestAnimationFrame(updateAudioLevel);
    }
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      // Connect to audio context for visualization
      if (audioContextRef.current && analyserRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        updateAudioLevel();
      }

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        
        if (audioBlob.size > 0) {
          await processAudioInput(audioBlob);
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsListening(true);
      setCurrentTranscription('Listening...');
      setLiveTranscription('');
      
      // Start speech recognition for live transcription
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.warn('Failed to start speech recognition:', error);
        }
      }
      
    } catch (error) {
      console.error('Error starting audio recording:', error);
      alert('Microphone access denied or not available');
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    setIsListening(false);
    setAudioLevel(0);
    setCurrentTranscription('Processing...');
    
    // Keep the final transcription visible briefly
    setTimeout(() => {
      setLiveTranscription('');
    }, 1000);
  };

  const processAudioInput = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setCurrentTranscription('');
    
    try {
      const response = await processAudioQuery(audioBlob, sessionId);
      
      if (response.success) {
        setSessionId(response.sessionId);
        setMessages(response.conversationContext.messages);
        
        // Play audio response if available
        if (response.audioUrl) {
          playAudioResponse(response.audioUrl);
        } else {
          // Fallback to text-to-speech with sanitized language
          const sanitizedLang = sanitizeLanguage(response.response.language);
          speakText(response.response.response, sanitizedLang);
        }
        
        onResponse?.(response);
      } else {
        console.error('Audio processing failed:', response.error);
        addErrorMessage('Sorry, I couldn\'t process your audio. Please try again.');
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      addErrorMessage('An error occurred while processing your request.');
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudioResponse = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    setIsSpeaking(true);
    
    audio.onended = () => setIsSpeaking(false);
    audio.onerror = () => {
      setIsSpeaking(false);
      console.error('Audio playback failed');
    };
    
    audio.play().catch(console.error);
  };

  const speakText = (text: string, language: string) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      speechSynthesis.cancel();
      
      // Sanitize language before using
      const sanitizedLang = sanitizeLanguage(language);
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getVoiceLanguage(sanitizedLang);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      speechSynthesisRef.current = utterance;
      speechSynthesis.speak(utterance);
    }
  };

  const getVoiceLanguage = (lang: string): string => {
    // Sanitize language input first
    const sanitizedLang = sanitizeLanguage(lang);
    
    const langMap: { [key: string]: string } = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'ar': 'ar-SA',
      'bn': 'bn-IN',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'mr': 'mr-IN',
      'gu': 'gu-IN',
      'pa': 'pa-IN',
      'kn': 'kn-IN',
      'ml': 'ml-IN',
      'or': 'or-IN',
      'as': 'as-IN'
    };
    return langMap[sanitizedLang] || 'en-US';
  };

  const addErrorMessage = (error: string) => {
    const errorMessage: AudioMessage = {
      id: `error-${Date.now()}`,
      role: 'assistant',
      content: error,
      timestamp: new Date(),
      language: 'en'
    };
    setMessages(prev => [...prev, errorMessage]);
  };

  const toggleSpeech = () => {
    if (isSpeaking && speechSynthesisRef.current) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setSessionId('');
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setLiveTranscription('');
  };

  return (
    <div className="audio-query-container">
      <div className="audio-card">
        <div className="header">
          <div className="header-content">
            <h1 className="title">Voice Banking Assistant</h1>
            <p className="subtitle">Speak naturally in your preferred language</p>
          </div>
          <div className="header-actions">
            <button 
              className="icon-button"
              onClick={toggleSpeech}
              disabled={!isSpeaking}
            >
              {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button 
              className="icon-button"
              onClick={clearConversation}
              disabled={isListening || isProcessing}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="chat-container">
          <div className="messages-area">
            {messages.length === 0 && !isProcessing && (
              <div className="welcome-message">
                <div className="welcome-icon">🎤</div>
                <h3>Hi! I'm your AI Banking Assistant</h3>
                <p>Tap the microphone and speak to me about:</p>
                <ul>
                  <li>Account balance and transactions</li>
                  <li>Card services and payments</li>
                  <li>Loan information and applications</li>
                  <li>Investment guidance</li>
                  <li>General banking queries</li>
                </ul>
              </div>
            )}

            {messages.map((message, index) => (
              <div 
                key={message.id}
                className={`message ${message.role}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="message-content">
                  <div className="message-text">{message.content}</div>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="message assistant">
                <div className="message-content">
                  <div className="loading-shimmer">
                    <div className="shimmer-line"></div>
                    <div className="shimmer-line short"></div>
                    <div className="shimmer-line medium"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Live Transcription Display */}
            {liveTranscription && isListening && (
              <div className="message user live-transcription">
                <div className="message-content">
                  <div className="message-text">
                    {liveTranscription}
                    <span className="transcription-cursor">|</span>
                  </div>
                  <div className="message-time">Speaking...</div>
                </div>
              </div>
            )}

            {currentTranscription && (
              <div className="transcription-indicator">
                {currentTranscription}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="audio-controls">
          <div className="mic-container">
            <button
              className={`mic-button ${isListening ? 'listening' : ''} ${isProcessing ? 'processing' : ''}`}
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
            >
              <div className="mic-icon">
                {isListening ? <MicOff size={32} /> : <Mic size={32} />}
              </div>
              
              {isListening && (
                <div 
                  className="audio-level-ring"
                  style={{ 
                    transform: `scale(${1 + audioLevel * 0.5})`,
                    opacity: audioLevel * 0.8 + 0.2
                  }}
                />
              )}
              
              <div className="ripple-animation" />
            </button>
            
            <div className="mic-label">
              {isListening 
                ? 'Listening...' 
                : isProcessing 
                  ? 'Processing...' 
                  : 'Tap to speak'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioQuerySolver;