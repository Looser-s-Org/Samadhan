// services/SimplifiedImageEnhancer.ts

/**
 * Simplified image pre-processing service for facial recognition
 * Optimized version with core functionality preserved
 */

// Type definitions
type EnhancementResult = {
  dataUrl: string;
  width: number;
  height: number;
  qualityScore: number;
  processingTime: number;
  recommendations: string[];
};

type QualityMetrics = {
  brightness: number;
  contrast: number;
  sharpness: number;
  noise: number;
  faceDetectability: number;
};

/**
 * Enhance an image for facial recognition
 * @param imageSource Image file, blob or URL
 * @returns Promise with enhanced image data and quality assessment
 */
export const enhanceImage = async (
  imageSource: File | Blob | string
): Promise<EnhancementResult> => {
  console.log('Starting facial image enhancement...');
  const startTime = performance.now();
  
  try {
    // Load image into an HTMLImageElement
    const originalImage = await loadImage(imageSource);
    console.log(`Original image: ${originalImage.width}x${originalImage.height}px`);
    
    // Create working canvas for processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    // Calculate and set optimal dimensions
    const optimalSize = calculateOptimalSize(originalImage);
    canvas.width = optimalSize.width;
    canvas.height = optimalSize.height;
    
    // Base image rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    
    // Store original image data for quality comparison
    const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Apply enhancements in sequence
    processImage(ctx, canvas.width, canvas.height);
    
    // Calculate quality metrics
    const qualityAssessment = calculateImageQuality(ctx, canvas.width, canvas.height, originalImageData);
    
    // Get final image as data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    // Generate recommendations
    const recommendations = generateRecommendations(qualityAssessment);
    
    console.log(`Enhancement completed in ${processingTime.toFixed(0)}ms with quality score: ${qualityAssessment.overallScore.toFixed(2)}/1.0`);
    
    return {
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      qualityScore: qualityAssessment.overallScore,
      processingTime,
      recommendations
    };
  } catch (error) {
    console.error('Image enhancement failed:', error);
    throw error;
  }
};

/**
 * Load an image from various sources
 */
const loadImage = (source: File | Blob | string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    
    if (typeof source === 'string') {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
};

/**
 * Calculate optimal size for face recognition processing
 */
const calculateOptimalSize = (img: HTMLImageElement): { width: number, height: number } => {
  const TARGET_SIZE = 416;
  const MIN_SIZE = 256;
  
  const aspectRatio = img.width / img.height;
  
  let width, height;
  
  if (img.width > img.height) {
    width = Math.min(TARGET_SIZE, Math.max(MIN_SIZE, img.width));
    height = Math.round(width / aspectRatio);
  } else {
    height = Math.min(TARGET_SIZE, Math.max(MIN_SIZE, img.height));
    width = Math.round(height * aspectRatio);
  }
  
  // Ensure dimensions are even numbers
  width = Math.floor(width / 2) * 2;
  height = Math.floor(height / 2) * 2;
  
  return { width, height };
};

/**
 * Process image with all enhancement steps
 */
const processImage = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void => {
  // Apply all enhancements in sequence
  normalizeColors(ctx, width, height);
  enhanceContrast(ctx, width, height);
  reduceNoise(ctx, width, height);
  enhanceFacialFeatures(ctx, width, height);
  sharpenDetails(ctx, width, height);
};

/**
 * Normalize colors and lighting
 */
const normalizeColors = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Calculate average color and luminance
  let avgR = 0, avgG = 0, avgB = 0;
  const pixelCount = width * height;
  
  for (let i = 0; i < data.length; i += 4) {
    avgR += data[i];
    avgG += data[i + 1];
    avgB += data[i + 2];
  }
  
  avgR /= pixelCount;
  avgG /= pixelCount;
  avgB /= pixelCount;
  
  // Calculate luminance and correction factor
  const avgLuminance = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
  const correctionFactor = 128 / avgLuminance;
  
  // Apply correction
  for (let i = 0; i < data.length; i += 4) {
    // Apply correction with gamma adjustment (1.05)
    for (let c = 0; c < 3; c++) {
      const normalized = data[i + c] * correctionFactor;
      data[i + c] = Math.min(255, Math.max(0, Math.pow(normalized / 255, 1 / 1.05) * 255));
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
};

/**
 * Enhance contrast using histogram stretching
 */
const enhanceContrast = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Calculate histogram
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const intensity = Math.round(
      data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    );
    histogram[intensity]++;
  }
  
  // Find 5% and 95% points
  const totalPixels = width * height;
  let sum = 0;
  let p5 = 0, p95 = 255;
  
  for (let i = 0; i < 256; i++) {
    sum += histogram[i];
    if (sum / totalPixels <= 0.05) {
      p5 = i;
    }
    if (sum / totalPixels <= 0.95) {
      p95 = i;
    }
  }
  
  // Apply contrast stretch
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const value = data[i + c];
      if (value <= p5) {
        data[i + c] = 0;
      } else if (value >= p95) {
        data[i + c] = 255;
      } else {
        data[i + c] = Math.round(255 * (value - p5) / (p95 - p5));
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
};

/**
 * Apply simplified noise reduction
 */
const reduceNoise = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const tempData = new Uint8ClampedArray(data);
  
  // Simplified bilateral filter
  const radius = 1;
  
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const centerIdx = (y * width + x) * 4;
      
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        let totalWeight = 0;
        const centerValue = tempData[centerIdx + c];
        
        // Process 3x3 neighborhood
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            const neighborIdx = (ny * width + nx) * 4;
            const neighborValue = tempData[neighborIdx + c];
            
            // Calculate weight based on color similarity
            const colorDist = Math.abs(centerValue - neighborValue);
            const weight = Math.exp(-(colorDist * colorDist) / 400);
            
            sum += neighborValue * weight;
            totalWeight += weight;
          }
        }
        
        data[centerIdx + c] = Math.round(sum / totalWeight);
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
};

