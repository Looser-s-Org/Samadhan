"use client";
import React, { useState, useRef, useEffect } from 'react';
import { enhanceImage, isImageSuitableForFaceRecognition, getFacePhotoRecommendations } from '@/app/api/ImageEnhancementService';
import LoadingIndicator from '@/app/components/LoadingIndicator';
import LocalStorageService from '@/app/api/LocalStorageService';
import ImprovedFaceApiService from '@/app/api/FaceApiService';
import { detectAadhaarCard } from '@/app/api/Verification'; // Import our Aadhaar verification utility

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

  // Function to verify if the uploaded image is an Aadhaar card
  const verifyAadhaarCard = async (file: File): Promise<boolean> => {
    try {
      setIsVerifyingAadhaar(true);
      updateStatus("Verifying Aadhaar card...", "info");
      
      // Call our Aadhaar verification utility function
      const isValidAadhaar = await detectAadhaarCard(file);
      
      if (isValidAadhaar) {
        updateStatus("Valid Aadhaar card detected.", "success");
        setIsAadhaarCard(true);
      } else {
        updateStatus("This doesn't appear to be an Aadhaar card. Please upload a valid Aadhaar card.", "error");
        setIsAadhaarCard(false);
      }
      
      return isValidAadhaar;
    } catch (error) {
      console.error("Error verifying Aadhaar card:", error);
      updateStatus("Error verifying Aadhaar card. Please try again.", "error");
      setIsAadhaarCard(false);
      return false;
    } finally {
      setIsVerifyingAadhaar(false);
    }
  };

  // Function to handle the initial image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      if (!validateImage(file)) {
        // Reset the input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
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
        isVerifiedAadhaar: isAadhaarCard || false // Add Aadhaar verification status
      };
      
      // Log the face descriptors and threshold for debugging
      console.log('Storing face descriptor of length:', imageData.faceDescriptor.length);
      console.log('Effective threshold for authentication:', recommendedThreshold.toFixed(3));
      console.log('Face quality score:', quality.toFixed(2));
      console.log('Aadhaar verification status:', isAadhaarCard);
      
      // Save to local storage
      LocalStorageService.saveUserData(userData);
      
      // Show success message
      updateStatus('Face data saved! Proceeding with registration...', 'success');
      
      // Call parent's register function now that we've saved the face data
      parentRegisterUser();
    } catch (error) {
      console.error('Error during registration:', error);
      updateStatus('Registration failed. Please try again.', 'error');
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

  return (
    <div className="registration-panel bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Registration</h2>
      
      <div className="space-y-4 mb-6">
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username:
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="text-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number:
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="text-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div className="mb-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/png, image/jpeg, image/jpg"
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="upload-button bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 mb-4 w-full"
          type="button"
        >
          Upload your Aadhaar Card
        </button>

        {/* Aadhaar verification status */}
        {isVerifyingAadhaar && (
          <div className="mb-4">
            <LoadingIndicator message="Verifying Aadhaar card..." />
          </div>
        )}
        
        {isAadhaarCard === true && !isVerifyingAadhaar && (
          <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Valid Aadhaar card verified
            </p>
          </div>
        )}
        
        {isAadhaarCard === false && !isVerifyingAadhaar && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Not a valid Aadhaar card. Please upload a valid Aadhaar card.
            </p>
          </div>
        )}
        
        <div className="image-preview-container mb-4">
          {/* Original image preview */}
          <div className="mb-2">
            <p className="text-sm text-gray-500 mb-1">Original Image:</p>
            <img ref={previewImageRef} alt="Preview" className="w-full hidden rounded-md border border-gray-300" />
          </div>
          
          {/* Enhanced image preview */}
          <div>
            <p className="text-sm text-gray-500 mb-1">Enhanced Image:</p>
            <img ref={enhancedImageRef} alt="Enhanced" className="w-full hidden rounded-md border border-gray-300" />
            
            {/* Face quality indicators */}
            {faceQualityScore !== null && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Face Quality:</span>
                  {faceQualityScore && (
                    <span className={`text-sm font-medium ${getQualityLabel(faceQualityScore).color}`}>
                      {getQualityLabel(faceQualityScore).label} ({(faceQualityScore * 10).toFixed(1)}/10)
                    </span>
                  )}
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className={`rounded-full h-2 ${
                      faceQualityScore > 0.7 ? 'bg-green-500' : 
                      faceQualityScore > 0.5 ? 'bg-green-400' : 
                      faceQualityScore > 0.4 ? 'bg-yellow-500' : 
                      faceQualityScore > 0.3 ? 'bg-orange-500' : 'bg-red-500'
                    }`} 
                    style={{ width: `${Math.max(5, faceQualityScore * 100)}%` }}
                  ></div>
                </div>
                
                {/* Confidence indicator if available */}
                {faceConfidence !== null && (
                  <div className="mt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Detection Confidence:</span>
                      <span className="text-sm">{(faceConfidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-500 rounded-full h-2" 
                        style={{ width: `${Math.max(5, faceConfidence * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Face detection status */}
            {faceDetected === true && (
              <p className="text-sm text-green-600 mt-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Face detected successfully
              </p>
            )}
            
            {faceDetected === false && (
              <p className="text-sm text-red-600 mt-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                No face detected - try another image
              </p>
            )}

            {/* Suitability failure reasons */}
            {suitabilityResult && !suitabilityResult.passes && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm font-medium text-yellow-800">Image quality issues:</p>
                <ul className="text-xs text-yellow-700 pl-2 mt-1">
                  {suitabilityResult.failureReasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-1">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        {/* Photo recommendations */}
        {showRecommendations && photoRecommendations.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-2">For better face recognition:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              {photoRecommendations.map((tip, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-1">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {isEnhancing && 
          <LoadingIndicator message="Enhancing image for optimal face recognition..." />
        }
        
        {selectedFile && !isEnhancing && (!enhancedImage || enhancementAttempts > 0) && (
          <div className="flex gap-2 mb-4">
            <button 
              onClick={retryEnhancement}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md flex-1"
            >
              Retry Enhancement
            </button>
            
            {enhancementAttempts > 0 && (
              <button 
                onClick={useOriginalImage}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md flex-1"
              >
                Use Original
              </button>
            )}
          </div>
        )}
        
        <button
          onClick={registerUser}
          disabled={!isFormValid() || isRegistering || processingRegistration}
          className={`w-full py-2 px-4 rounded-md font-medium transition duration-200 ${
            isFormValid() && !isRegistering && !processingRegistration
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          }`}
        >
          {isRegistering || processingRegistration ? 'Processing...' : 'Register Face'}
        </button>
        
        {/* Debug information for developers */}
        {process.env.NODE_ENV === 'development' && enhancedImage && (
          <div className="mt-4 p-3 bg-gray-100 rounded-md text-xs font-mono">
            <p className="font-medium mb-1">Debug Info:</p>
            <p>- Vector Length: {enhancedImage.faceDescriptor.length}</p>
            <p>- Image Quality: {enhancedImage.quality?.toFixed(2) || 'N/A'}</p>
            {ImprovedFaceApiService.areModelsLoaded() && (
              <p>- Current Threshold: {ImprovedFaceApiService.getCurrentThreshold().effective.toFixed(3)}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationPanel;