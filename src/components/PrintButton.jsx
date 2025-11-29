import React, { useState } from 'react';
import { MdPrint } from 'react-icons/md';
import html2canvas from 'html2canvas';

export default function PrintButton({ mapInstance }) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    if (!mapInstance || isPrinting) return;

    setIsPrinting(true);

    try {
      // Find the map container element
      const mapContainer = document.querySelector('#map-container') 
        || document.querySelector('.leaflet-container');

      if (!mapContainer) {
        console.error('Map container not found');
        setIsPrinting(false);
        return;
      }

      // Wait a moment for any pending tile loads
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capture the map container as a canvas
      const canvas = await html2canvas(mapContainer, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality for print
        // Ignore elements that shouldn't be printed
        ignoreElements: (element) => {
          return element.classList?.contains('map-controls-print-hide') ||
                 element.classList?.contains('leaflet-control-zoom') ||
                 element.classList?.contains('leaflet-control-minimap');
        }
      });

      // Convert canvas to image data URL
      const imageDataUrl = canvas.toDataURL('image/png', 1.0);

      // Open a new window with just the map image
      const printWindow = window.open('', '_blank', 'width=900,height=700');
      
      if (!printWindow) {
        console.error('Could not open print window. Check popup blocker settings.');
        setIsPrinting(false);
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Map Print</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: white;
            }
            img {
              max-width: 100%;
              max-height: 100vh;
              object-fit: contain;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              img {
                width: 100%;
                height: auto;
                max-height: none;
              }
            }
          </style>
        </head>
        <body>
          <img src="${imageDataUrl}" alt="Map" onload="setTimeout(function() { window.print(); }, 100);" />
        </body>
        </html>
      `);

      printWindow.document.close();

      // Clean up after print dialog closes
      printWindow.onafterprint = () => {
        printWindow.close();
      };

    } catch (error) {
      console.error('Print error:', error);
      // Fallback to basic window.print()
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <button
      onClick={handlePrint}
      disabled={isPrinting}
      className={`bg-white rounded-full shadow p-2 mb-2 flex items-center justify-center ${isPrinting ? 'opacity-50 cursor-wait' : ''}`}
      aria-label="Print map"
      title="Print map"
      type="button"
      style={{ width: 44, height: 44 }}
    >
      <MdPrint size={24} color={isPrinting ? '#999' : '#1976d2'} />
    </button>
  );
}
