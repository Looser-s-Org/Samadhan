// types.ts
export interface UserData {
    username: string;
    faceDescriptor: number[];
    imagePath: string;
    enhancedImagePath?: string;
    phone?: string;
  }
  
  export interface EnhancedImageResult {
    originalUrl: string;
    outputUrl: string;
    vectors?: number[];
  }
  
  export interface AuthFailureLog {
    timestamp: number;
    username: string;
    attempts: number;
    notificationSent: boolean;
  }