/**
 * Enhance facial features using edge detection
 */
const enhanceFacialFeatures = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Create grayscale version for edge detection
  const grayData = new Uint8Array(width * height);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    grayData[j] = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
  }
  
  // Simple edge detection
  const edgeData = new Uint8Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      
      // Sobel operator (simplified)
      const gx = 
        grayData[(y-1) * width + (x+1)] - grayData[(y-1) * width + (x-1)] +
        2 * grayData[y * width + (x+1)] - 2 * grayData[y * width + (x-1)] +
        grayData[(y+1) * width + (x+1)] - grayData[(y+1) * width + (x-1)];
      
      const gy = 
        grayData[(y-1) * width + (x-1)] - grayData[(y+1) * width + (x-1)] +
        2 * grayData[(y-1) * width + x] - 2 * grayData[(y+1) * width + x] +
        grayData[(y-1) * width + (x+1)] - grayData[(y+1) * width + (x+1)];
      
      edgeData[idx] = Math.min(255, Math.sqrt(gx * gx + gy * gy));
    }
  }
  
  // Apply edge enhancement
  const edgeThreshold = 40;
  const enhancementStrength = 0.3;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      const edgeValue = edgeData[y * width + x];
      
      if (edgeValue > edgeThreshold) {
        const factor = 1.0 + (enhancementStrength * (edgeValue / 255));
        for (let c = 0; c < 3; c++) {
          data[i + c] = Math.min(255, Math.max(0, Math.round(data[i + c] * factor)));
        }
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
};

/**
 * Sharpen image details
 */
const sharpenDetails = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const tempData = new Uint8ClampedArray(data);
  
  // Simple unsharp mask
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      
      for (let c = 0; c < 3; c++) {
        // Calculate local average (blur)
        const avg = (
          tempData[((y-1) * width + (x-1)) * 4 + c] +
          tempData[((y-1) * width + x) * 4 + c] +
          tempData[((y-1) * width + (x+1)) * 4 + c] +
          tempData[(y * width + (x-1)) * 4 + c] +
          tempData[i + c] +
          tempData[(y * width + (x+1)) * 4 + c] +
          tempData[((y+1) * width + (x-1)) * 4 + c] +
          tempData[((y+1) * width + x) * 4 + c] +
          tempData[((y+1) * width + (x+1)) * 4 + c]
        ) / 9;
        
        // Unsharp mask: add the difference
        const diff = tempData[i + c] - avg;
        const threshold = 10;
        
        if (Math.abs(diff) > threshold) {
          data[i + c] = Math.max(0, Math.min(255, tempData[i + c] + diff * 0.5));
        }
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
};

/**
 * Calculate image quality metrics
 */
