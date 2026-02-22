import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import {
  mdiMagnify,
  mdiLock,
  mdiLockOpenVariant,
  mdiContentSave,
  mdiClose,
  mdiChevronUp,
  mdiChevronDown,
  mdiChevronLeft,
  mdiChevronRight,
  mdiContentCopy,
  mdiArchive,
  mdiEye,
  mdiPrinter,
} from '@mdi/js';
import ProtectedSection from '../ProtectedSection';
import { getIconPath } from '../../utils/getIconPath';
import { getLogoPath, getResponsiveLogoSources } from '../../utils/getLogoPath';
import { ICON_OPTIONS } from '../../config/markerTabsConfig';
import { supabase } from '../../supabaseClient';
import EventMap from '../EventMap/EventMap';
import html2canvas from 'html2canvas';
import { useDialog } from '../../contexts/DialogContext';
import useUserRole from '../../hooks/useUserRole';
import useEventSubscriptions from '../../hooks/useEventSubscriptions';
import useAssignments from '../../hooks/useAssignments';

/**
 * MapManagement - Unified interface for managing marker positions, styling, and content
 * System Managers and Super Admins: Full editing capabilities
 * Event Managers: Read-only view for assignments and printing
 * Features: Marker list, interactive map, and detail/edit panel
 */
