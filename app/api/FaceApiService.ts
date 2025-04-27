// services/ImprovedFaceApiService.ts

/**
 * Enhanced service for facial recognition with more reliable matching
 */
export default class ImprovedFaceApiService {
  private static faceapi: any = null;
  private static isModelLoaded: boolean = false;
  
  // Dynamic threshold system - MODIFIED VALUES
  private static baseThreshold: number = 0.45; // Reduced from 0.6 to make matching stricter
  private static qualityModifier: number = 0; // Modified based on image quality

  /**
   * Load the face-api.js models from CDN
   */
  static async loadModels(): Promise<void> {
    try {
      console.log("Loading face-api.js models...");
      
      if (typeof (window as any).faceapi === 'undefined') {
        throw new Error('Face API library not loaded');
      }
      
      this.faceapi = (window as any).faceapi;
      // Using a reliable CDN
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.2/model/';
      
      // Load all required models in parallel
      await Promise.all([
        this.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        this.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        this.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      
      console.log('Face-api models loaded successfully');
      this.isModelLoaded = true;
    } catch (error: any) {
      console.error('Error loading models:', error);
      throw new Error(`Failed to load face-api models: ${error.message}`);
    }
  }

  /**
   * Check if models are loaded
   */
  static areModelsLoaded(): boolean {
    return this.isModelLoaded;
  }

  /**
   * Get face descriptor from an image with adaptive quality assessment
   */
  static async getFaceDescriptor(imageElement: HTMLImageElement): Promise<{
    descriptor: Float32Array,
    quality: number,
    confidence: number
  }> {
    try {
      if (!this.isModelLoaded) {
        await this.loadModels();
      }

      // Use optimal detection parameters - Increased scoreThreshold for higher confidence
      const detectionOptions = new this.faceapi.TinyFaceDetectorOptions({ 
        inputSize: 416, // Higher resolution for better results
        scoreThreshold: 0.5  // Increased from 0.4 to require higher confidence
      });
      
      // Full face detection with landmarks and descriptor
      const result = await this.faceapi
        .detectSingleFace(imageElement, detectionOptions)
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (!result) {
        throw new Error('No face detected');
      }

      // Calculate quality metrics based on face detection results
      const quality = this.assessImageQuality(result);
      
      // Adjust threshold based on quality - Modified to make low quality images have stricter matching
      this.qualityModifier = Math.max(-0.15, Math.min(0.1, (0.5 - quality) * 0.5));
      
      return {
        descriptor: result.descriptor,
        quality,
        confidence: result.detection.score
      };
    } catch (error: any) {
      console.error('Error getting face descriptor:', error);
      throw error;
    }
  }
  
  /**
   * Assess the quality of the face detection
   */
  private static assessImageQuality(faceDetectionResult: any): number {
    // Get detection score as base quality
    const detectionScore = faceDetectionResult.detection.score;
    
    // Analyze landmarks for stability
    const landmarks = faceDetectionResult.landmarks.positions;
    let symmetryScore = 0;
    
    // Calculate face symmetry (a good quality indicator)
    if (landmarks && landmarks.length > 0) {
      // Find center of face using landmarks
      const centerX = landmarks.reduce((sum: number, point: any) => sum + point.x, 0) / landmarks.length;
      
      // Calculate symmetry by comparing points on opposite sides
      const leftSide = landmarks.filter((p: any) => p.x < centerX);
      const rightSide = landmarks.filter((p: any) => p.x > centerX);
      
      // Matching points on opposite sides should be roughly equidistant from center
      let totalDiff = 0;
      const minSideLength = Math.min(leftSide.length, rightSide.length);
      
      for (let i = 0; i < minSideLength; i++) {
        totalDiff += Math.abs((centerX - leftSide[i].x) - (rightSide[i].x - centerX));
      }
      
      // Calculate symmetry score (0-1, higher is better)
      symmetryScore = 1 - Math.min(1, totalDiff / (centerX * minSideLength));
    }
    
    // Calculate overall quality score (0-1) - Adjusted weights
    const qualityScore = (detectionScore * 0.8) + (symmetryScore * 0.2);
    
    console.log('Face quality assessment:', {
      detectionConfidence: detectionScore.toFixed(2),
      symmetryScore: symmetryScore.toFixed(2),
      overallQuality: qualityScore.toFixed(2)
    });
    
    return qualityScore;
  }

  /**
   * Compare two face descriptors with adaptive thresholding
   */
  static compareFaces(descriptor1: Float32Array | number[], descriptor2: Float32Array | number[]): {
    distance: number;
    matches: boolean;
    similarity: number;
    threshold: number;
    details: any;
  } {
    // Ensure descriptors are Float32Array
    const desc1 = descriptor1 instanceof Float32Array ? descriptor1 : new Float32Array(descriptor1);
    const desc2 = descriptor2 instanceof Float32Array ? descriptor2 : new Float32Array(descriptor2);

    // Calculate distance
    const distance = this.faceapi.euclideanDistance(desc1, desc2);
    
    // Calculate final threshold with quality adjustment
    const finalThreshold = this.baseThreshold + this.qualityModifier;

    // Calculate similarity percentage (inverse of distance)
    const similarity = Math.max(0, Math.min(100, (1 - distance / 1.4) * 100));
    
    // Determine if faces match using adaptive threshold
    const matches = distance <= finalThreshold;
    
    // Detailed comparison information with explanations
    const details = {
      baseThreshold: this.baseThreshold,
      qualityModifier: this.qualityModifier,
      finalThreshold: finalThreshold,
      distance: distance,
      normalizedDistance: distance / 2, // Normalized to 0-1 scale
      recommendation: this.getMatchRecommendation(distance, finalThreshold),
      confidenceLevel: this.getConfidenceLevel(distance, finalThreshold)
    };

    // Log comparison details for debugging
    console.log('Face comparison results:', {
      distance: distance.toFixed(4),
      similarity: similarity.toFixed(2) + '%',
      threshold: finalThreshold.toFixed(4),
      matches: matches ? 'YES' : 'NO',
      details
    });

    return {
      distance,
      matches,
      similarity,
      threshold: finalThreshold,
      details
    };
  }
  
  /**
   * Get match recommendation based on distance and threshold
   */
  private static getMatchRecommendation(distance: number, threshold: number): string {
    // Stricter margins for recommendations
    const strongMargin = 0.08;
    const moderateMargin = 0.04;
    
    if (distance <= threshold - strongMargin) {
      return "Strong match - very confident";
    } else if (distance <= threshold - moderateMargin) {
      return "Match - moderately confident";
    } else if (distance <= threshold) {
      return "Borderline match - low confidence";
    } else if (distance <= threshold + moderateMargin) {
      return "Possible match - very low confidence";
    } else {
      return "Not a match";
    }
  }

  /**
   * Get confidence level as a percentage
   */
  private static getConfidenceLevel(distance: number, threshold: number): number {
    // Range from threshold to threshold - 0.2 maps to 0-100%
    // The closer the distance is to (threshold - 0.2), the higher the confidence
    const maxDistance = threshold;
    const minDistance = Math.max(0, threshold - 0.2);
    
    if (distance > maxDistance) return 0;
    if (distance < minDistance) return 100;
    
    // Linear mapping from distance to confidence
    return 100 - ((distance - minDistance) / (maxDistance - minDistance) * 100);
  }

  /**
   * Set the base threshold value (0.4-0.8 recommended)
   * Lower values = stricter matching, higher values = more permissive
   */
  static setBaseThreshold(threshold: number): void {
    // Constrained to a narrower range of reasonable values
    this.baseThreshold = Math.max(0.4, Math.min(0.6, threshold));
    console.log(`Base threshold set to: ${this.baseThreshold}`);
  }

  /**
   * Get the current effective threshold
   */
  static getCurrentThreshold(): {base: number, quality: number, effective: number} {
    return {
      base: this.baseThreshold,
      quality: this.qualityModifier,
      effective: this.baseThreshold + this.qualityModifier
    };
  }
  
  /**
   * Create an image element from URL, blob or file
   */
  static async createImageElement(imageSource: string | Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      
      if (typeof imageSource === 'string') {
        img.src = imageSource;
      } else {
        img.src = URL.createObjectURL(imageSource);
      }
    });
  }
  
