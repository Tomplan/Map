import React, { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import PropTypes from 'prop-types';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import EventSpecialMarkers from '../EventSpecialMarkers';
import EventClusterMarkers from '../EventClusterMarkers';
const AdminMarkerPlacement = lazy(() => import('../AdminMarkerPlacement'));
import MapControls from './MapControls';
import FavoritesFilterButton from './FavoritesFilterButton';
import { useFavoritesContext } from '../../contexts/FavoritesContext';
import { createIconCreateFunction } from '../../utils/clusterIcons';
import { getLogoPath, getResponsiveLogoSources } from '../../utils/getLogoPath';
import { syncRectangleLayers } from '../../utils/rectangleLayer';
import { createSearchText, isMarkerDraggable } from '../../utils/mapHelpers';
import useAnalytics from '../../hooks/useAnalytics';
import useIsMobile from '../../hooks/useIsMobile';
import { useMapSearchControl } from '../../hooks/useMapSearchControl';
import { useOrganizationLogo } from '../../contexts/OrganizationLogoContext';
import useMapConfig from '../../hooks/useMapConfig';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet-search/dist/leaflet-search.src.css';
import 'leaflet-search';
import 'leaflet-minimap/dist/Control.MiniMap.min.css';
import 'leaflet-minimap';
import '../../assets/leaflet-search-custom.css';

// Fix default Leaflet marker icons for custom base URL
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function EventMap({
  isAdminView,
  markersState,
  updateMarker,
  selectedYear,
  selectedMarkerId,
  onMarkerSelect,
  previewUseVisitorSizing = false,
  editMode = false,
  onMarkerDrag = null,
  onMapReady = null,
}) {
  // Load map configuration from database (with fallback to hard-coded defaults)
  const { MAP_CONFIG, MAP_LAYERS } = useMapConfig(selectedYear);

  const [infoButtonToggled, setInfoButtonToggled] = useState({});
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [activeLayer, setActiveLayer] = useState(MAP_LAYERS[0].key);
  const [showRectanglesAndHandles, setShowRectanglesAndHandles] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [searchLayer, setSearchLayer] = useState(null);
  const { organizationLogo } = useOrganizationLogo();
  const [searchParams, setSearchParams] = useSearchParams();
  // Persist favorites-only toggle per-event-year in localStorage (keeps map & list aligned)
  const favoritesStorageKey = `exhibitors_showFavoritesOnly_${selectedYear}`;
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(() => {
    try {
      return localStorage.getItem(favoritesStorageKey) === 'true';
    } catch (e) {
      return false;
    }
  });
  const [currentZoom, setCurrentZoom] = useState(MAP_CONFIG.DEFAULT_ZOOM);
  // Fractional zoom while the map is animating (null when idle) — used for smooth marker scaling
  const [zoomAnimating, setZoomAnimating] = useState(null);

  // Favorites context (only available in visitor view)
  let favoritesContext = null;
  try {
    favoritesContext = useFavoritesContext();
  } catch (e) {
    // Context not available in admin view, ignore
  }
  const favorites = favoritesContext?.favorites || [];
  const isFavorite = favoritesContext?.isFavorite || (() => false);

  const { t } = useTranslation();

  const searchControlRef = useMapSearchControl(mapInstance, searchLayer, {
    textPlaceholder: t('map.searchPlaceholder'),
  });
  const rectangleLayerRef = useRef(null);
  const hasProcessedFocus = useRef(false);
  const [focusMarkerId, setFocusMarkerId] = useState(null);

  // Create the iconCreateFunction with organization logo
  const iconCreateFunction = useMemo(
    () => createIconCreateFunction(organizationLogo),
    [organizationLogo],
  );

  const isMobile = useIsMobile();
  const { trackMarkerView } = useAnalytics();

  const safeMarkers = useMemo(
    () => (Array.isArray(markersState) ? markersState : []),
    [markersState],
  );

  // Filter markers based on favorites toggle
  const filteredMarkers = useMemo(() => {
    if (!showFavoritesOnly || favorites.length === 0) {
      return safeMarkers;
    }
    return safeMarkers.filter((marker) => {
      return marker.companyId && isFavorite(marker.companyId);
    });
  }, [safeMarkers, showFavoritesOnly, favorites, isFavorite]);

  // Preload marker logos
  useEffect(() => {
    safeMarkers.forEach((marker) => {
      if (marker.logo) {
        const img = new window.Image();
        const r = getResponsiveLogoSources(marker.logo);
        if (r && 'srcSet' in r) {
          img.src = r.src;
          img.srcset = r.srcSet;
        } else {
          img.src = getLogoPath(marker.logo);
        }
      }
    });
  }, [safeMarkers]);

  // Persist favorites-only toggle across page navigation / refresh per event year
  useEffect(() => {
    try {
      localStorage.setItem(favoritesStorageKey, showFavoritesOnly ? 'true' : 'false');
    } catch (e) {
      // ignore
    }
  }, [favoritesStorageKey, showFavoritesOnly]);

  // When selectedYear changes, reload stored value
  useEffect(() => {
    try {
      const stored = localStorage.getItem(favoritesStorageKey);
      setShowFavoritesOnly(stored === 'true');
    } catch (e) {
      // ignore
    }
  }, [favoritesStorageKey]);

  // If there are no favorites configured, ensure favorites-only is disabled
  useEffect(() => {
    if (favorites && favorites.length === 0 && showFavoritesOnly) {
      try {
        localStorage.setItem(favoritesStorageKey, 'false');
      } catch (e) {
        // ignore
      }
      setShowFavoritesOnly(false);
    }
  }, [favorites, favoritesStorageKey, showFavoritesOnly]);

  // Track zoom changes for dynamic marker sizing
  useEffect(() => {
    if (!mapInstance) return;
    // Throttle updates via requestAnimationFrame to avoid flooding DOM
    let raf = null;

    const handleZoomFrame = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        try {
          const z = mapInstance.getZoom();
          setZoomAnimating(z);
        } catch (err) {
          // ignore
        }
      });
    };

    const handleZoomEnd = () => {
      const zoom = mapInstance.getZoom();
      // Clear animating value and commit the final zoom to state
      setZoomAnimating(null);
      setCurrentZoom(zoom);
      // Development-only: log zoom level for debugging
      try {
        if (process.env.NODE_ENV !== 'production') {
          console.debug(`[Map] zoom: ${zoom}`);
        }
      } catch (err) {
        // safe fallback if console isn't available
      }
    };

    // Set initial zoom
    setCurrentZoom(mapInstance.getZoom());

    // Subscribe to continuous/animated zoom events to update transforms smoothly
    mapInstance.on('zoom', handleZoomFrame);
    mapInstance.on('zoomanim', handleZoomFrame);
    // On end commit final sizes
    mapInstance.on('zoomend', handleZoomEnd);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      mapInstance.off('zoom', handleZoomFrame);
      mapInstance.off('zoomanim', handleZoomFrame);
      mapInstance.off('zoomend', handleZoomEnd);
    };
  }, [mapInstance]);

  // Sync rectangles/handles
  useEffect(() => {
    if (!mapInstance) return;

    syncRectangleLayers({
      mapInstance,
      markers: safeMarkers,
      rectangleSize: MAP_CONFIG.RECTANGLE_SIZE,
      isAdminView,
      showRectanglesAndHandles,
      updateMarker,
      rectangleLayerRef,
    });
  }, [mapInstance, safeMarkers, isAdminView, showRectanglesAndHandles, updateMarker]);

  // Setup search layer and populate it with markers
  useEffect(() => {
    if (!mapInstance) return;

    // Create and populate search layer
    const layerGroup = L.layerGroup();

    safeMarkers.forEach((marker) => {
      if (marker.lat && marker.lng) {
        const searchText = createSearchText(marker);
        const leafletMarker = L.marker([marker.lat, marker.lng], {
          opacity: 0,
          interactive: false,
        });
        leafletMarker.feature = { type: 'Feature', properties: { searchText } };
        leafletMarker.bindPopup(marker.name || marker.label || '');
        // Store marker ID for later reference
        leafletMarker._markerId = marker.id;
        layerGroup.addLayer(leafletMarker);
      }
    });

    setSearchLayer(layerGroup);
  }, [mapInstance, safeMarkers]);

  // Attach EventMap-specific behavior to the centralized search control:
  // - Set focusMarkerId so the UI opens the marker popup after the search fly-to.
  useEffect(() => {
    const control = searchControlRef && searchControlRef.current;
    if (!mapInstance || !searchLayer || !control) return;

    const handleFound = (e) => {
      if (e?.layer) {
        const markerId = e.layer._markerId;

        if (markerId) {
          // Delay popup opening slightly so the map can finish the flyTo animation
          setTimeout(() => setFocusMarkerId(markerId), 800);
        }

        // Ensure control UI is collapsed/blurred (hook also does this; idempotent)
        if (control._input) control._input.blur();
        if (control.hideAlert) control.hideAlert();
        if (control.collapse) control.collapse();
      }
    };

    control.on('search:locationfound', handleFound);

    return () => {
      control.off('search:locationfound', handleFound);
    };
  }, [
    mapInstance,
    searchLayer,
    /* track when control instance becomes available */ Boolean(
      searchControlRef && searchControlRef.current,
    ),
  ]);

  // Setup minimap control
  useEffect(() => {
    if (!mapInstance) return;

    // Setup minimap control only once
    if (!mapInstance._minimapControl) {
      const miniMapLayer = L.tileLayer(MAP_LAYERS[0].url, {
        attribution: '',
        minZoom: 0,
        maxZoom: 16,
      });

      const miniMapControl = new L.Control.MiniMap(miniMapLayer, {
        position: 'bottomright',
        width: MAP_CONFIG.MINIMAP.WIDTH,
        height: MAP_CONFIG.MINIMAP.HEIGHT,
        zoomLevelFixed: MAP_CONFIG.MINIMAP.ZOOM_LEVEL,
        toggleDisplay: true,
        centerFixed: MAP_CONFIG.DEFAULT_POSITION,
        aimingRectOptions: {
          color: MAP_CONFIG.MINIMAP.AIMING_COLOR,
          weight: 2,
          opacity: 0.9,
          fillOpacity: 0.1,
          fill: true,
        },
        shadowRectOptions: {
          color: MAP_CONFIG.MINIMAP.SHADOW_COLOR,
          weight: 1,
          opacity: 0.5,
          fillOpacity: 0.05,
          fill: true,
        },
        strings: {
          hideText: 'Hide MiniMap',
          showText: 'Show MiniMap',
        },
      });

      miniMapControl.addTo(mapInstance);
      mapInstance._minimapControl = miniMapControl;
    }
  }, [mapInstance]);

  // Setup browser print control for map-only export
  useEffect(() => {
    if (!mapInstance) return;

    // Setup browser print interface (back-end) WITHOUT adding the on-map control UI.
    // We create a backend `L.browserPrint` instance and attach it to the map so
    // the MapManagement header button can programmatically call printing. The
    // UI control (map-embedded) will be hidden for now per requirement.

    if (mapInstance._browserPrintInitialized) return;

    if (window.L && window.L.BrowserPrint && window.L.BrowserPrint.Mode && window.L.browserPrint) {
      const Mode = window.L.BrowserPrint.Mode;

      const modes = [
        Mode.Landscape('A4', { title: 'Current view — landscape' }),
        Mode.Portrait('A4', { title: 'A4 — Portrait' }),
        Mode.Landscape('A4', { title: 'A4 — Landscape' }),
        Mode.Auto('A4', { title: 'Auto fit' }),
        Mode.Custom('A4', { title: 'Select area', customArea: true }),
      ];

      // Create the backend browserPrint instance. Do NOT add the control UI to the map.
      try {
        const browserPrint = window.L.browserPrint(mapInstance, {
          // Keep options so consumer can inspect available modes
          printModes: modes,
          closePopupsOnPrint: false,
        });

        // Keep a lightweight facade so other components (PrintButton) can
        // read available modes and call into either the control or backend.
        mapInstance.printControl = {
          browserPrint,
          options: { printModes: modes },
        };

        mapInstance._browserPrintInitialized = true;
      } catch (err) {
        console.warn('Failed to initialize L.browserPrint backend:', err);
      }
    } else {
      console.warn('BrowserPrint not available, print functionality will fallback to snapshot');
    }
  }, [mapInstance]);

  // Handle focus parameter from URL (navigate from exhibitor list)
  useEffect(() => {
    if (!mapInstance || !safeMarkers.length || hasProcessedFocus.current) return;

    const focusId = searchParams.get('focus');
    if (focusId) {
      const markerId = parseInt(focusId, 10);
      const marker = safeMarkers.find((m) => m.id === markerId);

      if (marker && marker.lat && marker.lng) {
        // Zoom to marker with animation
        setTimeout(() => {
          mapInstance.flyTo([marker.lat, marker.lng], MAP_CONFIG.SEARCH_ZOOM, {
            animate: true,
            duration: 1,
          });
          // Set focus marker ID to trigger popup open
          setFocusMarkerId(markerId);
        }, 300);

        // Mark as processed and clear URL parameter
        hasProcessedFocus.current = true;
        setSearchParams({}, { replace: true });
      }
    }
  }, [mapInstance, safeMarkers, searchParams, setSearchParams]);

  const handleMapCreated = (mapOrEvent) => {
    const map = mapOrEvent?.target || mapOrEvent;
    setMapInstance(map);
    // Inform parent components that the map instance is ready so they can
    // register print actions or other map-specific interactions.
    if (typeof onMapReady === 'function') {
      try {
        onMapReady(map);
      } catch (err) {
        /* ignore parent handler errors */
      }
    }

    // Force a resize event to ensure proper tile loading
    setTimeout(() => {
      if (map) {
        map.invalidateSize();
        console.log('Map resized and tiles should be loaded');
      }
    }, 100);
  };

  // Ensure the map invalidates its size when the container or viewport changes.
  // Opening/closing devtools (or other layout changes) can change the available
  // size and cause Leaflet to not request tiles for the newly visible region.
  // A ResizeObserver on the map container + window resize listener ensures we
  // inform Leaflet to refresh tiles when the rendered size changes.
  useEffect(() => {
    if (!mapInstance) return undefined;

    let cleanup = null;

    const requestInvalidate = () => {
      try {
        // Debounce a bit to avoid thrashing during continuous resize
        if (mapInstance._invalidateTimeout) clearTimeout(mapInstance._invalidateTimeout);
        mapInstance._invalidateTimeout = setTimeout(() => {
          try {
            mapInstance.invalidateSize();
          } catch (err) {
            /* ignore */
          }
          mapInstance._invalidateTimeout = null;
        }, 120);
      } catch (err) {
        // ignore
      }
    };

    // ResizeObserver for container changes
    try {
      const container = mapInstance.getContainer && mapInstance.getContainer();
      if (container && typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => requestInvalidate());
        ro.observe(container);
        cleanup = () => ro.disconnect();
      }
    } catch (err) {
      // ignore
    }

    // Also listen for window resizes in case layout/viewport changes cause issues
    const onWinResize = () => requestInvalidate();
    window.addEventListener('resize', onWinResize);

    return () => {
      try {
        window.removeEventListener('resize', onWinResize);
      } catch (e) {
        /* ignore */
      }
      if (cleanup) cleanup();
    };
  }, [mapInstance]);

  const containerStyle = isAdminView
    ? {
        // Admin view: relative positioning to fit within flex parent
        height: '100%',
        width: '100%',
        minHeight: '400px', // Ensure minimum height to prevent collapse
        position: 'relative',
        touchAction: 'pan-x pan-y',
        overflow: 'hidden',
        zIndex: 1, // Ensure admin map stays below modals (modals typically use z-50/10+)
      }
    : {
        // Public view: fixed full-screen positioning
        height: '100svh',
        width: '100vw',
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        touchAction: 'pan-x pan-y',
        overflow: 'hidden',
      };

  return (
    <div style={containerStyle} tabIndex={0} aria-label="Event Map" role="region">
      <MapControls
        mapInstance={mapInstance}
        mapCenter={MAP_CONFIG.DEFAULT_POSITION}
        mapZoom={MAP_CONFIG.DEFAULT_ZOOM}
        searchControlRef={searchControlRef}
        isAdminView={isAdminView}
        showLayersMenu={showLayersMenu}
        setShowLayersMenu={setShowLayersMenu}
        activeLayer={activeLayer}
        setActiveLayer={setActiveLayer}
        showRectanglesAndHandles={showRectanglesAndHandles}
        setShowRectanglesAndHandles={setShowRectanglesAndHandles}
        MAP_LAYERS={MAP_LAYERS}
        markersState={safeMarkers}
      />

      {isAdminView && (
        <Suspense fallback={null}>
          <AdminMarkerPlacement
            mapInstance={mapInstance}
            isAdminView={isAdminView}
            updateMarker={updateMarker}
          />
        </Suspense>
      )}

      {favorites.length > 0 && (
        <FavoritesFilterButton
          isActive={showFavoritesOnly}
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          favoritesCount={favorites.length}
          isAdminView={isAdminView}
        />
      )}

      <div
        id="map-container"
        className={isAdminView ? 'w-full h-full' : 'fixed inset-0 w-full h-full'}
        style={{
          zIndex: isAdminView ? 1 : 1, // Ensure admin map stays below modals
          height: isAdminView ? '100%' : '100svh',
          touchAction: 'pan-x pan-y',
          overflow: 'hidden',
        }}
        aria-label={t('map.ariaLabel')}
      >
        <MapContainer
          center={isAdminView ? MAP_CONFIG.ADMIN_DEFAULT_POSITION : MAP_CONFIG.DEFAULT_POSITION}
          zoom={isAdminView ? MAP_CONFIG.ADMIN_DEFAULT_ZOOM : MAP_CONFIG.DEFAULT_ZOOM}
          minZoom={MAP_CONFIG.MIN_ZOOM}
          maxZoom={MAP_CONFIG.MAX_ZOOM}
          zoomDelta={MAP_CONFIG.ZOOM_DELTA}
          zoomSnap={MAP_CONFIG.ZOOM_SNAP}
          zoomControl={false}
          style={{
            width: isAdminView ? '100%' : '100vw',
            height: isAdminView ? '100%' : '100svh',
            minHeight: isAdminView ? '400px' : '100svh',
          }}
          className="focus:outline-none focus:ring-2 focus:ring-primary"
          whenReady={handleMapCreated}
          attributionControl={false}
        >
          {MAP_LAYERS.filter((layer) => layer.key === activeLayer).map((layer) => (
            <TileLayer
              key={layer.key}
              attribution={layer.attribution}
              url={layer.url}
              crossOrigin="anonymous"
              maxZoom={MAP_CONFIG.MAX_ZOOM}
            />
          ))}

          <EventClusterMarkers
            safeMarkers={filteredMarkers}
            infoButtonToggled={infoButtonToggled}
            setInfoButtonToggled={setInfoButtonToggled}
            isMobile={isMobile}
            updateMarker={updateMarker}
            isMarkerDraggable={(marker) =>
              isMarkerDraggable(marker, isAdminView) || (editMode && marker.id === selectedMarkerId)
            }
            iconCreateFunction={iconCreateFunction}
            selectedYear={selectedYear}
            isAdminView={isAdminView}
            applyVisitorSizing={previewUseVisitorSizing}
            selectedMarkerId={selectedMarkerId}
            onMarkerSelect={onMarkerSelect}
            focusMarkerId={focusMarkerId}
            onFocusHandled={() => setFocusMarkerId(null)}
            currentZoom={currentZoom}
            zoomAnimating={zoomAnimating}
            onMarkerDrag={onMarkerDrag}
          />

          <EventSpecialMarkers
            safeMarkers={safeMarkers}
            infoButtonToggled={infoButtonToggled}
            setInfoButtonToggled={setInfoButtonToggled}
            isMobile={isMobile}
            updateMarker={updateMarker}
            isMarkerDraggable={(marker) =>
              isMarkerDraggable(marker, isAdminView) || (editMode && marker.id === selectedMarkerId)
            }
            selectedMarkerId={selectedMarkerId}
            onMarkerSelect={onMarkerSelect}
            isAdminView={isAdminView}
            applyVisitorSizing={previewUseVisitorSizing}
            selectedYear={selectedYear}
            currentZoom={currentZoom}
            zoomAnimating={zoomAnimating}
            onMarkerDrag={onMarkerDrag}
          />
        </MapContainer>
      </div>
    </div>
  );
}

EventMap.propTypes = {
  isAdminView: PropTypes.bool,
  previewUseVisitorSizing: PropTypes.bool,
  markersState: PropTypes.array,
  updateMarker: PropTypes.func.isRequired,
  selectedYear: PropTypes.number,
  selectedMarkerId: PropTypes.number,
  onMarkerSelect: PropTypes.func,
  editMode: PropTypes.bool,
  onMarkerDrag: PropTypes.func,
};

EventMap.defaultProps = {
  isAdminView: false,
  markersState: [],
  selectedYear: new Date().getFullYear(),
  selectedMarkerId: null,
  onMarkerSelect: null,
  previewUseVisitorSizing: false,
  editMode: false,
  onMarkerDrag: null,
};

export default EventMap;
