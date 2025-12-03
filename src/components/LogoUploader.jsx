import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import { mdiUpload, mdiLoading, mdiCheck, mdiAlert, mdiDelete } from '@mdi/js';
import { uploadLogo, validateLogoFile } from '../services/logoUploadService';
import { getLogoPath } from '../utils/getLogoPath';

/**
 * LogoUploader Component
 * Reusable component for uploading logos to Supabase Storage
 * 
 * @param {Object} props
 * @param {string} props.currentLogo - Current logo URL or path
 * @param {function} props.onUploadComplete - Callback when upload succeeds (url, path) => void
 * @param {function} props.onDelete - Optional callback when delete is clicked
 * @param {string} props.folder - Storage folder (default: 'companies')
 * @param {string} props.label - Label for the upload button
 * @param {boolean} props.showPreview - Show image preview (default: true)
 * @param {boolean} props.allowDelete - Show delete button (default: false)
 */
export default function LogoUploader({
  currentLogo = '',
  onUploadComplete,
  onDelete,
  folder = 'companies',
  label = 'Upload Logo',
  showPreview = true,
  allowDelete = false
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error' | null
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset status
    setUploadStatus(null);
    setStatusMessage('');

    // Validate
    const validation = validateLogoFile(file);
    if (!validation.valid) {
      setUploadStatus('error');
      setStatusMessage(validation.error);
      return;
    }

    // Upload
    setUploading(true);
    const result = await uploadLogo(file, folder);
    setUploading(false);

    if (result.error) {
      setUploadStatus('error');
      setStatusMessage(result.error);
    } else {
      setUploadStatus('success');
      setStatusMessage('Upload successful!');
      
      // Call parent callback with the URL and path
      if (onUploadComplete) {
        onUploadComplete(result.url, result.path);
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setUploadStatus(null);
        setStatusMessage('');
      }, 3000);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Preview */}
      {showPreview && currentLogo && (
        <div className="flex items-center gap-2 mb-2">
          <img
            {...(() => {
              const s = getResponsiveLogoSources(currentLogo);
              if (s) return { src: s.src, srcSet: s.srcSet, sizes: s.sizes };
              return { src: getLogoPath(currentLogo) };
            })()}
            alt="Current logo"
            className="h-12 w-12 object-contain border rounded p-1"
          />
          {allowDelete && onDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="p-2 text-red-600 hover:bg-red-50 rounded"
              title="Remove logo"
            >
              <Icon path={mdiDelete} size={0.7} />
            </button>
          )}
        </div>
      )}

      {/* Upload Button */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/avif,image/svg+xml"
          onChange={handleFileSelect}
          className="hidden"
          id={`logo-upload-${folder}`}
        />
        <label
          htmlFor={`logo-upload-${folder}`}
          className={`
            flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-xs
            ${uploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}
            text-white transition-colors whitespace-nowrap
          `}
        >
          {uploading ? (
            <>
              <Icon path={mdiLoading} size={0.8} spin />
              Uploading...
            </>
          ) : (
            <>
              <Icon path={mdiUpload} size={0.8} />
              {label}
            </>
          )}
        </label>

        {/* Status indicator */}
        {uploadStatus && (
          <div className="flex items-center gap-2">
            {uploadStatus === 'success' && (
              <div className="flex items-center gap-1 text-green-600">
                <Icon path={mdiCheck} size={0.8} />
                <span className="text-sm">{statusMessage}</span>
              </div>
            )}
            {uploadStatus === 'error' && (
              <div className="flex items-center gap-1 text-red-600">
                <Icon path={mdiAlert} size={0.8} />
                <span className="text-sm">{statusMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Help text */}
      <p className="text-xs text-gray-500">
        Supported: PNG, JPG, WEBP, AVIF, SVG • Max size: 5MB
      </p>
    </div>
  );
}

LogoUploader.propTypes = {
  currentLogo: PropTypes.string,
  onUploadComplete: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  folder: PropTypes.string,
  label: PropTypes.string,
  showPreview: PropTypes.bool,
  allowDelete: PropTypes.bool,
};

LogoUploader.defaultProps = {
  currentLogo: '',
  onDelete: null,
  folder: 'companies',
  label: 'Upload Logo',
  showPreview: true,
  allowDelete: false,
};
