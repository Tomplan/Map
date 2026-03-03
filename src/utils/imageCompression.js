/**
 * Resize and compress an image file before upload.
 * It maintains aspect ratio and converts to web-friendly format if needed.
 * 
 * @param {File} file - The original image file
 * @param {Object} options - Configuration options
 * @param {number} options.maxWidth - Maximum width in pixels (default: 800)
 * @param {number} options.maxHeight - Maximum height in pixels (default: 800)
 * @param {number} options.quality - Quality (0-1) for JPEG/WebP (default: 0.8)
 * @param {string} options.format - and output format (default: 'image/webp')
 * @returns {Promise<Blob>} - The resized image blob
 */
export const compressImage = (file, options = {}) => {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.85,
    format = 'image/webp'
  } = options;

  return new Promise((resolve, reject) => {
    // If it's an SVG, don't compress
    if (file.type === 'image/svg+xml') {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          // Preserve filename and create a File object (optional, but good for upload APIs expecting File)
          // However, Supabase upload accepts Blob.
          resolve(blob);
        }, format, quality);
      };

      img.onerror = (err) => {
        reject(err);
      };
    };

    reader.onerror = (err) => {
      reject(err);
    };
  });
};
