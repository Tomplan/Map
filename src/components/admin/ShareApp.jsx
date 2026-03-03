import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import Icon from '@mdi/react';
import { mdiQrcode, mdiDownload, mdiRefresh } from '@mdi/js';

const ShareApp = () => {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use the homepage from package.json or hardcode the known URL
  const APP_URL = 'https://tomplan.github.io/Map/';
  
  // Path to the logo in public folder
  // Using BASE_URL ensures it works on GitHub Pages subpath
  // Ensure we have a trailing slash for the base url
  const baseUrl = import.meta.env.BASE_URL.endsWith('/') 
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
    
  const LOGO_PATH = `${baseUrl}assets/logos/4x4Vakantiebeurs_FClogo_2026.png`;

  const generateQRCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // 1. Generate QR code on the canvas
      await QRCode.toCanvas(canvas, APP_URL, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'H', // High error correction to allow for logo coverage
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      // 2. Clear the center for the logo
      const ctx = canvas.getContext('2d');
      const size = 300;
      const logoSize = 60; // 20% of size is safe for 'H' error correction
      const logoPos = (size - logoSize) / 2;

      // 3. Load and draw the logo
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Important for canvas export if hosted externally
      img.src = LOGO_PATH;

      img.onload = () => {
        // Draw white background for logo ensuring it's clearly visible
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(logoPos - 2, logoPos - 2, logoSize + 4, logoSize + 4);
        
        // Draw logo
        ctx.drawImage(img, logoPos, logoPos, logoSize, logoSize);
        setLoading(false);
      };

      img.onerror = (err) => {
        console.error('Failed to load logo', err);
        // Even if logo fails, we have the QR code
        setError('Logo failed to load, but QR code is valid.');
        setLoading(false);
      };

    } catch (err) {
      console.error('QR Generation failed', err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    generateQRCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'event-map-qr.png';
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed', err);
      alert('Could not download image. Right-click the QR code to save it.');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <Icon path={mdiQrcode} size={1.5} className="text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">
            {t('shareApp.title', 'Share App')}
          </h2>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
          
          <div className="relative group">
            <div className={`transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
              <canvas 
                ref={canvasRef} 
                className="shadow-md rounded-md border border-gray-200"
              />
            </div>
            
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            
            {error && (
               <div className="text-amber-600 text-xs text-center mt-2 max-w-[300px]">{error}</div>
            )}
          </div>

          <div className="space-y-6 max-w-md">
            <div>
              <h3 className="text-lg font-semibold mb-2">{t('shareApp.appUrl', 'Application URL')}</h3>
              <p className="bg-gray-50 p-3 rounded border border-gray-200 text-blue-600 break-all font-mono text-sm">
                <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {APP_URL}
                </a>
              </p>
            </div>

            <p className="text-gray-600 border-l-4 border-blue-100 pl-4 italic">
              {t('shareApp.qrDescription', 'Scan this QR code to open the map directly on your mobile device. The code includes the event logo and points to the secure HTTPS version.')}
            </p>

            <div className="flex gap-4 pt-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition shadow-sm font-medium"
                disabled={loading}
              >
                <Icon path={mdiDownload} size={0.8} />
                {t('shareApp.downloadPng', 'Download PNG')}
              </button>

              <button
                onClick={generateQRCode}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition border border-gray-300 font-medium"
                disabled={loading}
              >
                <Icon path={mdiRefresh} size={0.8} />
                {t('common.refresh', 'Regenerate')}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ShareApp;
