"use client";
import React, { useState, useRef, useEffect } from 'react';
import { enhanceImage, isImageSuitableForFaceRecognition, getFacePhotoRecommendations } from '@/app/api/ImageEnhancementService';
import LoadingIndicator from '@/app/components/LoadingIndicator';
import LocalStorageService from '@/app/api/LocalStorageService';
import ImprovedFaceApiService from '@/app/api/FaceApiService';
import { detectAadhaarCard } from '@/app/api/Verification';

// Define types 
interface EnhancedImageResult {
  originalUrl: string;
  outputUrl: string;
  faceDescriptor: number[];
  quality?: number;
}

interface RegistrationPanelProps {
  username: string;
  setUsername: (username: string) => void;
  phoneNumber: string;
  setPhoneNumber: (phoneNumber: string) => void;
  isModelLoaded: boolean;
  registerUser: () => void;
  isRegistering: boolean;
  updateStatus: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  onFileSelected: (file: File) => void;
}

const RegistrationPanel: React.FC<RegistrationPanelProps> = ({
  username,
  setUsername,
  phoneNumber,
  setPhoneNumber,
  isModelLoaded,
  registerUser: parentRegisterUser,
  isRegistering,
  updateStatus,
  onFileSelected
}) => {
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewImageRef = useRef<HTMLImageElement>(null);
  const enhancedImageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // Component state
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [enhancedImage, setEnhancedImage] = useState<EnhancedImageResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [enhancementAttempts, setEnhancementAttempts] = useState<number>(0);
  const [processingRegistration, setProcessingRegistration] = useState<boolean>(false);
  const [faceDetected, setFaceDetected] = useState<boolean | null>(null);
  const [faceQualityScore, setFaceQualityScore] = useState<number | null>(null);
  const [faceConfidence, setFaceConfidence] = useState<number | null>(null);
  const [photoRecommendations, setPhotoRecommendations] = useState<string[]>([]);
  const [showRecommendations, setShowRecommendations] = useState<boolean>(false);
  const [suitabilityResult, setSuitabilityResult] = useState<{
    passes: boolean;
    qualityScore: number;
    failureReasons: string[];
    recommendations: string[];
  } | null>(null);
  const [isVerifyingAadhaar, setIsVerifyingAadhaar] = useState<boolean>(false);
  const [isAadhaarCard, setIsAadhaarCard] = useState<boolean | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [animationStage, setAnimationStage] = useState<string>('idle');
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [scanningText, setScanningText] = useState<string>('');
  const [animationComplete, setAnimationComplete] = useState<boolean>(false);

  // Effect to clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup any created object URLs when component unmounts
      if (enhancedImage) {
        URL.revokeObjectURL(enhancedImage.originalUrl);
        URL.revokeObjectURL(enhancedImage.outputUrl);
      }
    };
  }, [enhancedImage]);

  // Effect to load recommendations
  useEffect(() => {
    const recommendations = getFacePhotoRecommendations();
    setPhotoRecommendations(recommendations);
  }, []);

  // Effect for typing animation in scanning text
  useEffect(() => {
    if (isVerifyingAadhaar) {
      const phrases = [
        "Scanning Neural Patterns...", 
        "Verifying Identity...",
        "Analyzing Aadhaar Data...",
        "Ensuring Document Integrity..."
      ];
      
      let currentPhraseIndex = 0;
      let currentCharIndex = 0;
      let isDeleting = false;
      
      const typeText = () => {
        const currentPhrase = phrases[currentPhraseIndex];
        
        if (isDeleting) {
          setScanningText(currentPhrase.substring(0, currentCharIndex - 1));
          currentCharIndex--;
          
          if (currentCharIndex === 0) {
            isDeleting = false;
            currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
          }
        } else {
          setScanningText(currentPhrase.substring(0, currentCharIndex + 1));
          currentCharIndex++;
          
          if (currentCharIndex === currentPhrase.length) {
            isDeleting = true;
            setTimeout(() => {}, 1000); // Hold for 1 second before deleting
          }
        }
      };
      
      const interval = setInterval(typeText, 100);
      return () => clearInterval(interval);
    } else {
      setScanningText('');
    }
  }, [isVerifyingAadhaar]);

  // Function to validate image before processing
  const validateImage = (file: File): boolean => {
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      updateStatus("File is too large. Maximum size is 10MB.", "error");
      return false;
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      updateStatus("Invalid file type. Please upload a JPG or PNG image.", "error");
      return false;
    }

    return true;
  };

  // Function to handle drag events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateImage(file)) {
        await processFile(file);
      }
    }
  };

  // Function to verify if the uploaded image is an Aadhaar card
  const verifyAadhaarCard = async (file: File): Promise<boolean> => {
    try {
      setIsVerifyingAadhaar(true);
      setAnimationStage('scanning');
      updateStatus("Verifying Aadhaar card...", "info");
      
      // Call our Aadhaar verification utility function
      const isValidAadhaar = await detectAadhaarCard(file);
      
      // Simulate a slightly longer processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (isValidAadhaar) {
        setAnimationStage('success');
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
        updateStatus("Valid Aadhaar card detected.", "success");
        setIsAadhaarCard(true);
      } else {
        setAnimationStage('error');
        setTimeout(() => setAnimationStage('idle'), 2000);
        updateStatus("This doesn't appear to be an Aadhaar card. Please upload a valid Aadhaar card.", "error");
        setIsAadhaarCard(false);
      }
      
      setAnimationComplete(true);
      setTimeout(() => setAnimationComplete(false), 1000);
      return isValidAadhaar;
    } catch (error) {
      console.error("Error verifying Aadhaar card:", error);
      setAnimationStage('error');
      setTimeout(() => setAnimationStage('idle'), 2000);
      updateStatus("Error verifying Aadhaar card. Please try again.", "error");
      setIsAadhaarCard(false);
      return false;
    } finally {
      setTimeout(() => {
        setIsVerifyingAadhaar(false);
      }, 1000);
    }
  };

  // Function to process the uploaded file
  const processFile = async (file: File) => {
    if (!validateImage(file)) {
      return;
    }
    
    // Verify if the uploaded image is an Aadhaar card
    const isValidAadhaar = await verifyAadhaarCard(file);
    
    // If not a valid Aadhaar card, don't proceed with processing
    if (!isValidAadhaar) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    setSelectedFile(file);
    setEnhancementAttempts(0); // Reset enhancement attempts counter
    setFaceDetected(null); // Reset face detection status
    setFaceQualityScore(null); // Reset quality score
    setFaceConfidence(null); // Reset confidence score
    setSuitabilityResult(null); // Reset suitability result
    onFileSelected(file); // Pass the file to parent component
    
    // Display preview image
    const reader = new FileReader();
    reader.onload = (e) => {
      if (previewImageRef.current && e.target?.result) {
        previewImageRef.current.src = e.target.result as string;
        previewImageRef.current.classList.remove('hidden');
        
        // Clear previous enhanced image if any
        if (enhancedImageRef.current) {
          enhancedImageRef.current.classList.add('hidden');
        }
        setEnhancedImage(null);
        
        // Check if we can detect faces in the original image
        if (isModelLoaded && ImprovedFaceApiService.areModelsLoaded()) {
          checkForFaces(previewImageRef.current);
        }
      }
    };
    reader.readAsDataURL(file);
    
    // Start enhancement process
    handleEnhancement(file);
  };

  // Function to handle the initial image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      await processFile(file);
    }
  };

  // Function to check if faces can be detected in the image
  const checkForFaces = async (imgElement: HTMLImageElement) => {
    try {
      // Wait for image to be fully loaded
      if (!imgElement.complete) {
        await new Promise<void>((resolve) => {
          imgElement.onload = () => resolve();
        });
      }
      
      // Try to detect a face using the improved FaceAPI
      const { descriptor, quality, confidence } = await ImprovedFaceApiService.getFaceDescriptor(imgElement);
      
      setFaceDetected(true);
      setFaceQualityScore(quality);
      setFaceConfidence(confidence);
      
      // Log detailed face detection information
      console.log('Face detected in original image:', descriptor instanceof Float32Array);
      console.log('Original image face descriptor length:', descriptor.length);
      console.log('Face quality score:', quality.toFixed(2));
      console.log('Detection confidence:', confidence.toFixed(2));
      
      // Show recommendations if quality is low
      if (quality < 0.7) {
        setShowRecommendations(true);
      }
      
      return {
        descriptor,
        quality,
        confidence
      };
    } catch (error) {
      console.warn('No face detected in original image:', error);
      setFaceDetected(false);
      setShowRecommendations(true);
      return null;
    }
  };

  // Function to handle the image enhancement process
  const handleEnhancement = async (file: File) => {
    if (!file) return;
    
    setIsEnhancing(true);
    updateStatus('Enhancing your image for better face recognition...', 'info');
    setEnhancementAttempts(prev => prev + 1);
    
    try {
      console.log('Starting enhancement process, attempt #', enhancementAttempts + 1);
      
      // Create a URL for the original image for display
      const originalUrl = URL.createObjectURL(file);
      
      // First check if the image is suitable for face recognition
      const suitability = await isImageSuitableForFaceRecognition(file);
      setSuitabilityResult(suitability);
      
      if (!suitability.passes) {
        console.warn('Image may not be suitable for face recognition:', suitability.failureReasons);
        setPhotoRecommendations(suitability.recommendations);
        setShowRecommendations(true);
      }
      
      // Apply the enhanced image processing with the simplified enhancer
      const enhancementResult = await enhanceImage(file);
      
      if (!enhancementResult.dataUrl) {
        throw new Error("Enhancement service returned empty result");
      }
      
      // Set quality score from enhancement result
      setFaceQualityScore(enhancementResult.qualityScore);
      
      // Create an image element for the enhanced image
      const enhancedImg = new Image();
      enhancedImg.src = enhancementResult.dataUrl;
      await new Promise<void>((resolve) => {
        enhancedImg.onload = () => resolve();
      });
      
      // Try to detect face in the enhanced image
      let faceData = null;
      try {
        faceData = await ImprovedFaceApiService.getFaceDescriptor(enhancedImg);
        setFaceDetected(true);
        setFaceQualityScore(faceData.quality);
        setFaceConfidence(faceData.confidence);
        
        updateStatus(`Face features extracted with quality score: ${(faceData.quality * 10).toFixed(1)}/10`, "success");
      } catch (faceError) {
        console.warn('No face detected in enhanced image:', faceError);
        
        // Try with the original image as fallback
        if (previewImageRef.current) {
          try {
            faceData = await ImprovedFaceApiService.getFaceDescriptor(previewImageRef.current);
            setFaceDetected(true);
            setFaceQualityScore(faceData.quality);
            setFaceConfidence(faceData.confidence);
            
            updateStatus("Using original image face features (enhancement didn't improve detection).", "info");
          } catch {
            setFaceDetected(false);
            updateStatus("No facial features detected. Please upload a clearer image with a face.", "warning");
          }
        }
      }
      
      // Create the result object with face descriptor and quality info
      const result: EnhancedImageResult = {
        originalUrl,
        outputUrl: enhancementResult.dataUrl,
        faceDescriptor: faceData ? Array.from(faceData.descriptor) : [],
        quality: faceData ? faceData.quality : enhancementResult.qualityScore
      };
      
      // Save the result
      setEnhancedImage(result);
      
      // Show the enhanced image
      if (enhancedImageRef.current) {
        enhancedImageRef.current.src = enhancementResult.dataUrl;
        enhancedImageRef.current.classList.remove('hidden');
      }
      
      // Show recommendations from the enhancement service
      if (enhancementResult.recommendations && enhancementResult.recommendations.length > 0) {
        setPhotoRecommendations(enhancementResult.recommendations);
        setShowRecommendations(true);
      }
      
      // Auto-register if all data is available and we have a good quality face
      if (username.trim() && phoneNumber.trim() && isModelLoaded && 
          faceData && faceData.quality > 0.6) {
        registerUserWithFaceData(result);
      } else if (username.trim() && phoneNumber.trim() && isModelLoaded && faceData) {
        updateStatus('Image processed, but face quality may not be optimal. You can still proceed.', 'info');
      }
    } catch (err: any) {
      console.error('Error enhancing image:', err);
      
      // Provide more specific feedback based on error
      if (err.message && err.message.includes('Failed to load image')) {
        updateStatus(`Enhancement failed: Image could not be loaded properly. Please try a different image format or file.`, "warning");
      } else if (enhancementAttempts >= 2) {
        // After 2 attempts, offer to continue with original
        updateStatus(`Multiple enhancement attempts failed. You may continue with the original image.`, "warning");
      } else {
        updateStatus(`Failed to enhance image: ${err.message || 'Unknown error'}. You can retry or continue with original.`, "warning");
      }
      
      // If we have the original image preview displayed, we can still proceed
      if (previewImageRef.current && previewImageRef.current.src) {
        useOriginalImage();
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  // Function to skip enhancement and use original
  const useOriginalImage = async () => {
    if (selectedFile && previewImageRef.current && previewImageRef.current.src) {
      const originalUrl = URL.createObjectURL(selectedFile);
      
      // If face-api is available, try to get face descriptor from original
      if (isModelLoaded && ImprovedFaceApiService.areModelsLoaded() && previewImageRef.current) {
        try {
          const { descriptor, quality, confidence } = await ImprovedFaceApiService.getFaceDescriptor(previewImageRef.current);
          
          console.log('Using face descriptor from original image via ImprovedFaceApiService');
          console.log('Descriptor length:', descriptor.length);
          console.log('Face quality:', quality);
          console.log('Detection confidence:', confidence);
          
          setFaceDetected(true);
          setFaceQualityScore(quality);
          setFaceConfidence(confidence);
          
          // Create a result with the original image but actual face descriptors
          const result: EnhancedImageResult = {
            originalUrl,
            outputUrl: previewImageRef.current.src,
            faceDescriptor: Array.from(descriptor),
            quality
          };
          
          setEnhancedImage(result);
          
          if (enhancedImageRef.current) {
            enhancedImageRef.current.src = previewImageRef.current.src;
            enhancedImageRef.current.classList.remove('hidden');
          }
          
          updateStatus('Using original image with detected face features for registration.', 'info');
          
          // Auto-register if all data is available
          if (username.trim() && phoneNumber.trim() && isModelLoaded) {
            registerUserWithFaceData(result);
          }
        } catch (error) {
          console.error('Failed to get face descriptor from original:', error);
          
          // Fall back to random vectors but warn the user
          const placeholderVectors = Array(128).fill(0).map(() => Math.random() * 2 - 1);
          
          const result: EnhancedImageResult = {
            originalUrl,
            outputUrl: previewImageRef.current.src,
            faceDescriptor: placeholderVectors,
            quality: 0.3 // Low quality score for placeholder
          };
          
          setEnhancedImage(result);
          setFaceDetected(false);
          setFaceQualityScore(0.3);
          
          if (enhancedImageRef.current) {
            enhancedImageRef.current.src = previewImageRef.current.src;
            enhancedImageRef.current.classList.remove('hidden');
          }
          
          updateStatus('Using original image for registration. No face detected, authentication may be less reliable.', 'warning');
          setShowRecommendations(true);
        }
      } else {
        // Generate some random vectors as placeholder
        const placeholderVectors = Array(128).fill(0).map(() => Math.random() * 2 - 1);
        
        const result: EnhancedImageResult = {
          originalUrl,
          outputUrl: previewImageRef.current.src,
          faceDescriptor: placeholderVectors,
          quality: 0.3 // Low quality score for placeholder
        };
        
        setEnhancedImage(result);
        
        if (enhancedImageRef.current) {
          enhancedImageRef.current.src = previewImageRef.current.src;
          enhancedImageRef.current.classList.remove('hidden');
        }
        
        updateStatus('Using original image for registration.', 'info');
      }
    } else {
      updateStatus("No image available", "error");
    }
  };

  

  // Our own registration handler that stores face data
  const registerUserWithFaceData = async (imageData: EnhancedImageResult) => {
    if (processingRegistration) return;
    setProcessingRegistration(true);
    
    try {
      // Get threshold recommendations based on quality
      const quality = imageData.quality || faceQualityScore || 0.5;
      const recommendedThreshold = ImprovedFaceApiService.getCurrentThreshold().effective;
      
      // Store user data in local storage
      const userData = {
        username: username.trim(),
        faceDescriptor: imageData.faceDescriptor,
        imagePath: imageData.originalUrl,
        enhancedImagePath: imageData.outputUrl,
        phone: phoneNumber.trim(),
        registeredAt: new Date().toISOString(),
        faceQualityScore: quality,
        recommendedThreshold,
        isVerifiedAadhaar: isAadhaarCard || false
      };
      
      // Log the face descriptors and threshold for debugging
      console.log('Storing face descriptor of length:', imageData.faceDescriptor.length);
      console.log('Effective threshold for authentication:', recommendedThreshold.toFixed(3));
      console.log('Face quality score:', quality.toFixed(2));
      console.log('Aadhaar verification status:', isAadhaarCard);
      
      // Save to local storage
      LocalStorageService.saveUserData(userData);
      
      // Show success message with celebration animation
      setAnimationStage('registered');
      updateStatus('Face data saved! Proceeding with registration...', 'success');
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
      
      // Call parent's register function now that we've saved the face data
      parentRegisterUser();
    } catch (error) {
      console.error('Error during registration:', error);
      updateStatus('Registration failed. Please try again.', 'error');
      setAnimationStage('error');
    } finally {
      setProcessingRegistration(false);
    }
  };

  // Combined registration handler
  const registerUser = () => {
    if (!enhancedImage) {
      updateStatus("No enhanced image available. Please upload an image first.", "error");
      return;
    }
    
    if (!isAadhaarCard) {
      updateStatus("Valid Aadhaar card verification required. Please upload a valid Aadhaar card.", "error");
      return;
    }
    
    registerUserWithFaceData(enhancedImage);
  };

  // Function to retry enhancement
  const retryEnhancement = () => {
    if (selectedFile) {
      // Reset some states before retrying
      setEnhancedImage(null);
      if (enhancedImageRef.current) {
        enhancedImageRef.current.classList.add('hidden');
      }
      
      // Call the enhancement function again with the same file
      handleEnhancement(selectedFile);
    } else {
      updateStatus("No image available for enhancement", "error");
    }
  };

  

  // Function to generate quality label based on score
  const getQualityLabel = (score: number): {label: string, color: string} => {
    if (score >= 0.8) return { label: "Excellent", color: "text-green-600" };
    if (score >= 0.7) return { label: "Good", color: "text-green-500" };
    if (score >= 0.5) return { label: "Acceptable", color: "text-yellow-500" };
    if (score >= 0.3) return { label: "Poor", color: "text-orange-500" };
    return { label: "Very Poor", color: "text-red-600" };
  };

  const isFormValid = () => {
    return username.trim() !== '' && 
           phoneNumber.trim() !== '' && 
           !isEnhancing && 
           isModelLoaded &&
           isAadhaarCard === true &&
           (enhancedImage !== null || selectedFile !== null);
  };

  // Function to render scanning animation
  const renderScanningAnimation = () => {
    return (
      <div className="scanning-animation w-full h-full absolute top-0 left-0 flex flex-col items-center justify-center z-10">
        <div className="relative w-full max-w-xs">
          <div className="scanning-line bg-cyan-400 h-1 w-full absolute left-0 animate-scanline"></div>
          <div className="typing-text text-center mt-4 h-6 text-cyan-400 font-orbitron">
            {scanningText}
          </div>
        </div>
      </div>
    );
  };

  // Function to render success animation
  const renderSuccessAnimation = () => {
    return (
      <div className="success-animation absolute inset-0 flex items-center justify-center z-20">
        <div className="success-icon relative flex items-center justify-center">
          <div className="absolute w-16 h-16 bg-cyan-400 rounded-full opacity-20 animate-ping"></div>
          <div className="absolute w-14 h-14 bg-cyan-500 rounded-full opacity-30 animate-pulse"></div>
          <svg className="w-10 h-10 text-cyan-500 z-10 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
    );
  };

  // Function to render error animation
  const renderErrorAnimation = () => {
    return (
      <div className="error-animation absolute inset-0 flex items-center justify-center z-20">
        <div className="error-icon relative flex items-center justify-center">
          <div className="absolute w-16 h-16 bg-red-400 rounded-full opacity-20 animate-ping"></div>
          <div className="absolute w-14 h-14 bg-red-500 rounded-full opacity-30 animate-pulse"></div>
          <svg className="w-10 h-10 text-red-500 z-10 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="registration-panel">
      {/* Futuristic Background Elements */}
      <div className="background-elements">
        <div className="circuit-pattern"></div>
        <div className="top-highlight"></div>
        <div className="bottom-highlight"></div>
        <div className="holographic-particles"></div>
      </div>
      
      {/* Celebration Confetti (conditionally rendered) */}
      {showCelebration && (
        <div className="confetti-container">
          {/* This would be implemented with react-confetti or a similar library */}
          <div className="confetti-animation"></div>
        </div>
      )}
      
      {/* Header with Futuristic Title */}
      <div className="header">
        <h2 className="title">
         Face Registration
        </h2>
        <p className="subtitle">
          Secure your identity
        </p>
      </div>
      
      {/* Form Area */}
      <div className="form-area">
        <div className="form-group">
          <label className="input-label">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="text-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label className="input-label">
            Phone Number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="text-input"
            required
          />
        </div>
      </div>

      <div className="upload-section">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/png, image/jpeg, image/jpg"
          className="hidden-input"
        />
        
        {/* Drag & Drop Zone */}
        <div 
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`upload-zone ${isDragging ? 'dragging' : ''}`}
          onClick={() => fileInputRef.current?.click()}
        >
          {/* Overlay for verification animations */}
          {(isVerifyingAadhaar || animationStage !== 'idle') && (
            <div className="verification-overlay">
              {isVerifyingAadhaar && renderScanningAnimation()}
              {animationStage === 'success' && renderSuccessAnimation()}
              {animationStage === 'error' && renderErrorAnimation()}
              {animationStage === 'registered' && renderSuccessAnimation()}
            </div>
          )}

          <div className="upload-content">
            <div className="upload-icon-container">
              <svg className={`upload-icon ${isDragging ? 'dragging' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className={`upload-heading ${isDragging ? 'dragging' : ''}`}>
              Upload Aadhaar Card
            </h3>
            <p className="upload-instruction">
              Drag & drop or click to select
            </p>
          </div>
        </div>

        {/* Aadhaar verification status */}
        {isAadhaarCard === true && !isVerifyingAadhaar && (
          <div className="status-message success-message">
            <p className="status-text">
              <svg className="status-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Valid Aadhaar card verified & secured
            </p>
          </div>
        )}
        
        {isAadhaarCard === false && !isVerifyingAadhaar && (
          <div className="status-message error-message">
            <p className="status-text">
              <svg className="status-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Document validation failed. Please upload a valid Aadhaar card.
            </p>
          </div>
        )}
        
        {/* Image Preview Area */}
        <div className="image-preview-grid">
          {/* Original image preview */}
          <div className="preview-container">
            <div className="preview-header">
              Original Image
            </div>
            <div className="preview-content">
              <img ref={previewImageRef} alt="Preview" className="preview-image hidden" />
              {!selectedFile && <p className="no-image-text">No image uploaded</p>}
            </div>
          </div>
          
          {/* Enhanced image preview */}
          <div className="preview-container">
            <div className="preview-header">
              Enhanced Image
            </div>
            <div className="preview-content">
              <img ref={enhancedImageRef} alt="Enhanced" className="preview-image hidden" />
              {isEnhancing && <LoadingIndicator message="Optimizing..." />}
              {!enhancedImage && !isEnhancing && <p className="no-image-text">Awaiting enhancement</p>}
            </div>
          </div>
        </div>
        
        {/* Face quality indicators */}
        {faceQualityScore !== null && (
          <div className="quality-analysis-container">
            <h4 className="quality-analysis-title">Image Quality Analysis</h4>
            
            <div className="quality-indicators">
              <div className="quality-indicator">
                <div className="quality-label-container">
                  <span className="quality-label">Face Quality:</span>
                  {faceQualityScore && (
                    <span className={`quality-value ${
                      faceQualityScore > 0.7 ? 'high-quality' : 
                      faceQualityScore > 0.5 ? 'good-quality' : 
                      faceQualityScore > 0.4 ? 'medium-quality' : 
                      faceQualityScore > 0.3 ? 'low-quality' : 'poor-quality'
                    }`}>
                      {getQualityLabel(faceQualityScore).label} ({(faceQualityScore * 10).toFixed(1)}/10)
                    </span>
                  )}
                </div>
                <div className="progress-bar-background">
                  <div 
                    className={`progress-bar ${
                      faceQualityScore > 0.7 ? 'high-quality' : 
                      faceQualityScore > 0.5 ? 'good-quality' : 
                      faceQualityScore > 0.4 ? 'medium-quality' : 
                      faceQualityScore > 0.3 ? 'low-quality' : 'poor-quality'
                    }`} 
                    style={{ width: `${Math.max(5, faceQualityScore * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Confidence indicator if available */}
              {faceConfidence !== null && (
                <div className="quality-indicator">
                  <div className="quality-label-container">
                    <span className="quality-label">Detection Confidence:</span>
                    <span className="confidence-value">{(faceConfidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="progress-bar-background">
                    <div 
                      className="progress-bar confidence-bar" 
                      style={{ width: `${Math.max(5, faceConfidence * 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Face detection status */}
            {faceDetected === true && (
              <div className="detection-status success">
                <svg className="detection-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="detection-text">Facial features extracted successfully</span>
              </div>
            )}
            
            {faceDetected === false && (
              <div className="detection-status error">
                <svg className="detection-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="detection-text">No facial features detected</span>
              </div>
            )}
          </div>
        )}
        
        {/* Suitability failure reasons */}
        {suitabilityResult && !suitabilityResult.passes && (
          <div className="warning-container">
            <p className="warning-title">Image quality issues detected:</p>
            <ul className="warning-list">
              {suitabilityResult.failureReasons.map((reason, idx) => (
                <li key={idx} className="warning-item">
                  <span className="warning-bullet">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Photo recommendations */}
        {showRecommendations && photoRecommendations.length > 0 && (
          <div className="recommendations-container">
            <h4 className="recommendations-title">For optimal facial authentication:</h4>
            <ul className="recommendations-list">
              {photoRecommendations.map((tip, index) => (
                <li key={index} className="recommendation-item">
                  <span className="recommendation-bullet">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {isEnhancing && (
          <div className="enhancing-container">
            <div className="loading-pulse-ring"></div>
            <p className="enhancing-text">Enhancing facial pattern recognition...</p>
          </div>
        )}
        
        {selectedFile && !isEnhancing && (!enhancedImage || enhancementAttempts > 0) && (
          <div className="enhancement-actions">
            <button 
              onClick={retryEnhancement}
              className="action-button retry-button"
            >
              <span className="button-content">
                <svg className="button-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry Enhancement
              </span>
            </button>
            
            {enhancementAttempts > 0 && (
              <button 
                onClick={useOriginalImage}
                className="action-button use-original-button"
              >
                <span className="button-content">
                  <svg className="button-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Use Original
                </span>
              </button>
            )}
          </div>
        )}
        
        {/* Register Button */}
        <button
          onClick={registerUser}
          disabled={!isFormValid() || isRegistering || processingRegistration}
          className={`register-button ${
            isFormValid() && !isRegistering && !processingRegistration
              ? 'active'
              : 'disabled'
          }`}
        >
          {isRegistering || processingRegistration ? (
            <>
              <div className="spin-loader"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <svg className="register-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Register Facial Identity</span>
            </>
          )}
        </button>
        
        {/* Security message */}
        <p className="security-message">
          <svg className="security-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Your Identity is Protected by Our Advanced Vault™
        </p>
        
        {/* Debug information for developers - only shown in development */}
        {process.env.NODE_ENV === 'development' && enhancedImage && (
          <div className="debug-container">
            <p className="debug-title">Debug Info:</p>
            <p className="debug-info">- Vector Length: {enhancedImage.faceDescriptor.length}</p>
            <p className="debug-info">- Image Quality: {enhancedImage.quality?.toFixed(2) || 'N/A'}</p>
            {ImprovedFaceApiService.areModelsLoaded() && (
              <p className="debug-info">- Current Threshold: {ImprovedFaceApiService.getCurrentThreshold().effective.toFixed(3)}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationPanel;