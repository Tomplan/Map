/**
 * Logo Upload Service
 * Handles file uploads to Supabase Storage for company logos
 */

import { supabase } from '../supabaseClient';
import { compressImage } from '../utils/imageCompression';

const STORAGE_BUCKET = 'Logos'; // Matches the bucket name in Supabase
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/avif',
  'image/svg+xml',
];

/**
 * Upload a logo file to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} folder - Optional subfolder (e.g., 'companies', 'events')
 * @returns {Promise<{url: string, path: string, error: null}|{error: string}>}
 */
export async function uploadLogo(file, folder = 'companies') {
  try {
    // Validate file
    const validation = validateLogoFile(file);
    if (!validation.valid) {
      return { error: validation.error };
    }

    // Compress image if not SVG
    let fileToUpload = file;
    let fileExt = file.name.split('.').pop();
    
    if (file.type !== 'image/svg+xml') {
      try {
        const compressedBlob = await compressImage(file, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.8,
          format: 'image/webp'
        });
        fileToUpload = compressedBlob;
        fileExt = 'webp';
      } catch (err) {
        console.warn('Image compression failed, falling back to original file:', err);
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}_${randomString}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, fileToUpload, {
      cacheControl: '3600',
      upsert: false,
      contentType: fileExt === 'webp' ? 'image/webp' : file.type
    });

    if (error) {
      console.error('Upload error:', error);
      return { error: `Upload failed: ${error.message}` };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    return {
      url: publicUrl,
      path: filePath,
      error: null,
    };
  } catch (err) {
    console.error('Upload service error:', err);
    return { error: `Upload failed: ${err.message}` };
  }
}

/**
 * Validate logo file before upload
 * @param {File} file - The file to validate
 * @returns {{valid: boolean, error: string|null}}
 */
export function validateLogoFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: PNG, JPG, WEBP, AVIF, SVG`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Check if the storage bucket exists and is accessible
 * @returns {Promise<{exists: boolean, error: string|null}>}
 */
export async function checkStorageBucket() {
  try {
    // List all buckets instead of getting specific one (more reliable)
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      return {
        exists: false,
        error: `Error accessing storage: ${error.message}`,
      };
    }

    // Check if our bucket exists in the list
    const bucketExists = data?.some((bucket) => bucket.name === STORAGE_BUCKET);

    if (!bucketExists) {
      return {
        exists: false,
        error: `Storage bucket "${STORAGE_BUCKET}" not found. Available buckets: ${data?.map((b) => b.name).join(', ') || 'none'}`,
      };
    }

    return { exists: true, error: null };
  } catch (err) {
    return {
      exists: false,
      error: `Error checking storage bucket: ${err.message}`,
    };
  }
}
