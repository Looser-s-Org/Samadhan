"use client"
import React, { useState, useRef, useEffect } from 'react';
import Script from 'next/script';

// Define types for our component
interface UserData {
  username: string;
  faceDescriptor: number[];
  imagePath: string;
  enhancedImagePath?: string;
}

interface EnhancedImageResult {
  originalUrl: string;
  outputUrl: string;
  vectors?: number[];
}

const EnhancedFaceAuth: React.FC = () => {
  // State variables
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  const [registeredUsername, setRegisteredUsername] = useState<string | null>(null);
  const [registeredFaceDescriptor, setRegisteredFaceDescriptor] = useState<Float32Array | null>(null);
  const [username, setUsername] = useState<string>('');
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('Loading models...');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [showAuthentication, setShowAuthentication] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [enhancedImage, setEnhancedImage] = useState<EnhancedImageResult | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewImageRef = useRef<HTMLImageElement>(null);
  const enhancedImageRef = useRef<HTMLImageElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  
  // Load face-api.js models when the component mounts
  useEffect(() => {
    const loadModels = async () => {
      try {
        updateStatus('Loading Face API models... Please wait.', 'info');
        console.log("Starting to load face-api.js models...");
        
        // Check if face-api is available
        if (typeof (window as any).faceapi === 'undefined') {
          throw new Error('Face API library not loaded. Check your internet connection or try a different browser.');
        }
        
        const faceapi = (window as any).faceapi;
        // Set the models URL to a reliable CDN
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.2/model/';
        
        // Load all required models
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        
        console.log('Models loaded successfully');
        setIsModelLoaded(true);
        updateStatus('Models loaded. Enter your username and upload an image to register.', 'success');
        
        // Check for stored face data
        const storedUser = localStorage.getItem('registeredUser');
        if (storedUser) {
          const userData: UserData = JSON.parse(storedUser);
          setRegisteredUsername(userData.username);
          setRegisteredFaceDescriptor(new Float32Array(userData.faceDescriptor));
          setLoginUsername(userData.username);
          updateStatus(`User "${userData.username}" already registered. Ready for authentication.`, 'success');
          setShowAuthentication(true);
          startVideo();
        }
      } catch (error: any) {
        console.error('Error loading models:', error);
        updateStatus(`Failed to load models: ${error.message}`, 'error');
      }
    };

    loadModels();

    // Cleanup function to stop video stream when component unmounts
    return () => {
      stopVideo();
      // Revoke any created object URLs
      if (enhancedImage) {
        if (enhancedImage.originalUrl.startsWith('blob:')) {
          URL.revokeObjectURL(enhancedImage.originalUrl);
        }
        if (enhancedImage.outputUrl.startsWith('blob:')) {
          URL.revokeObjectURL(enhancedImage.outputUrl);
        }
      }
    };
  }, []);

  // Helper function to update status with appropriate styling
  const updateStatus = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    setStatusMessage(message);
    setStatusType(type);
  };

  // Start webcam video stream
  const startVideo = async () => {
    try {
      // Stop any existing stream
      stopVideo();
      
      updateStatus('Activating webcam...', 'info');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoStreamRef.current = stream;
      }
      
      updateStatus('Webcam active. Position your face for authentication.', 'success');
    } catch (err: any) {
      console.error('Error accessing webcam:', err);
      updateStatus('Cannot access webcam. Please allow camera permissions and refresh.', 'error');
    }
  };

  // Stop video stream
  const stopVideo = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
      videoStreamRef.current = null;
    }
  };

  // Handle image upload change
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Check file size
      if (file.size > 10 * 1024 * 1024) { // 10MB
        updateStatus("File is too large. Maximum size is 10MB.", "error");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (previewImageRef.current && e.target?.result) {
          previewImageRef.current.src = e.target.result as string;
          previewImageRef.current.classList.remove('hidden');
        }
      };
      reader.readAsDataURL(file);
      
      // Enhance the image automatically
      enhanceImage(file);
    }
  };
  
  // Apply enhancement to the image
  const enhanceImage = async (file: File) => {
    setIsEnhancing(true);
    updateStatus('Enhancing your image for better face recognition...', 'info');
    
    try {
      // Create a URL for the original image for display
      const originalUrl = URL.createObjectURL(file);
      
      // Apply the enhancement process
      const enhancedDataUrl = await applyEnhancement(file);
      
      // Create the result object
      const result: EnhancedImageResult = {
        originalUrl,
        outputUrl: enhancedDataUrl
      };
      
      // Save the result
      setEnhancedImage(result);
      
      // Show the enhanced image
      if (enhancedImageRef.current) {
        enhancedImageRef.current.src = enhancedDataUrl;
        enhancedImageRef.current.classList.remove('hidden');
      }
      
      updateStatus('Image enhanced successfully! You can now register.', 'success');
    } catch (err) {
      console.error('Error enhancing image:', err);
      updateStatus('Failed to enhance image. Continuing with original.', 'warning');
    } finally {
      setIsEnhancing(false);
    }
  };
  
  // Apply enhancement to the image
  const applyEnhancement = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.onload = () => {
          try {
            // Create a canvas with 4x scaling for better face recognition (changed from 2x to 4x)
            const canvas = document.createElement('canvas');
            canvas.width = img.width * 4;  // Changed from 2x to 4x
            canvas.height = img.height * 4; // Changed from 2x to 4x
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Failed to get canvas context'));
              return;
            }
            
            // Apply base scaling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Apply sharpening for better facial features (increased strength from 1.5 to 2.0)
            applySharpening(ctx, canvas.width, canvas.height, 2.0); 
            
            // Apply stronger contrast enhancement for better feature detection
            ctx.filter = 'contrast(1.3) brightness(1.05) saturate(1.1)';
            ctx.drawImage(canvas, 0, 0);
            ctx.filter = 'none';
            
            // Return the enhanced image as a data URL
            resolve(canvas.toDataURL('image/jpeg', 0.92));
          } catch (err) {
            reject(err);
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  };
  
  // Apply a sharpening convolution filter to the canvas
  const applySharpening = (ctx: CanvasRenderingContext2D, width: number, height: number, strength: number) => {
    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const dataBackup = new Uint8ClampedArray(data);
    
    // Sharpening kernel
    const factor = Math.min(0.5, (strength - 1) * 0.25);
    const kernel = [
      -factor, -factor, -factor,
      -factor, 1 + factor * 8, -factor,
      -factor, -factor, -factor
    ];
    
    // Apply convolution filter (skip 1px at edges)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const offset = (y * width + x) * 4;
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const kernelIndex = (ky + 1) * 3 + (kx + 1);
              const dataIndex = ((y + ky) * width + (x + kx)) * 4 + c;
              sum += dataBackup[dataIndex] * kernel[kernelIndex];
            }
          }
          data[offset + c] = Math.max(0, Math.min(255, sum));
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  // Register user's face from enhanced image
  const registerUser = async () => {
    if (!isModelLoaded) {
      updateStatus('Face API models not loaded. Please wait or refresh the page.', 'error');
      return;
    }
    
    if (!fileInputRef.current?.files || fileInputRef.current.files.length === 0) {
      updateStatus('Please select an image first!', 'warning');
      return;
    }
    
    if (!username.trim()) {
      updateStatus('Please enter a username!', 'warning');
      return;
    }
    
    try {
      setIsRegistering(true);
      updateStatus('Processing enhanced image for registration...', 'info');
      
      const faceapi = (window as any).faceapi;
      
      // Use the enhanced image if available, otherwise use the original
      const imageToProcess = enhancedImage ? enhancedImage.outputUrl : URL.createObjectURL(fileInputRef.current.files[0]);
      
      // Create an Image object to use with face-api
      const img = await createImageFromUrl(imageToProcess);
      
      // Detect face and get descriptor
      const results = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (!results) {
        updateStatus('No face detected in the image! Please try another image.', 'error');
        setIsRegistering(false);
        return;
      }
      
      // Store face descriptor and username
      setRegisteredFaceDescriptor(results.descriptor);
      const trimmedUsername = username.trim();
      setRegisteredUsername(trimmedUsername);
      
      // Store face descriptor and username in localStorage
      const userData: UserData = {
        username: trimmedUsername,
        faceDescriptor: Array.from(results.descriptor),
        imagePath: enhancedImage ? enhancedImage.originalUrl : URL.createObjectURL(fileInputRef.current.files[0]),
        enhancedImagePath: enhancedImage ? enhancedImage.outputUrl : undefined
      };
      
      localStorage.setItem('registeredUser', JSON.stringify(userData));
      
      updateStatus(`User "${trimmedUsername}" registered successfully with enhanced image! Ready for authentication.`, 'success');
      setIsRegistering(false);
      
      // Show authentication section
      setShowAuthentication(true);
      setLoginUsername(trimmedUsername);
      startVideo();
    } catch (error: any) {
      console.error('Registration error:', error);
      updateStatus(`Error during registration: ${error.message}`, 'error');
      setIsRegistering(false);
    }
  };

  // Helper function to create image from URL
  const createImageFromUrl = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  // Authenticate user against registered face
  const authenticateUser = async () => {
    if (!registeredFaceDescriptor || !registeredUsername) {
      updateStatus('No user registered! Please register first.', 'warning');
      return;
    }
    
    if (!isModelLoaded) {
      updateStatus('Face API models not loaded. Please wait or refresh the page.', 'error');
      return;
    }
    
    // Check username
    const enteredUsername = loginUsername.trim();
    if (!enteredUsername) {
      updateStatus('Please enter your username!', 'warning');
      return;
    }
    
    if (enteredUsername !== registeredUsername) {
      updateStatus('Authentication failed! Username does not match.', 'error');
      return;
    }
    
    try {
      setIsAuthenticating(true);
      updateStatus('Authenticating... Keep your face visible.', 'info');
      
      const faceapi = (window as any).faceapi;
      // Detect face in current video frame
      const results = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (!results) {
        updateStatus('No face detected in camera! Please ensure your face is clearly visible.', 'warning');
        setIsAuthenticating(false);
        return;
      }
      
      // Compare with registered face descriptor (which came from the enhanced image)
      const distance = faceapi.euclideanDistance(results.descriptor, registeredFaceDescriptor);
      console.log('Face match distance:', distance);

      // Here is the updated function with 3 different authentication scenarios based on match distance
      if (distance < 0.47) {
        // Scenario 1: Strong match - Successfully authenticated
        updateStatus(`Authentication successful! Welcome, ${registeredUsername}!`, 'success');
      } else if (distance < 0.54) {
        // Scenario 2: Partial match - Need better photo quality
        updateStatus(`Partial match detected. Please update your profile photo with your Aadhar card for better recognition.`, 'warning');
      } else {
        // Scenario 3: No match - Authentication failed
        updateStatus('Authentication failed! Face not recognized.', 'error');
      }
      
      setIsAuthenticating(false);
    } catch (error: any) {
      console.error('Authentication error:', error);
      updateStatus(`Error during authentication: ${error.message}`, 'error');
      setIsAuthenticating(false);
    }
  };

  // Reset stored data
  const resetRegistration = async () => {
    try {
      localStorage.removeItem('registeredUser');
      setRegisteredFaceDescriptor(null);
      setRegisteredUsername(null);
      
      // Stop webcam if it's running
      stopVideo();
      
      // Reset upload input and username fields
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUsername('');
      setLoginUsername('');
      if (previewImageRef.current) previewImageRef.current.classList.add('hidden');
      if (enhancedImageRef.current) enhancedImageRef.current.classList.add('hidden');
      
      // Clear enhanced image
      if (enhancedImage) {
        if (enhancedImage.originalUrl.startsWith('blob:')) {
          URL.revokeObjectURL(enhancedImage.originalUrl);
        }
        if (enhancedImage.outputUrl.startsWith('blob:')) {
          URL.revokeObjectURL(enhancedImage.outputUrl);
        }
      }
      setEnhancedImage(null);
      
      // Show registration section
      setShowAuthentication(false);
      
      updateStatus('Registration data cleared. You can register a new user.', 'info');
    } catch (error: any) {
      console.error('Error resetting registration:', error);
      updateStatus(`Error resetting registration: ${error.message}`, 'error');
    }
  };

  // Render the component
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"
        strategy="beforeInteractive"
        onLoad={() => {
          console.log("Face API script loaded successfully");
        }}
        onError={(e) => {
          console.error("Error loading Face API script:", e);
        }}
      />
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Enhanced Face Authentication System</h1>
        <div id="status" className={`p-4 mb-6 rounded ${
          statusType === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          statusType === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          statusType === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {statusMessage}
        </div>
        
        {/* Two-button flow for starting registration or authentication */}
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setShowAuthentication(false)}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
          >
            Register Face
          </button>
          <button 
            onClick={() => {
              if (registeredUsername) {
                setShowAuthentication(true);
                startVideo();
              } else {
                updateStatus('No user registered! Please register first.', 'warning');
              }
            }}
            className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition duration-300"
          >
            Authenticate Face
          </button>
        </div>
        
        {/* Registration Section */}
        {!showAuthentication && (
          <div className="bg-white p-6 rounded-xl shadow-md mb-6">
            <h2 className="text-2xl font-bold mb-4">Registration</h2>
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium mb-2">Username:</label>
              <input
                type="text"
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="px-4 py-2 border rounded w-full"
              />
            </div>
            <div className="mb-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300 mb-4"
              >
                Upload Profile Image
              </button>
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {isEnhancing && (
                <div className="my-4 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded">
                  <div className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="font-medium">Enhancing your image for better face recognition...</span>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div className="border rounded p-4 bg-gray-50">
                  <h3 className="font-medium mb-3">Original Image</h3>
                  <div className="bg-gray-100 rounded overflow-hidden h-64 flex items-center justify-center">
                    <img
                      id="uploadPreview"
                      className="hidden max-h-full max-w-full object-contain"
                      alt="Original"
                      ref={previewImageRef}
                    />
                  </div>
                </div>
                
                <div className="border rounded p-4 bg-gray-50">
                  <h3 className="font-medium mb-3">Enhanced Image (4x)</h3>
                  <div className="bg-gray-100 rounded overflow-hidden h-64 flex items-center justify-center">
                    <img
                      id="enhancedPreview"
                      className="hidden max-h-full max-w-full object-contain"
                      alt="Enhanced"
                      ref={enhancedImageRef}
                    />
                  </div>
                </div>
              </div>
              
              <button
                onClick={registerUser}
                disabled={isRegistering || !isModelLoaded || !username.trim() || isEnhancing}
                className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition duration-300 disabled:bg-gray-400"
              >
                {isRegistering ? 'Processing...' : 'Register Face'}
              </button>
              
              {enhancedImage && (
                <div className="mt-4">
                  <a 
                    href={enhancedImage.outputUrl} 
                    download={`enhanced_${username.trim() || 'profile'}.jpg`}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300 inline-flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download Enhanced Image
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Authentication Section */}
        {showAuthentication && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-4">Authentication</h2>
            <div className="mb-4">
              <label htmlFor="loginUsername" className="block text-sm font-medium mb-2">Username:</label>
              <input
                type="text"
                id="loginUsername"
                placeholder="Enter your username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="px-4 py-2 border rounded w-full"
              />
            </div>
            <div className="mb-4 bg-black rounded overflow-hidden">
              <video
                id="video"
                width="640"
                height="480"
                autoPlay
                muted
                ref={videoRef}
                className="w-full h-auto"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={authenticateUser}
                disabled={isAuthenticating}
                className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition duration-300 disabled:bg-gray-400"
              >
                {isAuthenticating ? 'Processing...' : 'Authenticate'}
              </button>
              <button 
                onClick={resetRegistration}
                className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition duration-300"
              >
                Reset Registration
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-6 text-sm text-gray-500">
          <p>This application uses enhanced face recognition technology with 4x upscaling. For optimal results:</p>
          <ul className="list-disc ml-5 mt-2">
            <li>Use a clear, well-lit image for registration</li>
            <li>Ensure your face is fully visible during authentication</li>
            <li>Remove glasses or other accessories that might obstruct facial features</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default EnhancedFaceAuth;