const calculateImageQuality = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  originalImageData: ImageData
): {
  overallScore: number;
  brightness: number;
  contrast: number;
  sharpness: number;
  noise: number;
  faceDetectability: number;
} => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Calculate brightness
  let totalBrightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    const luminance = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    totalBrightness += luminance;
  }
  const avgBrightness = totalBrightness / (width * height);
  const normalizedBrightness = Math.max(0, Math.min(1, 1 - Math.abs(128 - avgBrightness) / 128));
  
  // Calculate contrast
  let min = 255, max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const luminance = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    min = Math.min(min, luminance);
    max = Math.max(max, luminance);
  }
  const contrastRange = max - min;
  const normalizedContrast = Math.min(1, contrastRange / 200);
  
  // Calculate noise
  let noiseSum = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      const right = (y * width + (x + 1)) * 4;
      const down = ((y + 1) * width + x) * 4;
      
      for (let c = 0; c < 3; c++) {
        noiseSum += Math.abs(data[i + c] - data[right + c]);
        noiseSum += Math.abs(data[i + c] - data[down + c]);
        count += 2;
      }
    }
  }
  const avgNoise = noiseSum / count;
  const normalizedNoise = Math.max(0, 1 - avgNoise / 20);
  
  // Calculate sharpness
  let edgeSum = 0;
  let edgeCount = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const c = (y * width + x) * 4;
      const l = (y * width + (x - 1)) * 4;
      const r = (y * width + (x + 1)) * 4;
      const t = ((y - 1) * width + x) * 4;
      const b = ((y + 1) * width + x) * 4;
      
      const dx = Math.abs(data[r] - data[l]);
      const dy = Math.abs(data[b] - data[t]);
      
      if (dx > 20 || dy > 20) {
        edgeSum += Math.sqrt(dx * dx + dy * dy);
        edgeCount++;
      }
    }
  }
  const normalizedSharpness = Math.min(1, edgeCount > 0 ? edgeSum / (edgeCount * 50) : 0);
  
  // Calculate face detectability
  const faceDetectability = 
    normalizedContrast * 0.3 + 
    normalizedSharpness * 0.3 + 
    normalizedBrightness * 0.4;
  
  // Overall score
  const overallScore = 
    normalizedBrightness * 0.2 + 
    normalizedContrast * 0.25 + 
    normalizedSharpness * 0.25 + 
    normalizedNoise * 0.15 + 
    faceDetectability * 0.15;
  
  return {
    overallScore,
    brightness: normalizedBrightness,
    contrast: normalizedContrast,
    sharpness: normalizedSharpness,
    noise: normalizedNoise,
    faceDetectability
  };
};

/**
 * Generate recommendations based on quality assessment
 */
const generateRecommendations = (qualityMetrics: QualityMetrics): string[] => {
  const recommendations: string[] = [];
  
  // Base recommendations
  recommendations.push("Face the camera directly with a neutral expression");
  
  // Quality-specific recommendations
  if (qualityMetrics.brightness < 0.7) {
    recommendations.push("Improve lighting conditions - ensure face is well-lit");
  }
  
  if (qualityMetrics.contrast < 0.6) {
    recommendations.push("Increase contrast - avoid flat lighting");
  }
  
  if (qualityMetrics.sharpness < 0.6) {
    recommendations.push("Hold the camera steady and ensure face is in focus");
  }
  
  if (qualityMetrics.noise < 0.7) {
    recommendations.push("Use better lighting to reduce noise in the image");
  }
  
  if (qualityMetrics.faceDetectability < 0.65) {
    recommendations.push("Ensure all facial features are clearly visible");
  }
  
  return recommendations;
};

/**
 * Check if image is suitable for facial recognition
 */
export const isImageSuitableForFaceRecognition = async (
  imageSource: File | Blob | string,
  strictness: number = 0.7
): Promise<{
  passes: boolean;
  qualityScore: number;
  failureReasons: string[];
  recommendations: string[];
}> => {
  try {
    // Enhance and analyze image
    const result = await enhanceImage(imageSource);
    
    // Set thresholds based on strictness
    const thresholds = {
      overall: 0.5 + (strictness * 0.3),
      brightness: 0.4 + (strictness * 0.3),
      contrast: 0.4 + (strictness * 0.3),
      sharpness: 0.4 + (strictness * 0.35),
      noise: 0.5 + (strictness * 0.3),
      faceDetectability: 0.5 + (strictness * 0.4)
    };
    
    // Load image to get quality metrics
    const image = await loadImage(result.dataUrl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Failed to get canvas context');
    
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    
    const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const metrics = calculateImageQuality(ctx, canvas.width, canvas.height, originalImageData);
    
    // Check failures
    const failureReasons: string[] = [];
    
    if (result.qualityScore < thresholds.overall) {
      failureReasons.push(`Overall quality score (${result.qualityScore.toFixed(2)}) below threshold`);
    }
    
    if (metrics.brightness < thresholds.brightness) {
      failureReasons.push(`Image brightness too low`);
    }
    
    if (metrics.contrast < thresholds.contrast) {
      failureReasons.push(`Image contrast too low`);
    }
    
    if (metrics.sharpness < thresholds.sharpness) {
      failureReasons.push(`Image not sharp enough`);
    }
    
    if (metrics.noise < thresholds.noise) {
      failureReasons.push(`Image has too much noise`);
    }
    
    if (metrics.faceDetectability < thresholds.faceDetectability) {
      failureReasons.push(`Facial features not easily detectable`);
    }
    
    return {
      passes: failureReasons.length === 0,
      qualityScore: result.qualityScore,
      failureReasons,
      recommendations: result.recommendations
    };
  } catch (error) {
    console.error('Image suitability check failed:', error);
    throw error;
  }
};

/**
 * Get facial image recommendations
 */
export const getFacePhotoRecommendations = (): string[] => {
  return [
    "Face the camera directly with a neutral expression",
    "Ensure good, even lighting on your face (avoid shadows)",
    "Maintain consistent appearance between photos",
    "Avoid wearing items that obscure facial features",
    "Hold the camera steady and ensure face is in focus",
    "Use a plain background",
    "For best results, take photos in good natural light"
  ];
};