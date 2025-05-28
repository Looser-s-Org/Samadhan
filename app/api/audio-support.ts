// File: src/app/api/audio-support.ts
import axios from 'axios';

export interface AudioMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
  timestamp: Date;
  language: string;
  transcription?: string;
}

export interface ConversationContext {
  sessionId: string;
  messages: AudioMessage[];
  userLanguage: string;
  detectedIntent?: string;
  customerProfile?: {
    accountType?: string;
    preferredLanguage?: string;
    previousIssues?: string[];
  };
}

export interface AudioAnalysisResponse {
  intent: string;
  category: string;
  priority: string;
  department: string;
  language: string;
  needsHumanAgent: boolean;
  response: string;
  suggestedActions?: string[];
  confidence: number;
}

export interface VoiceResponse {
  success: boolean;
  sessionId: string;
  response: AudioAnalysisResponse;
  audioUrl?: string;
  conversationContext: ConversationContext;
  error?: string;
}

// Language detection and translation utilities - URDU REMOVED
const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'hi': 'Hindi',
  'ar': 'Arabic',
  'bn': 'Bengali',
  'ta': 'Tamil',
  'te': 'Telugu',
  'mr': 'Marathi',
  'gu': 'Gujarati',
  'pa': 'Punjabi',
  'kn': 'Kannada',
  'ml': 'Malayalam',
  'or': 'Odia',
  'as': 'Assamese'
};

// In-memory context storage (in production, use Redis or database)
const conversationContexts = new Map<string, ConversationContext>();

// Function to transcribe audio using Groq's Whisper
async function transcribeAudio(audioBlob: Blob): Promise<{ text: string; detectedLanguage: string }> {
  try {
    const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    
    if (!groqApiKey) {
      throw new Error('Groq API key is not defined');
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-large-v3');
    // Let Whisper detect the language naturally - don't force any language
    formData.append('response_format', 'verbose_json'); // Get detailed response with language info

    const headers = {
      'Authorization': `Bearer ${groqApiKey}`
    };

    const response = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, { headers });
    
    const transcription = response.data.text || '';
    let detectedLanguage = response.data.language || 'en';
    
    // Convert Urdu to Hindi (only if explicitly detected as Urdu)
    if (detectedLanguage === 'ur' || detectedLanguage === 'urdu') {
      detectedLanguage = 'hi';
    }
    
    console.log('Whisper detected language:', detectedLanguage);
    console.log('Transcription:', transcription);
    
    return {
      text: transcription,
      detectedLanguage: detectedLanguage
    };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error('Failed to transcribe audio');
  }
}