export default function MapManagement({
  markersState,
  setMarkersState,
  updateMarker,
  selectedYear,
  archiveMarkers,
  copyMarkers,
}) {
  const { t } = useTranslation();
  const { isEventManager, isSystemManager, isSuperAdmin } = useUserRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const [sortBy, setSortBy] = useState('id'); // id, name, type
  const [sortDirection, setSortDirection] = useState('asc'); // asc, desc
  const [defaultMarkers, setDefaultMarkers] = useState([]); // Defaults for booth markers (IDs -1, -2)
  const { confirm, toastError, toastSuccess } = useDialog();
  const [mapInstance, setMapInstance] = useState(null);
  const [printMenuOpen, setPrintMenuOpen] = useState(false);
  const [printModes, setPrintModes] = useState([]);
  const [isPrintingHeader, setIsPrintingHeader] = useState(false);

  // Collapse state for sidebars
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false); // Default to closed for Markers
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true); // Default to open for Subscriptions

  // Resizing state
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(384); // Default w-96 (384px)
  const [rightSidebarWidth, setRightSidebarWidth] = useState(384); // Default w-96 (384px)
  const [listSplitRatio, setListSplitRatio] = useState(0.5); // Default 50% split (Left)
  const [rightListSplitRatio, setRightListSplitRatio] = useState(0.4); // Default 40% split for List (60% for Details)
  const [isResizing, setIsResizing] = useState(null); // 'left', 'right', 'split-left', 'split-right'

  // Subscriptions state
  const { subscriptions: rawSubscriptions, loading: loadingSubscriptions } =
    useEventSubscriptions(selectedYear);
  const { assignments } = useAssignments(selectedYear);
  const [subscriptionSearch, setSubscriptionSearch] = useState('');
  const [subscriptionSortBy, setSubscriptionSortBy] = useState('name'); // name, booths, assigned
  const [subscriptionSortDirection, setSubscriptionSortDirection] = useState('asc'); // asc, desc
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(null);

  // Filter and Sort subscriptions
  const filteredSubscriptions = useMemo(() => {
    if (!rawSubscriptions) return [];
    
    // Create a shallow copy to execute sort
    let result = [...rawSubscriptions];
    
    if (subscriptionSearch) {
      const lower = subscriptionSearch.toLowerCase();
      result = result.filter((sub) => {
        const coName = sub.company?.name || '';
        return coName.toLowerCase().includes(lower);
      });
    }

    // Then Sort
    return result.sort((a, b) => {
      let valA, valB;

      switch (subscriptionSortBy) {
        case 'name':
          valA = a.company?.name || '';
          valB = b.company?.name || '';
          return subscriptionSortDirection === 'asc' 
            ? ((valA || '').localeCompare(valB || '')) 
            : ((valB || '').localeCompare(valA || ''));
        
        case 'booths':
          valA = a.booth_count || 0;
          valB = b.booth_count || 0;
          return subscriptionSortDirection === 'asc' ? valA - valB : valB - valA;
          
        case 'assigned':
          const isAssignedA = assignments?.some((as) => as.company_id === a.company?.id) ? 1 : 0;
          const isAssignedB = assignments?.some((as) => as.company_id === b.company?.id) ? 1 : 0;
          return subscriptionSortDirection === 'asc' ? isAssignedA - isAssignedB : isAssignedB - isAssignedA;
          
        default:
          return 0;
      }
    });
  }, [rawSubscriptions, assignments, subscriptionSearch, subscriptionSortBy, subscriptionSortDirection]);

  const selectedSubscription = useMemo(
    () => rawSubscriptions?.find((s) => s.id === selectedSubscriptionId),
    [rawSubscriptions, selectedSubscriptionId],
  );

  // Handle global mouse events for resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      e.preventDefault();

      if (isResizing === 'left') {
        const newWidth = Math.max(250, Math.min(800, e.clientX));
        setLeftSidebarWidth(newWidth);
      } else if (isResizing === 'right') {
        const newWidth = Math.max(200, Math.min(600, window.innerWidth - e.clientX));
        setRightSidebarWidth(newWidth);
      } else if (isResizing === 'split-left') {
        // Approx header height + padding offset
        const containerTop = 144;
        const containerHeight = window.innerHeight - containerTop;
        const relativeY = e.clientY - containerTop;
        const rawRatio = relativeY / containerHeight;
        const newRatio = Math.max(0.2, Math.min(0.8, rawRatio));
        setListSplitRatio(newRatio);
      } else if (isResizing === 'split-right') {
        const containerTop = 144;
        const containerHeight = window.innerHeight - containerTop;
        const relativeY = e.clientY - containerTop;
        const rawRatio = relativeY / containerHeight;
        const newRatio = Math.max(0.2, Math.min(0.8, rawRatio));
        setRightListSplitRatio(newRatio);
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(null);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = '';
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none'; // Prevent selection
      document.body.style.cursor = isResizing.startsWith('split') ? 'row-resize' : 'col-resize';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = 'default';
    };
  }, [isResizing]);

  // Event managers have read-only access
  const isReadOnly = isEventManager;

  // Fetch default markers on mount
  useEffect(() => {
    async function fetchDefaults() {
      try {
        // Fetch both Core and Appearance data for defaults (defaults use event_year = 0)
        const [coreRes, appearanceRes] = await Promise.all([
          supabase.from('markers_core').select('*').in('id', [-1, -2]).eq('event_year', 0),
          supabase.from('markers_appearance').select('*').in('id', [-1, -2]).eq('event_year', 0),
        ]);

        if (coreRes.error) throw coreRes.error;
        if (appearanceRes.error) throw appearanceRes.error;

        // Merge Core and Appearance data
        const merged = (coreRes.data || []).map((core) => {
          const appearance = (appearanceRes.data || []).find((a) => a.id === core.id) || {};
          return { ...core, ...appearance };
        });

        setDefaultMarkers(merged);
      } catch (error) {
        console.error('Error fetching default markers:', error);
      }
    }

    fetchDefaults();
  }, []);

  // Filter and sort markers (including defaults at the top)
  const filteredMarkers = useMemo(() => {
    if (!markersState) return defaultMarkers;

    // Filter regular markers by search term
    let filtered = markersState.filter((marker) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        marker.id.toString().includes(searchLower) ||
        marker.glyph?.toLowerCase().includes(searchLower) ||
        marker.name?.toLowerCase().includes(searchLower)
      );
    });

    // Sort regular markers
    const sorted = [...filtered].sort((a, b) => {
      let result = 0;
      switch (sortBy) {
        case 'id':
          result = a.id - b.id;
          break;
        case 'name':
          result = (a.glyph || a.name || '').localeCompare(b.glyph || b.name || '');
          break;
        case 'type':
          // Special markers (>= 1000) first, then booths
          if (a.id >= 1000 !== b.id >= 1000) {
            result = a.id >= 1000 ? -1 : 1;
          } else {
            result = a.id - b.id;
          }
          break;
        default:
          result = a.id - b.id;
      }
      return sortDirection === 'desc' ? -result : result;
    });

    // If no search term, prepend defaults at the top (sorted by ID descending: -1, -2)
    if (!searchTerm) {
      const sortedDefaults = [...defaultMarkers].sort((a, b) => b.id - a.id);
      return [...sortedDefaults, ...sorted];
    }

    return sorted;
  }, [markersState, defaultMarkers, searchTerm, sortBy, sortDirection]);

  // Get selected marker (check both regular markers and defaults)
  const selectedMarker = useMemo(() => {
    if (!selectedMarkerId) return null;
    // Check defaults first
    const defaultMarker = defaultMarkers.find((m) => m.id === selectedMarkerId);
    if (defaultMarker) return defaultMarker;
    // Then check regular markers
    return markersState?.find((m) => m.id === selectedMarkerId);
  }, [selectedMarkerId, markersState, defaultMarkers]);

  // Handle marker selection
  const handleSelectMarker = (marker) => {
    if (selectedMarkerId === marker.id) {
      setSelectedMarkerId(null);
      setSelectedSubscriptionId(null);
    } else {
      setSelectedMarkerId(marker.id);
      // Sync subscription selection
      const assignment = assignments?.find((a) => a.marker_id === marker.id);
      if (assignment) {
        const sub = rawSubscriptions?.find((s) => s.company_id === assignment.company_id);
        if (sub) {
          setSelectedSubscriptionId(sub.id);
        } else {
          setSelectedSubscriptionId(null);
        }
      } else {
        setSelectedSubscriptionId(null);
      }
    }
    setEditMode(false);
  };

  // Start editing
  const handleStartEdit = () => {
    if (!selectedMarker) return;
    setEditData({ ...selectedMarker });
    setEditMode(true);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditData(null);
    setEditMode(false);
  };

  // Save changes
  const handleSave = async () => {
    if (!editData) return;

    // Check if this is a default marker
    const isDefault = editData.id === -1 || editData.id === -2;

    try {
      if (isDefault) {
        // Save defaults to both Core and Appearance tables
        const coreFields = {
          rectWidth: editData.rectWidth,
          rectHeight: editData.rectHeight,
        };

        const appearanceFields = {
          iconUrl: editData.iconUrl,
          iconSize: editData.iconSize,
          glyphColor: editData.glyphColor,
          glyphSize: editData.glyphSize,
          shadowScale: editData.shadowScale,
        };

        // Update both tables (defaults use event_year = 0)
        const [coreRes, appearanceRes] = await Promise.all([
          supabase
            .from('markers_core')
            .update(coreFields)
            .eq('id', editData.id)
            .eq('event_year', 0),
          supabase
            .from('markers_appearance')
            .update(appearanceFields)
            .eq('id', editData.id)
            .eq('event_year', 0),
        ]);

        if (coreRes.error) throw coreRes.error;
        if (appearanceRes.error) throw appearanceRes.error;

        // Reload defaults
        setDefaultMarkers((prev) =>
          prev.map((m) => (m.id === editData.id ? { ...m, ...editData } : m)),
        );
      } else {
        // Calculate only changed fields
        const changes = {};
        Object.keys(editData).forEach((key) => {
          if (editData[key] !== selectedMarker[key]) {
            changes[key] = editData[key];
          }
        });

        // If no changes, just exit edit mode
        if (Object.keys(changes).length === 0) {
          setEditMode(false);
          setEditData(null);
          return;
        }

        // Save regular marker to local state
        setMarkersState((prev) =>
          prev.map((m) => (m.id === editData.id ? { ...m, ...editData } : m)),
        );

        // Save only changed fields to Supabase (batched by table for performance)
        await updateMarker(editData.id, changes);
      }

      setEditMode(false);
      setEditData(null);
    } catch (error) {
      console.error('Error saving marker:', error);
      toastError('Failed to save marker. Please try again.');
    }
  };

  // Update edit data
  const handleFieldChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle archive current year
  const handleArchive = async () => {
    if (isReadOnly) return; // Event managers can't archive

    const confirmed = await confirm({
      title: 'Archive Markers',
      message: `Archive all markers for ${selectedYear}? This will move them to the archive and clear the current year.`,
      confirmText: 'Archive',
      variant: 'warning',
    });
    if (!confirmed) return;

    const { error } = await archiveMarkers();
    if (error) {
      toastError(`Error archiving markers: ${error}`);
    } else {
      toastSuccess(`Successfully archived markers for ${selectedYear}`);
    }
  };

  // Handle copy from previous year
  const handleCopyFromPreviousYear = async () => {
    if (isReadOnly) return; // Event managers can't copy

    const previousYear = selectedYear - 1;
    const confirmed = await confirm({
      title: 'Copy Markers',
      message: `Copy all markers from ${previousYear} to ${selectedYear}?`,
      confirmText: 'Copy',
      variant: 'default',
    });
    if (!confirmed) return;

    const { error } = await copyMarkers(previousYear);
    if (error) {
      toastError(`Error copying markers: ${error}`);
    } else {
      toastSuccess(`Markers copied from ${previousYear} to ${selectedYear}`);
    }
  };

  // Print map (for Event Managers)
  const handlePrintMap = () => {
    window.print();
  };

  // Programmatic print call for header presets — attempt plugin first, fallback to snapshot
  const programmaticHeaderPrint = async (mode) => {
    if (!mapInstance || !mapInstance.printControl || !mode) return;

    setIsPrintingHeader(true);
    const control = mapInstance.printControl;
    const browserPrint = control?.browserPrint || control;

    let timeoutId = null;
    let started = false;
    let finished = false;

    const cleanup = () => {
      if (!mapInstance || !(window.L && window.L.BrowserPrint && window.L.BrowserPrint.Event))
        return;
      const Ev = window.L.BrowserPrint.Event;
      try {
        mapInstance.off(Ev.PrintStart, onStart);
        mapInstance.off(Ev.PrintEnd, onEnd);
        mapInstance.off(Ev.PrintCancel, onCancel);
      } catch (e) {}
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
      cleanup();
    };
    const onCancel = () => {
      finished = true;
      cleanup();
    };

    try {
      if (window.L && window.L.BrowserPrint && window.L.BrowserPrint.Event) {
        const Ev = window.L.BrowserPrint.Event;
        mapInstance.on(Ev.PrintStart, onStart);
        mapInstance.on(Ev.PrintEnd, onEnd);
        mapInstance.on(Ev.PrintCancel, onCancel);
      }

      try {
        if (typeof browserPrint.print === 'function') {
          browserPrint.print(mode);
        } else if (typeof control?._printMode === 'function') {
          control._printMode(mode);
        } else {
          throw new Error('No browser print API available');
        }
      } catch (err) {
        console.warn('Header BrowserPrint call failed:', err);
        cleanup();

        const isLandscape =
          mode?.title?.toLowerCase().includes('landscape') ||
          mode?.name?.toLowerCase().includes('landscape');

        console.info(
          `[MapPrint] Fallback triggered. Configuration: ${isLandscape ? 'Landscape' : 'Portrait'}`,
        );
        alert(
          'Browser print failed. Falling back to snapshot print (popup window). Verify the orientation in the dialog.',
        );

        await snapshotHeaderPrint({
          orientation: isLandscape ? 'landscape' : 'portrait',
        });
        return;
      }

      const waitStart = () =>
        new Promise((resolve) => {
          if (started) return resolve('started');
          // Increased timeout to 8000ms to allow large maps/complex DOMs to prepare for print
          timeoutId = setTimeout(() => resolve('timeout'), 8000);
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

      const result = await waitStart();
      if (result === 'timeout') {
        console.warn('Header BrowserPrint did not start; falling back to snapshot export');
        cleanup();

        // Detect configuration from mode object safely handling both structure variants
        const title = mode?.title || mode?.options?.title || mode?.name || '';
        const isLandscape = title.toLowerCase().includes('landscape');

        console.info(
          `[MapPrint] Fallback triggered. Configuration: ${isLandscape ? 'Landscape' : 'Portrait'}`,
        );
        alert(
          'Browser print timed out. Falling back to snapshot print (popup window). Verify the orientation in the dialog.',
        );

        await snapshotHeaderPrint({
          orientation: isLandscape ? 'landscape' : 'portrait',
        });
      }
    } finally {
      setIsPrintingHeader(false);
    }
  };

  const snapshotHeaderPrint = async (options = {}) => {
    if (isPrintingHeader) return;
    setIsPrintingHeader(true);
    try {
      const mapContainer =
        document.querySelector('#map-container') || document.querySelector('.leaflet-container');
      if (!mapContainer) return;

      await new Promise((r) => setTimeout(r, 400));

      const canvas = await html2canvas(mapContainer, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        scale: 2,
        ignoreElements: (element) => element.classList?.contains('map-controls-print-hide'),
      });

      const imageDataUrl = canvas.toDataURL('image/png', 1.0);
      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (!printWindow) {
        alert('Popup blocked! Please allow popups for map printing.');
        return;
      }

      // Avoid document.write (browser warns). Build DOM safely using DOM APIs
      const doc = printWindow.document;
      doc.open();
      // Build head content
      const head = doc.createElement('head');
      const title = doc.createElement('title');
      title.textContent = 'Map Print';
      const style = doc.createElement('style');

      // Determine orientation if needed
      const pageOrientation = options.orientation === 'landscape' ? 'landscape' : 'portrait';

      style.textContent = `
        * { margin: 0; padding: 0 }
        body { 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          min-height: 100vh; 
          background: white 
        }
        img { 
          max-width: 100%; 
          max-height: 100vh; 
          object-fit: contain 
        }
        @media print { 
          @page { size: ${pageOrientation}; margin: 0; }
          img { width: 100%; height: auto } 
          body { 
            display: block !important; 
            margin: 0 !important;
            padding: 0 !important;
            height: 100% !important;
          }
        }
      `;
      head.appendChild(title);
      head.appendChild(style);

      // Build body with image and onload print
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

      // Attach head/body to document
      // Ensure document has an HTML element
      if (!doc.documentElement) {
        doc.appendChild(doc.createElement('html'));
      }

      // Clear existing content safely
      while (doc.documentElement.firstChild) {
        doc.documentElement.removeChild(doc.documentElement.firstChild);
      }

      doc.documentElement.appendChild(head);
      doc.documentElement.appendChild(body);
      doc.close();
      printWindow.document.close();
      printWindow.onafterprint = () => printWindow.close();
    } catch (err) {
      console.error('Snapshot print failed:', err);
      // For admin users show a helpful error toast explaining likely cause and next steps
      try {
        toastError(
          'Snapshot failed — map tiles may be blocked by CORS or the service worker. Use the Print Map plugin preset or enable CORS for your tile provider.',
        );
      } catch (e) {
        // if toast isn't available just fall back silently
      }
      window.print();
    } finally {
      setIsPrintingHeader(false);
    }
  };

  const isDefaultMarker = selectedMarker && (selectedMarker.id === -1 || selectedMarker.id === -2);
  const isSpecialMarker = selectedMarker && selectedMarker.id >= 1000;
  const isBoothMarker = selectedMarker && selectedMarker.id > 0 && selectedMarker.id < 1000;

  // Get current default color names dynamically
  const getDefaultColorName = (hasAssignment) => {
    const defaultMarker = defaultMarkers.find((d) => d.id === (hasAssignment ? -1 : -2));
    if (!defaultMarker?.iconUrl) return hasAssignment ? 'Blue (assigned)' : 'Gray (unassigned)';

    // Extract color from icon filename (e.g., 'glyph-marker-icon-red.svg' -> 'Red')
    const colorMatch = defaultMarker.iconUrl.match(/glyph-marker-icon-(\w+)\.svg/);
    if (colorMatch) {
      const color = colorMatch[1].charAt(0).toUpperCase() + colorMatch[1].slice(1);
      return `${color} (${hasAssignment ? 'assigned' : 'unassigned'})`;
    }

    return hasAssignment ? 'Blue (assigned)' : 'Gray (unassigned)';
  };

  return (
    <ProtectedSection requiredRole={['super_admin', 'system_manager', 'event_manager']}>
      <div className="bg-white rounded-lg shadow">
        <div className="p-3 border-b border-gray-200">
          {/* Header with year info and actions */}
          <div className="flex justify-between items-center mb-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">
                {isReadOnly ? 'Event Map Viewer' : t('mapManagement.title')}
              </h1>
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {selectedYear}
              </div>
              {/* Read-only badge removed per request - keep header title behavior unchanged */}
            </div>
            <div className="flex gap-2 items-center">
              {/* Canonical header print action for Event/Org roles */}
              <div className="relative">
                <button
                  onClick={() => setPrintMenuOpen((v) => !v)}
                  className={`flex items-center gap-2 px-4 py-2 ${isReadOnly ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'} rounded-lg`}
                  title="Print map"
                  aria-haspopup="menu"
                  aria-expanded={printMenuOpen}
                >
                  <Icon path={mdiPrinter} size={0.8} />
                  Print Map
                </button>

                {printMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-40 overflow-hidden border border-gray-200">
                    {printModes.length > 0 ? (
                      <div className="py-1">
                        {printModes.map((m, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={async () => {
                              setPrintMenuOpen(false);
                              await programmaticHeaderPrint(m);
                            }}
                            className="w-full text-left px-4 py-2 text-gray-900 hover:bg-gray-50 transition-colors"
                          >
                            {m?.options?.title || m?.options?.pageSize || `Preset ${idx + 1}`}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={async () => {
                            setPrintMenuOpen(false);
                            await snapshotHeaderPrint();
                          }}
                          className="w-full text-left px-4 py-2 text-gray-900 hover:bg-gray-50 transition-colors"
                        >
                          Snapshot (PNG)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Maintain Copy and Archive buttons for full admin users */}
              {!isReadOnly && (
                <>
                  <button
                    onClick={handleCopyFromPreviousYear}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    title={`Copy markers from ${selectedYear - 1}`}
                  >
                    <Icon path={mdiContentCopy} size={0.8} />
                    Copy from {selectedYear - 1}
                  </button>
                  <button
                    onClick={handleArchive}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={(markersState?.length || 0) === 0}
                    title={`Archive all markers for ${selectedYear}`}
                  >
                    <Icon path={mdiArchive} size={0.8} />
                    Archive {selectedYear}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* read-only notice removed per request - event manager view remains read-only but UI note removed */}

          {/* Empty state for no markers */}
          {filteredMarkers.length === 0 && !searchTerm && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  No Markers Found for {selectedYear}
                </h3>
                <p className="text-blue-700 mb-4">
                  {isReadOnly
                    ? `There are no markers configured for ${selectedYear}. Please contact your system administrator.`
                    : `There are no markers configured for ${selectedYear}. You can copy markers from the previous year or create new ones.`}
                </p>
                {!isReadOnly && (
                  <button
                    onClick={handleCopyFromPreviousYear}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Copy from {selectedYear - 1}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Search and Sort (hidden for read-only event managers) */}
          {!isReadOnly && (
            <div className="flex justify-between items-center w-full">
              {/* Left Sidebar Toggle (DesktopOnly) - controls marker panel */}
              <button
                onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                className={`p-1 rounded-lg border transition-colors ${
                  isLeftSidebarOpen
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
                title={isLeftSidebarOpen ? 'Hide Markers & Details' : 'Show Markers & Details'}
              >
                <Icon path={isLeftSidebarOpen ? mdiChevronLeft : mdiChevronRight} size={0.8} />
              </button>

              {/* Right Sidebar Toggle (DesktopOnly) - controls subscriptions panel */}
              <button
                onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                className={`p-1 rounded-lg border transition-colors ${
                  isRightSidebarOpen
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
                title={isRightSidebarOpen ? 'Hide Subscriptions List' : 'Show Subscriptions List'}
              >
                <Icon path={isRightSidebarOpen ? mdiChevronRight : mdiChevronLeft} size={0.8} />
              </button>
            </div>
          )}
        </div>

        <div className="flex h-[calc(100vh-120px)] relative">
          {/* LEFT: Markers & Details Panel */}
          {!isReadOnly && (
            <div
              className={`border-r border-gray-200 overflow-hidden flex-shrink-0 bg-white flex flex-col relative ${
                !isLeftSidebarOpen && 'border-r-0'
              }`}
              style={{
                width: isLeftSidebarOpen ? leftSidebarWidth : 0,
                transition: isResizing === 'left' ? 'none' : 'width 0.3s ease-in-out',
              }}
            >
              {/* Resize Handle (Right Edge) */}
              <div
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 z-50 active:bg-blue-600 transition-colors"
                onMouseDown={() => setIsResizing('left')}
              />

              {/* Title Header */}
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 bg-white sticky top-0 z-10">
                Markers List
              </div>

              {/* Search and Sort Header */}
              <div className="p-3 border-b border-gray-200 bg-gray-50 flex flex-col gap-3">
                {/* Search */}
                <div className="relative">
                  <Icon
                    path={mdiMagnify}
                    size={0.8}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder={t('mapManagement.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Sort */}
                <div className="flex items-center border border-gray-300 rounded-md shadow-sm bg-white">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 pl-2 pr-2 py-1.5 border-0 rounded-l-md bg-white text-gray-900 text-xs focus:ring-0 appearance-none min-w-0"
                    aria-label={t('mapManagement.sortBy')}
                  >
                    <option value="id">{t('mapManagement.sortId')}</option>
                    <option value="name">{t('mapManagement.sortName')}</option>
                    <option value="type">{t('mapManagement.sortType')}</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    aria-label={`Toggle sort direction to ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
                    className="px-2 py-1.5 border-l border-gray-300 text-gray-500 hover:bg-gray-50 rounded-r-md text-xs"
                  >
                    <Icon
                      path={sortDirection === 'asc' ? mdiChevronUp : mdiChevronDown}
                      size={0.7}
                    />
                    <span className="sr-only">Sort</span>
                  </button>
                </div>
              </div>

              {/* Top Section: Marker List */}
              <div
                className="w-full overflow-y-auto p-2 border-b border-gray-200 relative scrollbar-hide"
                style={{
                  height: selectedMarkerId
                    ? `calc(${listSplitRatio * 100}% - 146px)`
                    : 'calc(100% - 146px)',
                  transition: isResizing ? 'none' : 'height 0.3s ease-in-out',
                }}
              >
                {filteredMarkers.map((marker) => {
                  const isSelected = marker.id === selectedMarkerId;
                  const isDefault = marker.id === -1 || marker.id === -2;
                  const isSpecial = marker.id >= 1000;

                  return (
                    <button
                      key={marker.id}
                      onClick={() => handleSelectMarker(marker)}
                      className={`w-full text-left p-2 rounded-lg mb-1 transition-colors ${
                        isSelected
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : isDefault
                            ? 'bg-amber-50 border-2 border-amber-300 hover:bg-amber-100'
                            : 'bg-white border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {marker.iconUrl ? (
                          <div className="relative">
                            <img src={getIconPath(marker.iconUrl)} alt="icon" className="w-5 h-5" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center text-[10px] text-gray-600">
                            D
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm text-gray-900 truncate">
                              {isDefault
                                ? marker.id === -1
                                  ? 'Assigned Booth'
                                  : 'Unassigned Booth'
                                : marker.glyph || `Marker ${marker.id}`}
                            </span>
                            <span className="text-xs text-gray-400 font-mono ml-2">
                              #{marker.id}
                            </span>
                          </div>
                          {marker.name && (
                            <div className="text-xs text-gray-500 truncate">{marker.name}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Resizer Splitter (Horizontal) */}
              {selectedMarkerId && (
                <div
                  className="w-full h-1 cursor-row-resize bg-gray-200 hover:bg-blue-400 z-50 active:bg-blue-600 transition-colors"
                  onMouseDown={() => setIsResizing('split-left')}
                />
              )}

              {/* Bottom Section: Details/Edit */}
              {selectedMarkerId && (
                <div
                  className="w-full overflow-y-auto p-6 bg-gray-50/50 flex-shrink-0"
                  style={{
                    height: `${(1 - listSplitRatio) * 100}%`,
                    transition: isResizing ? 'none' : 'height 0.3s ease-in-out',
                  }}
                >
                  {!selectedMarker ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      {t('mapManagement.selectMarker')}
                    </div>
                  ) : (
                    <div>
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">
                            {isDefaultMarker
                              ? selectedMarker.id === -1
                                ? 'Assigned Booth Default'
                                : 'Unassigned Booth Default'
                              : selectedMarker.glyph || `Marker ${selectedMarker.id}`}
                          </h2>
                          <p className="text-sm text-gray-600">
                            ID: {selectedMarker.id}
                            {isDefaultMarker && ' ⚙️ Global Default for Booth Markers'}
                            {isSpecialMarker && ' (Special Marker)'}
                            {isBoothMarker &&
                              ' (Booth - Content managed via Companies/Assignments)'}
                          </p>
                        </div>
                        {!editMode && !isReadOnly && (
                          <button
                            onClick={handleStartEdit}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Edit
                          </button>
                        )}
                      </div>

                      {editMode ? (
                        <EditPanel
                          marker={editData}
                          isDefaultMarker={isDefaultMarker}
                          isSpecialMarker={isSpecialMarker}
                          isBoothMarker={isBoothMarker}
                          getDefaultColorName={getDefaultColorName}
                          onChange={handleFieldChange}
                          onSave={handleSave}
                          onCancel={handleCancelEdit}
                        />
                      ) : (
                        <ViewPanel
                          marker={selectedMarker}
                          isSpecialMarker={isSpecialMarker}
                          isDefaultMarker={isDefaultMarker}
                          isBoothMarker={isBoothMarker}
                          getDefaultColorName={getDefaultColorName}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CENTER: Map View */}
          <div className="flex-1 relative bg-gray-50 flex flex-col">
            <EventMap
              // This is the admin map page; always render the admin-sized map even
              // for read-only event managers so the app sidebar and admin layout
              // remain visible. Previously this passed `!isReadOnly` which caused
              // the visitor/fullscreen-sized map to completely cover the sidebar
              // for event managers.
              isAdminView={true}
              previewUseVisitorSizing={true}
              markersState={markersState}
              updateMarker={isReadOnly ? null : updateMarker}
              selectedYear={selectedYear}
              selectedMarkerId={selectedMarkerId}
              editMode={!isReadOnly && editMode}
              onMarkerSelect={(id) => {
                setSelectedMarkerId(id);
                if (!isReadOnly) setEditMode(false);
                // Auto-open left sidebar when inspecting a marker
                if (!isLeftSidebarOpen) setIsLeftSidebarOpen(true);
                
                // Sync with subscription list
                if (id) {
                  const assignment = assignments?.find((a) => a.marker_id === id);
                  if (assignment) {
                    const sub = rawSubscriptions?.find(
                      (s) => s.company_id === assignment.company_id,
                    );
                    if (sub) {
                      setSelectedSubscriptionId(sub.id);
                    } else {
                      setSelectedSubscriptionId(null);
                    }
                  } else {
                    setSelectedSubscriptionId(null);
                  }
                } else {
                  setSelectedSubscriptionId(null);
                }
              }}
              onMarkerDrag={(id, newLat, newLng) => {
                // Update coordinates in edit data when marker is dragged
                if (!isReadOnly && editMode && selectedMarkerId === id) {
                  setEditData((prev) => ({
                    ...prev,
                    lat: newLat,
                    lng: newLng,
                  }));
                }
              }}
              onMapReady={(map) => {
                setMapInstance(map);
                const controlModes = map?.printControl?.options?.printModes || [];
                setPrintModes(Array.isArray(controlModes) ? controlModes : []);
              }}
            />
          </div>

          {/* RIGHT: Subscriptions Panel */}
          {!isReadOnly && (
            <div
              className={`border-l border-gray-200 overflow-hidden flex-shrink-0 bg-white relative flex flex-col ${
                !isRightSidebarOpen && 'border-l-0'
              }`}
              style={{
                width: isRightSidebarOpen ? rightSidebarWidth : 0,
                transition: isResizing === 'right' ? 'none' : 'width 0.3s ease-in-out',
              }}
            >
              {/* Resize Handle (Left Edge) */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 z-50 active:bg-blue-600 transition-colors"
                onMouseDown={() => setIsResizing('right')}
              />

              {/* Title Header */}
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 bg-white sticky top-0 z-10 flex justify-between items-center">
                <span>Subscription List</span>
                <span className="text-[10px] font-normal">
                  {filteredSubscriptions?.length || 0} / {rawSubscriptions?.length || 0}
                </span>
              </div>

              {/* Search Header */}
              <div className="p-3 border-b border-gray-200 bg-gray-50 flex flex-col gap-3 flex-shrink-0">
                <div className="relative">
                  <Icon
                    path={mdiMagnify}
                    size={0.8}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search company..."
                    value={subscriptionSearch}
                    onChange={(e) => setSubscriptionSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Sort */}
                <div className="flex items-center border border-gray-300 rounded-md shadow-sm bg-white">
                  <select
                    value={subscriptionSortBy}
                    onChange={(e) => setSubscriptionSortBy(e.target.value)}
                    className="flex-1 pl-2 pr-2 py-1.5 border-0 rounded-l-md bg-white text-gray-900 text-xs focus:ring-0 appearance-none min-w-0"
                    aria-label="Sort subscriptions by"
                  >
                    <option value="name">Sort by Company</option>
                    <option value="booths">Sort by Booths</option>
                    <option value="assigned">Sort by Assigned</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      setSubscriptionSortDirection(
                        subscriptionSortDirection === 'asc' ? 'desc' : 'asc',
                      )
                    }
                    aria-label={`Toggle sort direction to ${
                      subscriptionSortDirection === 'asc' ? 'descending' : 'ascending'
                    }`}
                    className="px-2 py-1.5 border-l border-gray-300 text-gray-500 hover:bg-gray-50 rounded-r-md text-xs"
                  >
                    <Icon
                      path={subscriptionSortDirection === 'asc' ? mdiChevronUp : mdiChevronDown}
                      size={0.7}
                    />
                    <span className="sr-only">Sort</span>
                  </button>
                </div>
              </div>

              {/* List and Details Container */}
              <div className="flex-1 flex flex-col min-h-0 relative">
                {/* List */}
                <div
                  className="overflow-y-auto w-full"
                  style={{
                    height: selectedSubscriptionId ? `${rightListSplitRatio * 100}%` : '100%',
                    transition: isResizing ? 'none' : 'height 0.3s ease-in-out',
                  }}
                >
                  {loadingSubscriptions ? (
                    <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
                  ) : filteredSubscriptions?.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">No subscriptions</div>
                  ) : (
                    filteredSubscriptions.map((sub) => {
                      const isSelected = selectedSubscriptionId === sub.id;
                      const company = sub.company || {};
                      
                      // Find assignment and linked marker (booth)
                      const assignment = assignments?.find((a) => a.company_id === company.id);
                      const isAssigned = !!assignment;
                      const assignedMarkerId = assignment?.marker_id;
                      const assignedMarker = markersState?.find((m) => m.id === assignedMarkerId);
                      const boothLabel = assignedMarker ? `Booth ${assignedMarker.id}` : 'Assigned';

                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            const newId = isSelected ? null : sub.id;
                            setSelectedSubscriptionId(newId);
                            
                            // Visual feedback: Select marker if assigned
                            if (newId && assignedMarkerId) {
                              setSelectedMarkerId(assignedMarkerId);
                            } else if (!newId) {
                                // Optional: Clear marker selection when deselected? 
                                // Keeping map selection active allows comparing details, but clearing implies focus shift back to list.
                                // Let's clear it to match "deselecting ... should also close detail view" logic.
                                setSelectedMarkerId(null);
                            }
                          }}
                          className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                            isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500 pl-[11px]' : ''
                          }`}
                        >
                          <div className="w-8 h-8 flex-shrink-0 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden">
                            {company.logo ? (
                              <img
                                src={getLogoPath(company.logo)}
                                alt={company.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Icon path={mdiArchive} size={0.6} className="text-gray-300" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {company.name || 'Unknown Company'}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                              {isAssigned ? (
                                <span className="text-green-600 flex items-center gap-0.5">
                                  <Icon path={mdiContentSave} size={0.5} /> {boothLabel}
                                </span>
                              ) : (
                                <span className="text-orange-500">Unassigned</span>
                              )}
                              {sub.booth_count > 0 && <span>• {sub.booth_count} booths</span>}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Resizer Splitter (Horizontal) */}
                {selectedSubscriptionId && (
                  <div
                    className="w-full h-1 cursor-row-resize bg-gray-200 hover:bg-blue-400 z-50 active:bg-blue-600 transition-colors flex-shrink-0"
                    onMouseDown={() => setIsResizing('split-right')}
                  />
                )}

                {/* Bottom Section: Details */}
                {selectedSubscriptionId && (
                  <div
                    className="w-full overflow-y-auto p-4 bg-gray-50/50 border-t border-gray-200"
                    style={{
                      height: `${(1 - rightListSplitRatio) * 100}%`,
                      transition: isResizing ? 'none' : 'height 0.3s ease-in-out',
                    }}
                  >
                  {!selectedSubscription ? (
                    <div className="text-center text-gray-400 py-4">Select a subscription</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-900">Subscription Details</h4>
                        <button
                          onClick={() => setSelectedSubscriptionId(null)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Close details"
                        >
                          <Icon path={mdiClose} size={0.8} />
                        </button>
                      </div>

                      {/* Read-only details view */}
                      <div className="bg-white p-3 rounded border border-gray-200 shadow-sm text-left">
                        {/* Details - Compact Layout */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-left">
                          {/* Company */}
                          <div className="col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-0.5 text-left">
                              Company
                            </label>
                            <div className="text-sm font-medium text-gray-900 truncate text-left" title={selectedSubscription.company?.name}>
                              {selectedSubscription.company?.name || 'Unknown'}
                            </div>
                          </div>

                          {/* Booths */}
                          <div className="col-span-2 text-left">
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-0.5 text-left">
                              Booths
                            </label>
                            <div className="text-sm text-gray-900 text-left">
                              {selectedSubscription.booth_count || 0}
                            </div>
                          </div>

                          {/* Coins */}
                          <div className="col-span-2 text-left">
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-0.5 text-left">
                              Coins
                            </label>
                            <div className="text-sm text-gray-900 text-left">{selectedSubscription.coins || 0}</div>
                          </div>

                          {/* Meals (Sat) */}
                          <div className="col-span-2 text-left">
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-0.5 text-left">
                              Meals (Saturday)
                            </label>
                            <div className="text-xs text-gray-700 flex gap-3 text-left">
                              <span>Breakfast: <span className="font-medium text-gray-900">{selectedSubscription.breakfast_sat || 0}</span></span>
                              <span>Lunch: <span className="font-medium text-gray-900">{selectedSubscription.lunch_sat || 0}</span></span>
                              <span>BBQ: <span className="font-medium text-gray-900">{selectedSubscription.bbq_sat || 0}</span></span>
                            </div>
                          </div>

                          {/* Meals (Sun) */}
                          <div className="col-span-2 text-left">
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-0.5 text-left">
                              Meals (Sunday)
                            </label>
                            <div className="text-xs text-gray-700 flex gap-3 text-left">
                              <span>Breakfast: <span className="font-medium text-gray-900">{selectedSubscription.breakfast_sun || 0}</span></span>
                              <span>Lunch: <span className="font-medium text-gray-900">{selectedSubscription.lunch_sun || 0}</span></span>
                            </div>
                          </div>

                          {/* Notes - Always visible, even if empty */}
                          <div className="col-span-2 text-left">
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-0.5 text-left">
                              Notes
                            </label>
                            <div className="text-xs bg-gray-50 p-2 rounded text-gray-600 whitespace-pre-wrap min-h-[3rem] border border-gray-100 text-left">
                              {selectedSubscription.notes || <span className="text-gray-400 italic">No notes</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedSection>
  );
}

/** View Panel - Read-only display */
function ViewPanel({
  marker,
  isSpecialMarker,
  isDefaultMarker,
  isBoothMarker,
  getDefaultColorName,
}) {
  return (
    <div className="space-y-6">
      {isDefaultMarker && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
          <h4 className="font-semibold text-amber-900 mb-2">ℹ️ About Default Markers</h4>
          <p className="text-sm text-amber-800 mb-2">
            {marker.id === -1
              ? 'This defines the default appearance for booth markers (ID < 1000) that have a company assigned.'
              : 'This defines the default appearance for booth markers (ID < 1000) that have no company assigned.'}
          </p>
          <p className="text-sm text-amber-800">
            Individual booth markers can override these defaults by having their own values in the
            Appearance table.
          </p>
        </div>
      )}

      {/* Position & Structure */}
      {!isDefaultMarker && (
        <Section title="Position & Structure">
          <Field label="Latitude" value={marker.lat} />
          <Field label="Longitude" value={marker.lng} />
          <Field label="Rectangle" value={JSON.stringify(marker.rectangle)} />
          <Field label="Angle" value={marker.angle || 0} />
        </Section>
      )}

      {/* Visual Styling */}
      <Section title={isDefaultMarker ? 'Default Visual Styling' : 'Visual Styling'}>
        <Field label="Icon">
          {marker.iconUrl ? (
            <div className="flex items-center gap-2">
              <img src={getIconPath(marker.iconUrl)} alt="icon" className="w-8 h-8" />
              <span className="text-xs text-orange-600 font-medium">Custom Color</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-[9px] text-gray-600 font-medium leading-none">
                Default
              </div>
              <span className="text-xs text-blue-600 font-medium">
                {isBoothMarker
                  ? getDefaultColorName(marker.assignments?.length > 0)
                  : 'Based on marker type'}
              </span>
            </div>
          )}
        </Field>
        <Field label="Icon Size" value={JSON.stringify(marker.iconSize)} />
        {!isDefaultMarker && <Field label="Glyph (Booth Label)" value={marker.glyph} />}
        <Field label="Glyph Color" value={marker.glyphColor} />
        <Field label="Glyph Size" value={marker.glyphSize} />
        <Field
          label="Glyph Anchor"
          value={marker.glyphAnchor ? JSON.stringify(marker.glyphAnchor) : '—'}
        />
        <Field label="Shadow Scale" value={marker.shadowScale ?? '1.0'} />
        {isDefaultMarker && (
          <>
            <Field label="Rectangle Width" value={marker.rectWidth} />
            <Field label="Rectangle Height" value={marker.rectHeight} />
          </>
        )}
      </Section>

      {/* Content (Special Markers Only) */}
      {isSpecialMarker && (
        <Section title="Content (Special Marker)">
          <Field label="Name" value={marker.name} />
          <Field label="Logo">
            {marker.logo && (
              <img
                {...(() => {
                  const r = getResponsiveLogoSources(marker.logo);
                  if (r) return { src: r.src, srcSet: r.srcSet, sizes: r.sizes };
                  return { src: getLogoPath(marker.logo) };
                })()}
                alt="logo"
                className="w-12 h-12"
              />
            )}
          </Field>
          <Field label="Website" value={marker.website} />
          <Field label="Info" value={marker.info} />
        </Section>
      )}
    </div>
  );
}

/** Edit Panel - Editable fields */
function EditPanel({
  marker,
  isDefaultMarker,
  isSpecialMarker,
  isBoothMarker,
  getDefaultColorName,
  onChange,
  onSave,
  onCancel,
}) {
  return (
    <div className="space-y-6">
      {isDefaultMarker && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
          <h4 className="font-semibold text-amber-900 mb-2">⚙️ Editing Global Defaults</h4>
          <p className="text-sm text-amber-800 mb-2">
            {marker.id === -1
              ? 'Changes here will affect all booth markers (ID < 1000) that have a company assigned, unless they have individual overrides.'
              : 'Changes here will affect all booth markers (ID < 1000) that have no company assigned, unless they have individual overrides.'}
          </p>
        </div>
      )}

      {/* Position & Structure (not for defaults) */}
      {!isDefaultMarker && (
        <Section title="Position & Structure">
          <InputField
            label="Latitude"
            type="number"
            step="0.0001"
            value={marker.lat}
            onChange={(v) => onChange('lat', parseFloat(v))}
          />
          <InputField
            label="Longitude"
            type="number"
            step="0.0001"
            value={marker.lng}
            onChange={(v) => onChange('lng', parseFloat(v))}
          />
          <InputField
            label="Angle"
            type="number"
            step="0.1"
            value={marker.angle || 0}
            onChange={(v) => onChange('angle', parseFloat(v))}
          />
        </Section>
      )}

      {/* Visual Styling */}
      <Section title={isDefaultMarker ? 'Default Visual Styling' : 'Visual Styling'}>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Icon</label>
          <div className="grid grid-cols-6 gap-2">
            {/* Use Default Color option */}
            <button
              onClick={() => onChange('iconUrl', null)}
              className={`w-10 h-10 border-2 rounded-lg transition-all flex items-center justify-center ${
                !marker.iconUrl
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
              title="Use default color based on assignment status"
            >
              <div className="text-[9px] text-gray-600 font-medium leading-none">Default</div>
            </button>
            {/* Custom color options */}
            {ICON_OPTIONS.map((iconFile) => (
              <button
                key={iconFile}
                onClick={() => onChange('iconUrl', iconFile)}
                className={`p-2 border-2 rounded-lg transition-all ${
                  marker.iconUrl === iconFile
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <img src={getIconPath(iconFile)} alt={iconFile} className="w-8 h-8" />
              </button>
            ))}
          </div>
          {!marker.iconUrl ? (
            <p className="text-xs text-gray-600 mt-1">
              Using default color:{' '}
              {isBoothMarker
                ? getDefaultColorName(marker.assignments?.length > 0)
                : 'Based on marker type'}
            </p>
          ) : (
            <p className="text-xs text-gray-600 mt-1">Using custom color override</p>
          )}
        </div>
        {!isDefaultMarker && (
          <InputField
            label="Glyph (Booth Label)"
            value={marker.glyph}
            onChange={(v) => onChange('glyph', v)}
          />
        )}
        <InputField
          label="Glyph Color"
          type="color"
          value={marker.glyphColor}
          onChange={(v) => onChange('glyphColor', v)}
        />
        <InputField
          label="Glyph Size"
          type="number"
          step="0.01"
          value={marker.glyphSize}
          onChange={(v) => onChange('glyphSize', parseFloat(v))}
        />
        <div className="grid grid-cols-2 gap-2">
          <InputField
            label="Glyph Anchor X"
            type="number"
            step="0.01"
            value={marker.glyphAnchor ? marker.glyphAnchor[0] : ''}
            onChange={(v) =>
              onChange('glyphAnchor', [
                parseFloat(v) || 0,
                marker.glyphAnchor ? marker.glyphAnchor[1] || 0 : 0,
              ])
            }
          />
          <InputField
            label="Glyph Anchor Y"
            type="number"
            step="0.01"
            value={marker.glyphAnchor ? marker.glyphAnchor[1] : ''}
            onChange={(v) =>
              onChange('glyphAnchor', [
                marker.glyphAnchor ? marker.glyphAnchor[0] || 0 : 0,
                parseFloat(v) || 0,
              ])
            }
          />
        </div>
        {/* New per-marker base sizing fields */}
        <div className="grid grid-cols-2 gap-2">
          <InputField
            label="Icon Width"
            type="number"
            step="0.01"
            value={marker.iconSize ? marker.iconSize[0] : ''}
            onChange={(v) =>
              onChange('iconSize', [
                parseFloat(v) || null,
                marker.iconSize ? marker.iconSize[1] : null,
              ])
            }
          />
          <InputField
            label="Icon Height"
            type="number"
            step="0.01"
            value={marker.iconSize ? marker.iconSize[1] : ''}
            onChange={(v) =>
              onChange('iconSize', [
                marker.iconSize ? marker.iconSize[0] : null,
                parseFloat(v) || null,
              ])
            }
          />
        </div>

        <InputField
          label="Shadow Scale"
          type="number"
          step="0.01"
          value={marker.shadowScale ?? 1.0}
          onChange={(v) => onChange('shadowScale', parseFloat(v))}
        />
        {isDefaultMarker && (
          <>
            <InputField
              label="Rectangle Width"
              type="number"
              step="1"
              value={marker.rectWidth}
              onChange={(v) => onChange('rectWidth', parseFloat(v))}
            />
            <InputField
              label="Rectangle Height"
              type="number"
              step="1"
              value={marker.rectHeight}
              onChange={(v) => onChange('rectHeight', parseFloat(v))}
            />
          </>
        )}
      </Section>

      {/* Content (Special Markers Only) */}
      {isSpecialMarker && (
        <Section title="Content (Special Marker)">
          <InputField label="Name" value={marker.name} onChange={(v) => onChange('name', v)} />
          <InputField label="Logo URL" value={marker.logo} onChange={(v) => onChange('logo', v)} />
          <InputField
            label="Website"
            value={marker.website}
            onChange={(v) => onChange('website', v)}
          />
          <TextAreaField label="Info" value={marker.info} onChange={(v) => onChange('info', v)} />
        </Section>
      )}

      {isBoothMarker && (
        // Booth markers are still managed via Companies/Assignments; no informational note shown here.
        <></>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Icon path={mdiContentSave} size={0.9} />
          Save Changes
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <Icon path={mdiClose} size={0.9} />
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Helper Components */
function Section({ title, children }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value, children }) {
  return (
    <div>
      <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>
      {children || <div className="text-gray-900">{value || '—'}</div>}
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text', ...props }) {
  // For color inputs, default to black if no value (HTML5 color input requires valid hex)
  const inputValue = type === 'color' && !value ? '#000000' : value || '';

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={inputValue}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        {...props}
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}
