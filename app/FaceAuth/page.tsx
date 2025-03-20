"use client"
import Script from 'next/script';
import React, { useState, useRef, useEffect } from 'react';
import '../styles/FaceAuth.css'

// Define types for our component
interface UserData {
  username: string;
  faceDescriptor: number[];
  imagePath: string;
}

const FaceAuth: React.FC = () => {
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

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewImageRef = useRef<HTMLImageElement>(null);
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
      const reader = new FileReader();
      reader.onload = (e) => {
        if (previewImageRef.current && e.target?.result) {
          previewImageRef.current.src = e.target.result as string;
          previewImageRef.current.classList.remove('hidden');
        }
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  // Register user's face from uploaded image
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
      updateStatus('Processing uploaded image...', 'info');
      
      const faceapi = (window as any).faceapi;
      const file = fileInputRef.current.files[0];
      
      // Create an Image object to use with face-api
      const img = await createImageFromUpload(file);
      
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
      
      // Save the image file to the server
    //   await saveUserImage(file, trimmedUsername);
      
      // Store face descriptor and username in localStorage
      const userData: UserData = {
        username: trimmedUsername,
        faceDescriptor: Array.from(results.descriptor),
        imagePath: `/images/${trimmedUsername}.jpg`
      };
      
      localStorage.setItem('registeredUser', JSON.stringify(userData));
      
      updateStatus(`User "${trimmedUsername}" registered successfully! Ready for authentication.`, 'success');
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

  // Helper function to create image from file upload
  const createImageFromUpload = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // Helper function to save image file to server
//   const saveUserImage = async (file: File, username: string): Promise<any> => {
//     try {
//       // Create a FormData object to send the file to the server
//       const formData = new FormData();
//       formData.append('image', file);
//       formData.append('username', username);
      
//       // Send the image to the server
//       const response = await fetch('http://localhost:3000/upload-image', {
//         method: 'POST',
//         body: formData
//       });
      
//       if (!response.ok) {
//         throw new Error('Network response was not ok');
//       }
      
//       const data = await response.json();
//       console.log('Image saved successfully:', data);
//       return data;
//     } catch (error) {
//       console.error('Error saving image:', error);
//       // Even if saving to server fails, continue with registration
//       // using localStorage only
//       return {
//         success: false,
//         message: 'Failed to save image to server, but registration continues'
//       };
//     }
//   };

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
      
      // Compare with registered face
      const distance = faceapi.euclideanDistance(results.descriptor, registeredFaceDescriptor);
      console.log('Face match distance:', distance);
      
      const threshold = 0.5; // Adjust this threshold as needed
      if (distance < threshold) {
        updateStatus(`Authentication successful! Welcome, ${registeredUsername}!`, 'success');
      } else {
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
      // Notify the server to delete the user image (optional)
    //   if (registeredUsername) {
    //     await fetch('http://localhost:3000/delete-image', {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json'
    //       },
    //       body: JSON.stringify({ username: registeredUsername })
    //     });
    //   }
      
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
      
      // Show registration section
      setShowAuthentication(false);
      
      updateStatus('Registration data cleared. You can register a new user.', 'info');
    } catch (error: any) {
      console.error('Error resetting registration:', error);
      updateStatus(`Error resetting registration: ${error.message}`, 'error');
    }
  };

  // Render the FaceAuth component
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
    <div className="container">
      <h1>Face Authentication System</h1>
      <div id="status" className={statusType}>
        {statusMessage}
      </div>
      
      {/* Two-button flow for starting registration or authentication */}
      <div className="button-flow">
        <button onClick={() => setShowAuthentication(false)}>Register Face</button>
        <button onClick={() => {
          if (registeredUsername) {
            setShowAuthentication(true);
            startVideo();
          } else {
            updateStatus('No user registered! Please register first.', 'warning');
          }
        }}>Authenticate Face</button>
      </div>
      
      {/* Registration Section */}
      {!showAuthentication && (
        <div className="section">
          <h2>Registration</h2>
          <div className="input-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="upload-container">
            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            {/* <img
              id="uploadPreview"
              className="hidden"
              alt="Preview"
              ref={previewImageRef}
            /> */}
            <button
              onClick={registerUser}
              disabled={isRegistering || !isModelLoaded || !username.trim()}
            >
              {isRegistering ? 'Processing...' : 'Register Face'}
            </button>
          </div>
        </div>
      )}
      
      {/* Authentication Section */}
      {showAuthentication && (
        <div className="section">
          <h2>Authentication</h2>
          <div className="input-group">
            <label htmlFor="loginUsername">Username:</label>
            <input
              type="text"
              id="loginUsername"
              placeholder="Enter your username"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
            />
          </div>
          <video
            id="video"
            width="640"
            height="480"
            autoPlay
            muted
            ref={videoRef}
          />
          <div className="controls">
            <button
              onClick={authenticateUser}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? 'Processing...' : 'Authenticate'}
            </button>
            <button onClick={resetRegistration}>Reset</button>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default FaceAuth;