// File: src/app/api/text-support.ts
import axios from 'axios'; // Import axios at the top level

export interface SupportRequest {
  name: string;
  email: string;
  phone: string;
  subject: string;
  description: string;
  detectedLanguage?: 'en' | 'hi' | 'ur' | 'ar' | string;
}

export interface GroqAnalysisResponse {
  category: string;
  priority: string;
  department: string;
  language: string;
  solveable: string;
  solution: string;
}

export interface CallSummary {
  conversationSummary: string;
  keyPoints: string[];
  customerSatisfaction: string;
  issueResolved: string;
  followUpRequired: string;
}

export interface SupportResponse {
  success: boolean;
  ticketId: string;
  callId?: string;
  analysis?: GroqAnalysisResponse;
  requestData: SupportRequest;
  error?: string;
}

// Function to analyze support request using Groq
async function analyzeWithGroq(request: SupportRequest): Promise<GroqAnalysisResponse> {
  try {
    const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    
    if (!groqApiKey) {
      throw new Error('Groq API key is not defined');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${groqApiKey}`
    };
    
    const data = {
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content: `You are a professional bank customer support agent. Analyze the customer support request and provide appropriate categorization and solution. 
          For solveable, answer ONLY with "Yes" or "No".
          For priority, answer ONLY with "High", "Medium", or "Low".
          For department, answer ONLY with "Loans", "Scam", "Inquiry", or "Services".
          Always respond in the same language as the customer's query.
          
          Respond ONLY with a JSON object in the following format:
          {
            "category": "Account|Technical|Billing|Product|Other",
            "priority": "High|Medium|Low",
            "department": "Loans|Scam|Inquiry|Services",
            "language": "English|Spanish|French|etc",
            "solveable": "Yes|No",
            "solution": "Clear and concise solution or next steps. make it detailed and easily understandable."
          }`
        },
        {
          role: "user",
          content: `Customer: ${request.name}
          Phone: ${request.phone}
          Subject: ${request.subject}
          Description: ${request.description}`
        }
      ],
      temperature: 0.2,
      max_tokens: 2000
    };
    
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', data, { headers });
    
    // Parse the JSON response from Groq
    const contentString = response.data.choices?.[0]?.message?.content || '';
    const jsonMatch = contentString.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON response from Groq');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error analyzing with Groq:', error);
    throw error;
  }
}

// Function to get call transcript from Bland.ai
async function getCallTranscript(callId: string): Promise<string> {
  try {
    const blandApiKey = process.env.NEXT_PUBLIC_BLAND_AI_API_KEY;
    
    if (!blandApiKey) {
      throw new Error('Bland.ai API key is not defined');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${blandApiKey}`
    };
    
    // Get call details including transcript
    const response = await axios.get(`https://api.bland.ai/v1/calls/${callId}`, { headers });
    
    const callData = response.data;
    
    // Extract transcript from the call data
    if (callData && callData.transcript) {
      return callData.transcript;
    } else if (callData && callData.transcripts && Array.isArray(callData.transcripts)) {
      // Sometimes transcript is an array of transcript objects
      return callData.transcripts.map((t: any) => `${t.speaker}: ${t.text}`).join('\n');
    }
    
    throw new Error('No transcript found in call data');
  } catch (error) {
    console.error('Error getting call transcript:', error);
    throw error;
  }
}