// Improved language detection function - more precise patterns
function detectLanguageFromText(text: string): string {
  // If text is predominantly English characters, it's English
  const englishPattern = /^[a-zA-Z0-9\s.,!?'"()-]+$/;
  if (englishPattern.test(text.trim())) {
    return 'en';
  }
  
  // Count characters for each script to determine dominant language
  const scriptCounts = {
    hindi: (text.match(/[\u0900-\u097F]/g) || []).length,
    arabic: (text.match(/[\u0600-\u06FF]/g) || []).length,
    bengali: (text.match(/[\u0980-\u09FF]/g) || []).length,
    tamil: (text.match(/[\u0B80-\u0BFF]/g) || []).length,
    telugu: (text.match(/[\u0C00-\u0C7F]/g) || []).length,
    gujarati: (text.match(/[\u0A80-\u0AFF]/g) || []).length,
    punjabi: (text.match(/[\u0A00-\u0A7F]/g) || []).length,
    kannada: (text.match(/[\u0C80-\u0CFF]/g) || []).length,
    malayalam: (text.match(/[\u0D00-\u0D7F]/g) || []).length,
    odia: (text.match(/[\u0B00-\u0B7F]/g) || []).length
  };

  // Find the script with the highest count
  const maxScript = Object.entries(scriptCounts).reduce((a, b) => 
    scriptCounts[a[0] as keyof typeof scriptCounts] > scriptCounts[b[0] as keyof typeof scriptCounts] ? a : b
  );

  // If no significant script detected, default to English
  if (maxScript[1] === 0) {
    return 'en';
  }

  // Map script names to language codes
  const scriptToLang: { [key: string]: string } = {
    'hindi': 'hi',
    'arabic': 'ar',
    'bengali': 'bn',
    'tamil': 'ta',
    'telugu': 'te',
    'gujarati': 'gu',
    'punjabi': 'pa',
    'kannada': 'kn',
    'malayalam': 'ml',
    'odia': 'or'
  };

  return scriptToLang[maxScript[0]] || 'en';
}

// Function to sanitize language input - converts Urdu to Hindi
function sanitizeLanguage(language: string): string {
  if (language === 'ur' || language === 'urdu' || language.toLowerCase().includes('urdu')) {
    return 'hi'; // Convert Urdu to Hindi
  }
  return language;
}

// Function to analyze audio query using Groq with context
async function analyzeAudioQuery(
  transcription: string, 
  language: string, 
  context: ConversationContext
): Promise<AudioAnalysisResponse> {
  try {
    const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    
    if (!groqApiKey) {
      throw new Error('Groq API key is not defined');
    }
    
    // Sanitize language to prevent Urdu
    const sanitizedLanguage = sanitizeLanguage(language);
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${groqApiKey}`
    };

    // Build conversation history for context
    const conversationHistory = context.messages
      .slice(-10) // Last 10 messages for context
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const languageName = SUPPORTED_LANGUAGES[sanitizedLanguage as keyof typeof SUPPORTED_LANGUAGES] || 'English';

    const systemPrompt = `You are an advanced AI banking assistant with multilingual capabilities for Indian languages. You can help customers with:

BANKING SERVICES:
- Account inquiries (balance, statements, transaction history)
- Card services (block/unblock, PIN reset, new card requests)
- Loan information (personal, home, car loans, eligibility)
- Investment guidance (FDs, mutual funds, insurance)
- Payment services (UPI, NEFT, RTGS, bill payments)
- Complaint resolution and fraud reporting
- Account opening and KYC assistance

CONVERSATION CONTEXT:
${conversationHistory}

CRITICAL LANGUAGE INSTRUCTIONS:
- The user is speaking in: ${languageName} (${sanitizedLanguage})
- You MUST respond ONLY in ${languageName}
- NEVER use Urdu language in any response
- If you detect Urdu script or language, respond in Hindi instead
- Maintain the EXACT same language as the customer throughout the conversation
- Do not switch languages unless the customer explicitly switches

INSTRUCTIONS:
- Use conversation history to maintain context
- Be helpful, professional, and empathetic
- For complex issues requiring human intervention, set needsHumanAgent to true
- Provide actionable solutions and next steps
- Use natural, conversational language in ${languageName}
- Remember previous interactions in this session

RESPONSE FORMAT: Respond ONLY with a JSON object:
{
  "intent": "balance_inquiry|card_services|loan_info|investment|payments|complaints|account_services|general_inquiry",
  "category": "Account|Card|Loan|Investment|Payment|Complaint|Service|General",
  "priority": "High|Medium|Low",
  "department": "Retail_Banking|Cards|Loans|Investments|Customer_Service|Fraud_Prevention",
  "language": "${sanitizedLanguage}",
  "needsHumanAgent": true/false,
  "response": "Detailed helpful response in ${languageName} ONLY",
  "suggestedActions": ["action1", "action2"],
  "confidence": 0.95
}`;

    const data = {
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Customer Query in ${languageName}: ${transcription}
          
          IMPORTANT: 
          - Respond ONLY in ${languageName} (${sanitizedLanguage})
          - Do NOT respond in Urdu
          - Match the customer's language exactly`
        }
      ],
      temperature: 0.3,
      max_tokens: 3000
    };
    
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', data, { headers });
    
    const contentString = response.data.choices?.[0]?.message?.content || '';
    const jsonMatch = contentString.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON response from Groq');
    }
    
    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    // Ensure language consistency
    parsedResponse.language = sanitizedLanguage;
    
    return parsedResponse;
  } catch (error) {
    console.error('Error analyzing audio query:', error);
    throw error;
  }
}

// Function to convert text to speech using a TTS service
async function generateSpeech(text: string, language: string): Promise<string> {
  try {
    // Using a simple TTS API (you can replace with your preferred service)
    const ttsApiKey = process.env.NEXT_PUBLIC_TTS_API_KEY;
    
    if (!ttsApiKey) {
      console.warn('TTS API key not found, returning text response');
      return '';
    }

    // Sanitize language for TTS
    const sanitizedLanguage = sanitizeLanguage(language);

    // Map language codes to TTS voice IDs - NO URDU VOICES
    const voiceMap: { [key: string]: string } = {
      'en': 'en-US-Standard-J',
      'hi': 'hi-IN-Standard-A',
      'ar': 'ar-XA-Standard-A',
      'bn': 'bn-IN-Standard-A',
      'ta': 'ta-IN-Standard-A',
      'te': 'te-IN-Standard-A',
      'mr': 'mr-IN-Standard-A',
      'gu': 'gu-IN-Standard-A',
      'pa': 'pa-IN-Standard-A',
      'kn': 'kn-IN-Standard-A',
      'ml': 'ml-IN-Standard-A'
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ttsApiKey}`
    };

    const data = {
      input: { text },
      voice: {
        languageCode: sanitizedLanguage,
        name: voiceMap[sanitizedLanguage] || voiceMap['en']
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0
      }
    };

    // Replace with actual TTS service endpoint
    const response = await axios.post('https://texttospeech.googleapis.com/v1/text:synthesize', data, { headers });
    
    // Return the audio URL or base64 data
    return response.data.audioContent || '';
  } catch (error) {
    console.error('Error generating speech:', error);
    return '';
  }
}

// Function to save conversation to Google Sheets
async function saveConversationToSheets(context: ConversationContext, analysis: AudioAnalysisResponse): Promise<boolean> {
  try {
    const baseUrl = 'https://script.google.com/macros/s/AKfycbw-CzEZI_vkZnCb84QyoHJEW5_-rKYBwlMIloCBcHDcpjcq2SvycreyJcYGrzjJixhR/exec';
    
    // Sanitize language before saving
    const sanitizedLanguage = sanitizeLanguage(analysis.language);
    
    const params = new URLSearchParams();
    params.append('action', 'put');
    params.append('SessionID', context.sessionId);
    params.append('CustomerID', `VOICE-${context.sessionId}`);
    params.append('Name', 'Voice Customer');
    params.append('Channel', 'Voice');
    params.append('Subject', analysis.intent);
    params.append('Query', context.messages[context.messages.length - 1]?.content || '');
    params.append('Solution', analysis.response);
    params.append('Solveable', analysis.needsHumanAgent ? 'No' : 'Yes');
    params.append('Priority', analysis.priority);
    params.append('Department', analysis.department);
    params.append('Language', sanitizedLanguage);
    params.append('Phone', 'Voice Channel');
    params.append('Confidence', analysis.confidence.toString());
    
    const fullUrl = `${baseUrl}?${params.toString()}`;
    const response = await axios.get(fullUrl);
    
    const responseText = response.data;
    return typeof responseText === 'string' && (
      responseText.includes("success") || 
      responseText.includes("Success") || 
      responseText.includes("Data added") || 
      responseText.includes("Updated")
    );
  } catch (error) {
    console.error('Error saving conversation to sheets:', error);
    return false;
  }
}

// Function to get or create conversation context
function getOrCreateContext(sessionId?: string, language?: string): ConversationContext {
  const id = sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Sanitize language
  const sanitizedLanguage = sanitizeLanguage(language || 'en');
  
  if (conversationContexts.has(id)) {
    const context = conversationContexts.get(id)!;
    // Update language if provided, but sanitize it
    if (language) {
      context.userLanguage = sanitizedLanguage;
    }
    return context;
  }
  
  const newContext: ConversationContext = {
    sessionId: id,
    messages: [],
    userLanguage: sanitizedLanguage,
    customerProfile: {}
  };
  
  conversationContexts.set(id, newContext);
  return newContext;
}

// Main function to process audio queries
export async function processAudioQuery(
  audioBlob: Blob,
  sessionId?: string
): Promise<VoiceResponse> {
  try {
    // Step 1: Transcribe audio without forcing language
    const { text: transcription, detectedLanguage: audioLang } = await transcribeAudio(audioBlob);
    
    if (!transcription.trim()) {
      throw new Error('No speech detected in audio');
    }

    console.log('Transcription:', transcription);
    console.log('Audio detected language:', audioLang);

    // Step 2: Use Whisper's detected language first, then fallback to text analysis
    let finalLanguage = audioLang;
    
    // If Whisper didn't detect properly or detected English but text has other scripts
    if (!finalLanguage || finalLanguage === 'en') {
      const textDetectedLang = detectLanguageFromText(transcription);
      if (textDetectedLang !== 'en') {
        finalLanguage = textDetectedLang;
      }
    }
    
    // Sanitize to remove Urdu
    finalLanguage = sanitizeLanguage(finalLanguage);
    
    console.log('Final detected language:', finalLanguage);
    
    // Step 3: Get or create conversation context
    const context = getOrCreateContext(sessionId, finalLanguage);
    
    // Step 4: Add user message to context
    const userMessage: AudioMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: transcription,
      timestamp: new Date(),
      language: finalLanguage,
      transcription: transcription
    };
    context.messages.push(userMessage);
    
    // Step 5: Analyze the query with context
    const analysis = await analyzeAudioQuery(transcription, finalLanguage, context);
    
    // Step 6: Add assistant response to context
    const assistantMessage: AudioMessage = {
      id: `msg-${Date.now()}-resp`,
      role: 'assistant',
      content: analysis.response,
      timestamp: new Date(),
      language: sanitizeLanguage(analysis.language)
    };
    context.messages.push(assistantMessage);
    
    // Step 7: Generate speech response (optional)
    let audioUrl = '';
    try {
      audioUrl = await generateSpeech(analysis.response, sanitizeLanguage(analysis.language));
    } catch (speechError) {
      console.warn('Speech generation failed:', speechError);
    }
    
    // Step 8: Save conversation to sheets
    await saveConversationToSheets(context, analysis);
    
    // Step 9: Update context in memory
    conversationContexts.set(context.sessionId, context);
    
    return {
      success: true,
      sessionId: context.sessionId,
      response: {
        ...analysis,
        language: sanitizeLanguage(analysis.language)
      },
      audioUrl,
      conversationContext: context
    };
  } catch (error) {
    console.error('Error processing audio query:', error);
    return {
      success: false,
      sessionId: sessionId || '',
      response: {
        intent: 'error',
        category: 'Error',
        priority: 'High',
        department: 'Customer_Service',
        language: 'en',
        needsHumanAgent: true,
        response: 'I apologize, but I encountered an error processing your request. Please try again or contact our customer service.',
        confidence: 0.0
      },
      conversationContext: getOrCreateContext(sessionId),
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Function to clear conversation context (for privacy)
export function clearConversationContext(sessionId: string): boolean {
  return conversationContexts.delete(sessionId);
}

// Function to get conversation history
export function getConversationHistory(sessionId: string): AudioMessage[] {
  const context = conversationContexts.get(sessionId);
  return context?.messages || [];
}

// Function to update user language preference
export function updateUserLanguage(sessionId: string, language: string): boolean {
  const context = conversationContexts.get(sessionId);
  if (context) {
    // Sanitize the language before updating
    context.userLanguage = sanitizeLanguage(language);
    conversationContexts.set(sessionId, context);
    return true;
  }
  return false;
}