  /**
   * Get a recommended threshold from sample images
   * This helps calibrate the system with the user's specific face
   */
  static async generateOptimalThreshold(
    referenceImages: (HTMLImageElement | string | Blob)[],
    iterations: number = 3
  ): Promise<number> {
    if (referenceImages.length < 2) {
      throw new Error('Need at least 2 reference images to calculate threshold');
    }
    
    console.log('Generating optimal threshold from reference images...');
    
    try {
      // Load all images
      const images: HTMLImageElement[] = [];
      for (const imgSrc of referenceImages) {
        if (imgSrc instanceof HTMLImageElement) {
          images.push(imgSrc);
        } else {
          const img = await this.createImageElement(imgSrc);
          images.push(img);
        }
      }
      
      // Extract descriptors
      const descriptors: Float32Array[] = [];
      for (const img of images) {
        const result = await this.getFaceDescriptor(img);
        descriptors.push(result.descriptor);
      }
      
      // Calculate distances between all pairs
      const distances: number[] = [];
      for (let i = 0; i < descriptors.length; i++) {
        for (let j = i + 1; j < descriptors.length; j++) {
          const distance = this.faceapi.euclideanDistance(descriptors[i], descriptors[j]);
          distances.push(distance);
        }
      }
      
      // Calculate statistics
      distances.sort((a, b) => a - b);
      const meanDistance = distances.reduce((sum, val) => sum + val, 0) / distances.length;
      const medianDistance = distances[Math.floor(distances.length / 2)];
      const maxDistance = distances[distances.length - 1];
      
      // Calculate optimal threshold with less margin for stricter matching
      // Reduced multiplier from 1.2 to 1.1
      const optimalThreshold = meanDistance * 1.1;
      
      console.log('Threshold calculation results:', {
        samples: descriptors.length,
        pairs: distances.length,
        meanDistance: meanDistance.toFixed(4),
        medianDistance: medianDistance.toFixed(4),
        maxDistance: maxDistance.toFixed(4),
        recommendedThreshold: optimalThreshold.toFixed(4)
      });
      
      // Set the new base threshold
      this.setBaseThreshold(optimalThreshold);
      
      return optimalThreshold;
    } catch (error) {
      console.error('Error generating threshold:', error);
      throw error;
    }
  }
}