// Function to summarize conversation using Groq
async function summarizeConversation(transcript: string, originalRequest: SupportRequest): Promise<CallSummary> {
  try {
    const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    
    if (!groqApiKey) {
      throw new Error('Groq API key is not defined');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${groqApiKey}`
    };
    
    const data = {
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content: `You are an expert call analyst. Analyze the customer support conversation transcript and provide a comprehensive summary. 
          
          Respond ONLY with a JSON object in the following format:
          {
            "conversationSummary": "A detailed summary of the entire conversation including what the customer said and how the support agent responded",
            "keyPoints": ["List of key points discussed", "Important issues raised", "Solutions provided"],
            "customerSatisfaction": "High|Medium|Low based on customer's tone and responses",
            "issueResolved": "Yes|No|Partially - based on whether the customer's issue was resolved",
            "followUpRequired": "Yes|No - whether additional follow-up is needed"
          }`
        },
        {
          role: "user",
          content: `Original Support Request:
          Customer: ${originalRequest.name}
          Subject: ${originalRequest.subject}
          Description: ${originalRequest.description}
          
          Call Transcript:
          ${transcript}
          
          Please analyze this conversation and provide a comprehensive summary.`
        }
      ],
      temperature: 0.3,
      max_tokens: 3000
    };
    
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', data, { headers });
    
    // Parse the JSON response from Groq
    const contentString = response.data.choices?.[0]?.message?.content || '';
    const jsonMatch = contentString.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON response from Groq');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error summarizing conversation:', error);
    throw error;
  }
}

// Function to monitor call status and get transcript when call ends
async function monitorCallAndSummarize(callId: string, originalRequest: SupportRequest): Promise<void> {
  try {
    const blandApiKey = process.env.NEXT_PUBLIC_BLAND_AI_API_KEY;
    
    if (!blandApiKey) {
      throw new Error('Bland.ai API key is not defined');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${blandApiKey}`
    };
    
    console.log(`🔄 Starting call monitoring for Call ID: ${callId}`);
    
    // Monitor call status every 10 seconds
    const monitorInterval = setInterval(async () => {
      try {
        const response = await axios.get(`https://api.bland.ai/v1/calls/${callId}`, { headers });
        const callData = response.data;
        
        console.log(`📞 Call Status: ${callData.status || 'Unknown'}`);
        
        // Check if call has ended
        if (callData.status === 'completed' || callData.status === 'ended' || callData.status === 'failed') {
          clearInterval(monitorInterval);
          
          console.log(`📞 Call ended with status: ${callData.status}`);
          
          // Wait a bit for transcript to be fully processed
          setTimeout(async () => {
            try {
              // Get the transcript
              const transcript = await getCallTranscript(callId);
              
              if (transcript && transcript.length > 50) { // Only summarize if there's substantial content
                console.log('📝 CALL TRANSCRIPT:');
                console.log('==========================================');
                console.log(transcript);
                console.log('==========================================');
                
                // Summarize the conversation
                const summary = await summarizeConversation(transcript, originalRequest);
                
                console.log('📊 CONVERSATION SUMMARY:');
                console.log('==========================================');
                console.log('📋 Overall Summary:', summary.conversationSummary);
                console.log('🔑 Key Points:', summary.keyPoints);
                console.log('😊 Customer Satisfaction:', summary.customerSatisfaction);
                console.log('✅ Issue Resolved:', summary.issueResolved);
                console.log('📞 Follow-up Required:', summary.followUpRequired);
                console.log('==========================================');
                
              } else {
                console.log('⚠️ No substantial transcript found or call was too short for analysis');
              }
            } catch (error) {
              console.error('❌ Error processing call transcript:', error);
            }
          }, 5000); // Wait 5 seconds after call ends to ensure transcript is ready
        }
      } catch (error) {
        console.error('Error monitoring call:', error);
      }
    }, 10000); // Check every 10 seconds
    
    // Set a maximum monitoring time of 20 minutes
    setTimeout(() => {
      clearInterval(monitorInterval);
      console.log('⏰ Call monitoring timeout reached');
    }, 20 * 60 * 1000);
    
  } catch (error) {
    console.error('Error setting up call monitoring:', error);
  }
}

// Function to save data to Google Sheets via AppScript
async function saveToGoogleSheets(request: SupportRequest, analysis: GroqAnalysisResponse, ticketId: string): Promise<boolean> {
  try {
    const customerId = ticketId;
    
    // Use direct URL with all parameters
    const baseUrl = 'https://script.google.com/macros/s/AKfycbw-CzEZI_vkZnCb84QyoHJEW5_-rKYBwlMIloCBcHDcpjcq2SvycreyJcYGrzjJixhR/exec';
    
    // URL encode all parameters
    const params = new URLSearchParams();
    params.append('action', 'put');
    params.append('CustomerID', customerId);
    params.append('Name', request.name);
    params.append('Channel', 'Form');
    params.append('Subject', request.subject);
    params.append('Query', request.description);
    params.append('Solution', analysis.solution);
    params.append('Solveable', analysis.solveable);
    params.append('Priority', analysis.priority);
    params.append('Department', analysis.department);
    params.append('Language', analysis.language);
    params.append('Phone', request.phone);
    
    // Create direct URL string with all parameters
    const fullUrl = `${baseUrl}?${params.toString()}`;
    
    // Use axios for the GET request
    const response = await axios.get(fullUrl);
    
    // Check if the response contains success indicators
    const responseText = response.data;
    return typeof responseText === 'string' && (
      responseText.includes("success") || 
      responseText.includes("Success") || 
      responseText.includes("Data added") || 
      responseText.includes("Updated")
    );
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    return false;
  }
}

