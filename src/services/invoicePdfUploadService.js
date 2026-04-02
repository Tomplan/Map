/**
 * Invoice PDF Upload Service
 * Handles uploading invoice PDFs to a PRIVATE Supabase Storage bucket.
 * PDFs are accessed via short-lived signed URLs (admin-only).
 */

import { supabase } from '../supabaseClient';

const STORAGE_BUCKET = 'invoices';
const SIGNED_URL_EXPIRY = 60 * 60; // 1 hour in seconds

/**
 * Upload an invoice PDF to Supabase Storage.
 * The file is stored under its invoice number so it can be looked up easily.
 *
 * @param {File} file - The PDF file to upload
 * @param {string} invoiceNumber - The parsed invoice number (used as file name)
 * @returns {Promise<{path: string, error: null}|{path: null, error: string}>}
 */
export async function uploadInvoicePdf(file, invoiceNumber) {
  try {
    if (!file || !invoiceNumber) {
      return { path: null, error: 'Missing file or invoice number' };
    }

    // Sanitise invoice number for use as a filename (remove path-unsafe chars)
    const safeName = invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = `${safeName}.pdf`;

    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file, {
      cacheControl: '86400',
      upsert: true, // overwrite if re-imported
      contentType: 'application/pdf',
    });

    if (error) {
      console.error('Invoice PDF upload error:', error);
      return { path: null, error: error.message };
    }

    return { path: filePath, error: null };
  } catch (err) {
    console.error('Invoice PDF upload service error:', err);
    return { path: null, error: err.message };
  }
}

/**
 * Create a short-lived signed URL for a private invoice PDF.
 *
 * @param {string} storagePath - The path inside the invoices bucket (e.g. "2026001.pdf")
 * @returns {Promise<string|null>} The signed URL, or null on failure
 */
export async function getSignedInvoiceUrl(storagePath) {
  if (!storagePath) return null;
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRY);

    if (error) {
      console.error('Signed URL error:', error);
      return null;
    }
    return data?.signedUrl || null;
  } catch (err) {
    console.error('Signed URL service error:', err);
    return null;
  }
}
