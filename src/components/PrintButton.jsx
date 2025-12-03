import React, { useState, useRef, useEffect } from 'react';
import { MdPrint, MdArrowDropDown } from 'react-icons/md';
import html2canvas from 'html2canvas';

export default function PrintButton({ mapInstance }) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modes, setModes] = useState([]);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!mapInstance || !mapInstance.printControl) {
      setModes([]);
      return;
    }

    // The plugin stores Mode instances in control.options.printModes after
    // initialisation. Read them so we can present the same presets in our
    // React dropdown (keeps UI consistent with control config).
    const controlModes = mapInstance.printControl.options?.printModes || [];
    setModes(Array.isArray(controlModes) ? controlModes : []);
  }, [mapInstance]);

  // Close dropdown when user clicks outside
  useEffect(() => {
    const handler = (e) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [menuOpen]);

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

  const programmaticPrint = async (mode) => {
    if (!mapInstance || !mapInstance.printControl || !mode) return;

    setIsPrinting(true);
    setMenuOpen(false);

    try {
      // The control stores an instance of the BrowserPrint backend at
      // mapInstance.printControl.browserPrint — call its print method with a
      // Mode object. Some versions expose `print` while others use
      // `_printMode` internally; try both.
      const control = mapInstance.printControl;
      const browserPrint = control.browserPrint || control;

      if (typeof browserPrint.print === 'function') {
        browserPrint.print(mode);
      } else if (typeof control._printMode === 'function') {
        control._printMode(mode);
      } else {
        // As a last resort fallback to html2canvas snapshot
        await handlePrint();
      }
    } catch (err) {
      console.error('Programmatic print failed, falling back to snapshot', err);
      await handlePrint();
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        disabled={isPrinting}
        className={`bg-white rounded-full shadow p-2 mb-2 flex items-center justify-center ${isPrinting ? 'opacity-50 cursor-wait' : ''}`}
        aria-label="Print map"
        title="Print map — choose presets"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        type="button"
        style={{ width: 44, height: 44 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MdPrint size={20} color={isPrinting ? '#999' : '#1976d2'} />
          <MdArrowDropDown size={20} color={isPrinting ? '#999' : '#1976d2'} />
        </div>
      </button>

      {menuOpen && (
        <div
          role="menu"
          aria-label="Print presets"
          style={{
            position: 'absolute',
            right: 0,
            top: 48,
            background: 'white',
            borderRadius: 6,
            boxShadow: '0 8px 28px rgba(0,0,0,0.2)',
            zIndex: 1200,
            minWidth: 170,
            overflow: 'hidden',
          }}
        >
          {/* If plugin modes are available show them, otherwise provide a single snapshot fallback */}
          {modes.length > 0 ? (
            <div>
              {modes.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => programmaticPrint(m)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100"
                  type="button"
                >
                  {m?.options?.title || m?.options?.pageSize || `Preset ${idx + 1}`}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <button onClick={handlePrint} className="w-full text-left px-3 py-2 hover:bg-gray-100" type="button">Snapshot (PNG)</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