// Function to make a phone call using Bland.ai - ALWAYS call the customer
async function makePhoneCall(request: SupportRequest, analysis: GroqAnalysisResponse): Promise<{ success: boolean; callId?: string }> {
  try {
    const blandApiKey = process.env.NEXT_PUBLIC_BLAND_AI_API_KEY;
    
    if (!blandApiKey) {
      throw new Error('Bland.ai API key is not defined');
    }
    
    // Format the phone number to E.164 format
    const formattedPhone = request.phone.replace(/\D/g, '');
    if (!formattedPhone || formattedPhone.length < 10) {
      throw new Error('Invalid phone number');
    }
    
    const phoneWithCountryCode = formattedPhone.startsWith('1') ? 
      `+${formattedPhone}` : `+91${formattedPhone}`;
    
    // Headers for Bland.ai API
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${blandApiKey}`
    };
    
    // Enhanced Bland.ai API call configuration with recording enabled
    const data = {
      phone_number: phoneWithCountryCode,
      task: `You're a bank support representative. The customer ${request.name} has submitted a support request about: ${request.subject}. Their issue is: ${request.description}. Based on our analysis, the recommended solution is: ${analysis.solution}. Call them to follow up and provide this solution. Speak to them in ${analysis.language}. Make it Natural. Listen to their concerns and provide helpful assistance.`,
      voice: "June",
      wait_for_greeting: false,
      record: true, // Enable recording
      amd: false,
      answered_by_enabled: false,
      noise_cancellation: false,
      interruption_threshold: 100,
      block_interruptions: false,
      max_duration: 12,
      model: "base",
      language: analysis.language.toLowerCase() === 'hindi' ? "hi" : "en",
      background_track: "none",
      endpoint: "https://api.bland.ai",
      voicemail_action: "hangup",
      // Enhanced settings for better transcript quality
      transcription: true,
      webhook: null // You can add a webhook URL here if you want real-time updates
    };
    
    const response = await axios.post('https://api.bland.ai/v1/calls', data, { headers });
    
    if (response.data.call_id) {
      console.log(`📞 Call initiated successfully. Call ID: ${response.data.call_id}`);
      
      // Start monitoring the call for transcript and summary
      monitorCallAndSummarize(response.data.call_id, request);
      
      return { success: true, callId: response.data.call_id };
    }
    
    return { success: false };
  } catch (error) {
    console.error('Error making phone call with Bland.ai:', error);
    return { success: false };
  }
}

// Main function to handle support requests
export async function submitSupportRequest(request: SupportRequest): Promise<SupportResponse> {
  try {
    // Generate ticket ID
    const ticketId = `BANK-${Date.now().toString().slice(-6)}`;
    
    console.log(`🎫 Processing support request - Ticket ID: ${ticketId}`);
    
    // Step 1: Analyze the request with Groq
    const analysis = await analyzeWithGroq(request);
    console.log('🤖 Request analyzed with Groq AI');
    
    // Step 2: Save data to Google Sheets
    const sheetResult = await saveToGoogleSheets(request, analysis, ticketId);
    console.log(`📊 Google Sheets save result: ${sheetResult ? 'Success' : 'Failed'}`);
    
    // Step 3: Make phone call using Bland.ai with recording
    let callResult: { success: boolean; callId?: string } = { success: false };
    try {
      callResult = await makePhoneCall(request, analysis);
      if (callResult.success) {
        console.log(`📞 Phone call initiated successfully. Monitoring for transcript...`);
      } else {
        console.log('❌ Phone call initiation failed');
      }
    } catch (callError) {
      console.error('Phone call failed, but continuing with process:', callError);
    }
    
    // Return success response with ticket ID, call ID, analysis, and the original request data
    return {
      success: sheetResult,
      ticketId,
      callId: callResult.callId,
      analysis,
      requestData: request
    };
  } catch (error) {
    console.error('Error submitting support request:', error);
    return {
      success: false,
      ticketId: '',
      requestData: request,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}