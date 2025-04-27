import axios from 'axios';

interface CallRequest {
  name: string;
  phone: string;
  subject: string;
  description: string;
}

interface CallAnalysis {
  solution: string;
  language: string;
}

/**
 * Service to handle integration with the Bland API for phone calls
 */
export class BlandAPIService {
  private apiKey: string | undefined;
  private static instance: BlandAPIService;
  
  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_BLAND_AI_API_KEY;
  }
  
  /**
   * Get the singleton instance of BlandAPIService
   */
  static getInstance(): BlandAPIService {
    if (!BlandAPIService.instance) {
      BlandAPIService.instance = new BlandAPIService();
    }
    return BlandAPIService.instance;
  }
  
  /**
   * Make a phone call using Bland.ai API
   * @param request Call request details
   * @param analysis Call analysis for handling the situation
   * @returns Promise resolving to boolean indicating call success
   */
  async makePhoneCall(request: CallRequest, analysis: CallAnalysis): Promise<boolean> {
    return this.makeSecurityCall(request, analysis);
  }
  
  /**
   * Make a security notification call to the user
   * @param request Call request details
   * @param analysis Call analysis for handling the situation
   * @returns Promise resolving to boolean indicating call success
   */
  async makeSecurityCall(request: CallRequest, analysis: CallAnalysis): Promise<boolean> {
    try {
      if (!this.apiKey) {
        throw new Error('Bland.ai API key is not defined');
      }
      
      // Format the phone number to E.164 format
      const formattedPhone = request.phone.replace(/\D/g, '');
      if (!formattedPhone || formattedPhone.length < 10) {
        throw new Error('Invalid phone number');
      }
      
      // Add appropriate country code based on formatting
      const phoneWithCountryCode = formattedPhone.startsWith('1') ? 
        `+${formattedPhone}` : `+91${formattedPhone}`;
      
      // Headers for Bland.ai API
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      };
      
      // Enhanced Bland.ai API call configuration
      const data = {
        phone_number: phoneWithCountryCode,
        task: `You're a bank security system. The customer ${request.name} has suspicious login activity: ${request.description}. Based on our analysis, please inform them: ${analysis.solution}. Call them to notify about this security concern. Make it clear this is an automated security call. Speak to them in ${analysis.language}. Make it Natural but urgent.`,
        voice: "June",
        wait_for_greeting: false,
        record: true,
        amd: false,
        answered_by_enabled: false,
        noise_cancellation: false,
        interruption_threshold: 100,
        block_interruptions: false,
        max_duration: 12,
        model: "base",
        language: analysis.language || "en", // Default to English
        background_track: "none",
        endpoint: "https://api.bland.ai",
        voicemail_action: "hangup"
      };
      
      // Log out the call data for debugging
      console.log('Making Bland.ai API call with data:', data);
      
      const response = await axios.post('https://api.bland.ai/v1/calls', data, { headers });
      
      console.log('Bland.ai API response:', response.data);
      
      return !!response.data.call_id;
    } catch (error) {
      console.error('Error making phone call with Bland.ai:', error);
      return false;
    }
  }

  /**
   * Make a security notification for suspicious login attempts
   * @param userData User data including name and phone
   * @param failedAttempts Number of failed login attempts
   * @returns Promise resolving to boolean indicating call success
   */
  async notifyUserOfSuspiciousActivity(
    userData: { username: string; phone: string }, 
    failedAttempts: number
  ): Promise<boolean> {
    if (!userData.phone) {
      throw new Error('No phone number registered for notifications');
    }
      
    // Create support request object
    const request: CallRequest = {
      name: userData.username,
      phone: userData.phone,
      subject: "Security Alert: Unauthorized Access Attempt",
      description: `There have been ${failedAttempts} failed login attempts to your account in the last 30 minutes. This might be a security breach attempt.`
    };
      
    // Create analysis response object
    const analysis: CallAnalysis = {
      solution: "We detected suspicious login activity on your account. As a security measure, we're calling to verify if this is you trying to log in. If not, we recommend changing your password immediately.",
      language: "en" // Default to English
    };
      
    return await this.makeSecurityCall(request, analysis);
  }

  /**
   * Check if the API key is configured
   * @returns boolean indicating if the API key is set
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Export a singleton instance
export const blandApiService = BlandAPIService.getInstance();