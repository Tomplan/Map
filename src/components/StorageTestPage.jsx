import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import LogoUploader from './LogoUploader';
import { checkStorageBucket } from '../services/logoUploadService';

/**
 * StorageTestPage - Test and verify Supabase Storage setup
 *
 * This component helps admins verify that:
 * 1. The 'logos' bucket exists
 * 2. Upload functionality works
 * 3. Public access is configured correctly
 * 4. Policies are set up properly
 */
export default function StorageTestPage() {
  const [bucketStatus, setBucketStatus] = useState({ checking: true, exists: false, error: null });
  const [testLogo, setTestLogo] = useState('');
  const [uploadResults, setUploadResults] = useState([]);
  const [user, setUser] = useState(null);

  // Check bucket on mount
  useEffect(() => {
    checkBucket();
    checkAuth();
  }, []);

  const checkBucket = async () => {
    setBucketStatus({ checking: true, exists: false, error: null });
    const result = await checkStorageBucket();
    setBucketStatus({
      checking: false,
      exists: result.exists,
      error: result.error,
    });
  };

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
  };

  const handleTestUpload = (url, path) => {
    setTestLogo(url);
    setUploadResults([
      {
        timestamp: new Date().toISOString(),
        url,
        path,
        success: true,
      },
      ...uploadResults,
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Supabase Storage Test Page</h1>

      {/* Authentication Status */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-3">Authentication Status</h2>
        {user ? (
          <div className="text-green-600 flex items-center gap-2">
            <span>✅</span>
            <span>Authenticated as: {user.email}</span>
          </div>
        ) : (
          <div className="text-red-600 flex items-center gap-2">
            <span>❌</span>
            <span>Not authenticated - Please log in first</span>
          </div>
        )}
      </div>

      {/* Bucket Status */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Storage Bucket Status</h2>
          <button
            onClick={checkBucket}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Recheck
          </button>
        </div>

        {bucketStatus.checking ? (
          <div className="text-gray-600">Checking bucket...</div>
        ) : bucketStatus.exists ? (
          <div className="text-green-600 flex items-center gap-2">
            <span>✅</span>
            <span>Bucket 'logos' exists and is accessible</span>
          </div>
        ) : (
          <div>
            <div className="text-red-600 flex items-center gap-2 mb-2">
              <span>❌</span>
              <span>Bucket 'logos' not found or inaccessible</span>
            </div>
            {bucketStatus.error && (
              <div className="text-sm text-gray-600 ml-6">Error: {bucketStatus.error}</div>
            )}
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <p className="font-semibold mb-2">Setup Required:</p>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Go to Supabase Dashboard → Storage</li>
                <li>Create a new public bucket named 'logos'</li>
                <li>Set up RLS policies (see SUPABASE_STORAGE_SETUP.md)</li>
                <li>Refresh this page</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Test Upload */}
      {user && bucketStatus.exists && (
        <div className="mb-6 p-4 border rounded-lg bg-white">
          <h2 className="text-xl font-semibold mb-3">Test Logo Upload</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload a test image to verify everything works correctly.
          </p>

          <LogoUploader
            currentLogo={testLogo}
            onUploadComplete={handleTestUpload}
            folder="test"
            label="Upload Test Image"
            showPreview={true}
            allowDelete={true}
            onDelete={() => setTestLogo('')}
          />
        </div>
      )}

      {/* Upload History */}
      {uploadResults.length > 0 && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-3">Upload History</h2>
          <div className="space-y-2">
            {uploadResults.map((result, idx) => (
              <div key={idx} className="p-3 bg-white rounded border text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-600 font-semibold">✓ Success</span>
                  <span className="text-gray-500">
                    {new Date(result.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-gray-600">
                  <div>
                    <strong>URL:</strong> {result.url}
                  </div>
                  <div>
                    <strong>Path:</strong> {result.path}
                  </div>
                </div>
                {result.url && (
                  <img
                    src={result.url}
                    alt="Uploaded"
                    className="mt-2 h-20 object-contain border rounded"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documentation Link */}
      <div className="p-4 border rounded-lg bg-blue-50">
        <h2 className="text-xl font-semibold mb-2">Documentation</h2>
        <p className="text-sm text-gray-700 mb-2">For complete setup instructions, see:</p>
        <ul className="list-disc ml-5 text-sm text-gray-700">
          <li>SUPABASE_STORAGE_SETUP.md - Bucket configuration and policies</li>
          <li>LOGO_UPLOADER_INTEGRATION.md - Integration examples</li>
        </ul>
      </div>
    </div>
  );
}
