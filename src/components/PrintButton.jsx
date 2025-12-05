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
      const mapContainer =
        document.querySelector('#map-container') || document.querySelector('.leaflet-container');

      if (!mapContainer) {
        console.error('Map container not found');
        setIsPrinting(false);
        return;
      }

      // Wait a moment for any pending tile loads
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Capture the map container as a canvas
      // Convert container to an image using the shared helper (testable)
      const imageDataUrl = await import('../utils/printHelpers').then((m) =>
        m.snapshotElementToDataUrl(mapContainer, { scale: 2 }),
      );

      // Open a new window with just the map image
      const printWindow = window.open('', '_blank', 'width=900,height=700');

      if (!printWindow) {
        console.error('Could not open print window. Check popup blocker settings.');
        setIsPrinting(false);
        return;
      }

      // Avoid document.write; construct DOM safely in the opened window
      const doc = printWindow.document;
      doc.open();

      const head = doc.createElement('head');
      const title = doc.createElement('title');
      title.textContent = 'Map Print';
      const style = doc.createElement('style');
      style.textContent = `*{margin:0;padding:0;box-sizing:border-box}body{display:flex;justify-content:center;align-items:center;min-height:100vh;background:white}img{max-width:100%;max-height:100vh;object-fit:contain}@media print{body{margin:0;padding:0}img{width:100%;height:auto;max-height:none}}`;
      head.appendChild(title);
      head.appendChild(style);

      const body = doc.createElement('body');
      const img = doc.createElement('img');
      img.src = imageDataUrl;
      img.alt = 'Map';
      img.onload = () =>
        setTimeout(() => {
          try {
            printWindow.print();
          } catch (e) {
            /* ignore */
          }
        }, 100);
      body.appendChild(img);

      while (doc.documentElement?.firstChild)
        doc.documentElement.removeChild(doc.documentElement.firstChild);
      doc.documentElement.appendChild(head);
      doc.documentElement.appendChild(body);
      doc.close();

      printWindow.document.close();

      // Clean up after print dialog closes
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    } catch (error) {
      console.error('Print error:', error);
      // Fallback to basic window.print(); alert user that snapshot may be incomplete
      try {
        alert(
          'Snapshot printing failed, likely due to blocked map tiles or cross-origin issues — fallback to browser print. Use header Print Map plugin if available for better results.',
        );
      } catch (e) {
        /* ignore */
      }
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  const programmaticPrint = async (mode) => {
    if (!mapInstance || !mapInstance.printControl || !mode) return;

    setIsPrinting(true);
    setMenuOpen(false);

    const control = mapInstance.printControl;
    const browserPrint = control?.browserPrint || control;

    // If the plugin throws immediately or never emits a PrintStart event,
    // fallback to the snapshot approach after a short timeout.
    let listenersAdded = false;
    let timeoutId = null;
    let started = false;
    let finished = false;

    const cleanupListeners = () => {
      if (!mapInstance || !(window.L && window.L.BrowserPrint && window.L.BrowserPrint.Event))
        return;
      const Ev = window.L.BrowserPrint.Event;
      try {
        mapInstance.off(Ev.PrintStart, onStart);
        mapInstance.off(Ev.PrintEnd, onEnd);
        mapInstance.off(Ev.PrintCancel, onCancel);
      } catch (e) {
        // ignore
      }
      listenersAdded = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const onStart = () => {
      started = true;
    };
    const onEnd = () => {
      finished = true;
      cleanupListeners();
    };
    const onCancel = () => {
      finished = true;
      cleanupListeners();
    };

    try {
      if (window.L && window.L.BrowserPrint && window.L.BrowserPrint.Event) {
        const Ev = window.L.BrowserPrint.Event;
        mapInstance.on(Ev.PrintStart, onStart);
        mapInstance.on(Ev.PrintEnd, onEnd);
        mapInstance.on(Ev.PrintCancel, onCancel);
        listenersAdded = true;
      }

      // Try to trigger the plugin's print path.
      try {
        if (typeof browserPrint.print === 'function') {
          browserPrint.print(mode);
        } else if (typeof control?._printMode === 'function') {
          control._printMode(mode);
        } else {
          // No programmatic plugin API available — fallback immediately.
          throw new Error('No browser print API available');
        }
      } catch (callErr) {
        console.warn('BrowserPrint call failed:', callErr);
        // Immediate failure — fallback to snapshot
        cleanupListeners();
        await handlePrint();
        return;
      }

      // Wait for either a start or a short timeout. If printing never starts
      // within 2.5s, fall back to the snapshot method (common symptom of
      // runtime cloning errors inside the plugin).
      const waitForStart = () =>
        new Promise((resolve) => {
          if (started) return resolve('started');
          timeoutId = setTimeout(() => resolve('timeout'), 2500);
          const poll = setInterval(() => {
            if (started || finished) {
              clearInterval(poll);
              if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
              }
              resolve(started ? 'started' : 'finished');
            }
          }, 80);
        });

      const result = await waitForStart();
      if (result === 'timeout') {
        console.warn('BrowserPrint did not start; falling back to snapshot export');
        cleanupListeners();
        await handlePrint();
      }

      // If started, we let the plugin handle the rest — PrintEnd handler will cleanup.
    } finally {
      // Ensure we always stop showing busy state. If the plugin produced the
      // print dialog, the browser will block further JS while the user handles it.
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
              <button
                onClick={handlePrint}
                className="w-full text-left px-3 py-2 hover:bg-gray-100"
                type="button"
              >
                Snapshot (PNG)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
