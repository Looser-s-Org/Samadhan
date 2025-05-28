import React from 'react';

interface ImagePreviewContainerProps {
  previewImageRef: React.RefObject<HTMLImageElement>;
  enhancedImageRef: React.RefObject<HTMLImageElement>;
}

const ImagePreviewContainer: React.FC<ImagePreviewContainerProps> = ({
  previewImageRef,
  enhancedImageRef
}) => {
  return (
    <div className="image-preview-container">
      <div className="original-image-container">
        <h3 className="image-title">Original Image</h3>
        <div className="image-display">
          <img
            id="uploadPreview"
            className="preview-image hidden"
            alt="Original"
            ref={previewImageRef}
          />
        </div>
      </div>
      
      <div className="enhanced-image-container">
        <h3 className="image-title">Enhanced Image (4x)</h3>
        <div className="image-display">
          <img
            id="enhancedPreview"
            className="preview-image hidden"
            alt="Enhanced"
            ref={enhancedImageRef}
          />
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewContainer;