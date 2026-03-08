import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import QRCodeStyling from 'qr-code-styling';
import Icon from '@mdi/react';
import {
  mdiQrcode,
  mdiDownload,
  mdiRefresh,
  mdiFormatColorFill,
  mdiShape,
  mdiImage,
  mdiBorderAll,
  mdiDotsGrid,
  mdiViewGrid,
  mdiContentSave,
  mdiDelete,
  mdiChevronDown,
  mdiEyedropper,
  mdiPlus,
  mdiCloudUpload,
  mdiDomain,
  mdiVectorCurve,
} from '@mdi/js';
import { useOrganizationLogo } from '../../contexts/OrganizationLogoContext';
import { supabase } from '../../supabaseClient';
import useUserRole from '../../hooks/useUserRole';

const ORG_DEFAULT_ID = 'organization_default';

const PRESETS = [
  {
    id: 'default',
    label: 'Standard',
    preview: { dots: 'square', color: '#000000', bg: '#ffffff' },
    config: {
      width: 300,
      height: 300,
      margin: 10,
      imageOptions: { crossOrigin: 'anonymous', margin: 5, imageSize: 0.4 },
      dotsOptions: { color: '#000000', type: 'square' },
      backgroundOptions: { color: '#ffffff' },
      cornersSquareOptions: { type: 'square', color: '#000000' },
      cornersDotOptions: { type: 'square', color: '#000000' },
    },
  },
  {
    id: 'rounded-blue',
    label: 'Modern Blue',
    preview: { dots: 'rounded', color: '#2563eb', bg: '#ffffff' },
    config: {
      width: 300,
      height: 300,
      margin: 10,
      imageOptions: { crossOrigin: 'anonymous', margin: 5, imageSize: 0.4 },
      dotsOptions: { color: '#2563eb', type: 'rounded' },
      backgroundOptions: { color: '#ffffff' },
      cornersSquareOptions: { type: 'extra-rounded', color: '#2563eb' },
      cornersDotOptions: { type: 'dot', color: '#2563eb' },
    },
  },
  {
    id: 'dots-dark',
    label: 'Dark Dots',
    preview: { dots: 'dots', color: '#1f2937', bg: '#f3f4f6' },
    config: {
      width: 300,
      height: 300,
      margin: 10,
      imageOptions: { crossOrigin: 'anonymous', margin: 5, imageSize: 0.4 },
      dotsOptions: { color: '#1f2937', type: 'dots' },
      backgroundOptions: { color: '#f3f4f6' },
      cornersSquareOptions: { type: 'dot', color: '#1f2937' },
      cornersDotOptions: { type: 'dot', color: '#1f2937' },
    },
  },
  {
    id: 'classy-gold',
    label: 'Elegant Gold',
    preview: { dots: 'classy', color: '#854d0e', bg: '#fefce8' },
    config: {
      width: 300,
      height: 300,
      margin: 10,
      imageOptions: { crossOrigin: 'anonymous', margin: 5, imageSize: 0.4 },
      dotsOptions: { color: '#854d0e', type: 'classy' },
      backgroundOptions: { color: '#fefce8' },
      cornersSquareOptions: { type: 'extra-rounded', color: '#854d0e' },
      cornersDotOptions: { type: 'dot', color: '#854d0e' },
    },
  },
  {
    id: 'gradient-purple',
    label: 'Tech Purple',
    preview: { dots: 'square', color: '#7e22ce', bg: '#ffffff' },
    config: {
      width: 300,
      height: 300,
      margin: 10,
      imageOptions: { crossOrigin: 'anonymous', margin: 5, imageSize: 0.4 },
      dotsOptions: {
        color: '#7e22ce',
        type: 'square',
        gradient: {
          type: 'linear',
          rotation: 45,
          colorStops: [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: '#7e22ce' },
          ],
        },
      },
      backgroundOptions: { color: '#ffffff' },
      cornersSquareOptions: { type: 'extra-rounded', color: '#7e22ce' },
      cornersDotOptions: { type: 'square', color: '#7e22ce' },
    },
  },
];

const DOT_TYPES = [
  { value: 'square', label: 'Square' },
  { value: 'dots', label: 'Dots' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'classy', label: 'Classy' },
  { value: 'classy-rounded', label: 'Classy Rounded' },
  { value: 'extra-rounded', label: 'Extra Rounded' },
];

const CORNER_SQUARE_TYPES = [
  { value: 'square', label: 'Square' },
  { value: 'dot', label: 'Dot' },
  { value: 'extra-rounded', label: 'Extra Rounded' },
];

const CORNER_DOT_TYPES = [
  { value: 'square', label: 'Square' },
  { value: 'dot', label: 'Dot' },
];

const COLOR_PRESETS = [
  '#000000', // Black
  '#dc2626', // Red
  '#ea580c', // Orange
  '#facc15', // Yellow
  '#16a34a', // Green
  '#2563eb', // Blue
  '#9333ea', // Purple
  '#db2777', // Pink
  '#4b5563', // Gray
  '#ffffff', // White
];

// Helper functions for the color picker
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r, g, b) => {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

const ColorPicker = ({ label, value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const [rgb, setRgb] = useState({ r: 0, g: 0, b: 0 });
  const [hexInput, setHexInput] = useState(value.replace('#', '').toUpperCase());
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const [presets, setPresets] = useState(() => {
    // Load presets from localStorage or use defaults
    try {
      const saved = localStorage.getItem('qr-color-presets');
      return saved ? JSON.parse(saved) : COLOR_PRESETS;
    } catch (e) {
      return COLOR_PRESETS;
    }
  });

  useEffect(() => {
    setRgb(hexToRgb(value));
    setHexInput(value.replace('#', '').toUpperCase());
  }, [value]);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const updatePos = () => {
        const rect = triggerRef.current.getBoundingClientRect();
        // Check if we should flip up (if at bottom of screen)
        const spaceBelow = window.innerHeight - rect.bottom;
        const popoverHeight = 350; // approximate max height

        let top = rect.bottom + window.scrollY + 4;
        // If close to bottom, show above
        if (spaceBelow < popoverHeight && rect.top > popoverHeight) {
          top = rect.top + window.scrollY - popoverHeight; // Simplified, ideally measure ref
        }

        setPopoverPos({
          top: top,
          left: rect.left + window.scrollX,
        });
      };

      updatePos();
      window.addEventListener('resize', updatePos);
      window.addEventListener('scroll', updatePos, true);
      return () => {
        window.removeEventListener('resize', updatePos);
        window.removeEventListener('scroll', updatePos, true);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleRgbChange = (key, val) => {
    const newVal = Math.max(0, Math.min(255, Number(val)));
    const newRgb = { ...rgb, [key]: newVal };
    setRgb(newRgb);
    onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const handleEyeDropper = async () => {
    if (!window.EyeDropper) return;
    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      onChange(result.sRGBHex);
    } catch (e) {
      console.log('Eyedropper canceled');
    }
  };

  const handleAddPreset = () => {
    const colorToAdd = value.toUpperCase();
    if (!presets.includes(colorToAdd)) {
      const newPresets = [...presets, colorToAdd];
      // Keep only last 20 presets if it grows too large
      if (newPresets.length > 20) newPresets.shift();
      setPresets(newPresets);
      localStorage.setItem('qr-color-presets', JSON.stringify(newPresets));
    }
  };

  const popoverContent =
    isOpen && !disabled ? (
      <div
        ref={popoverRef}
        className="absolute z-[9999] w-[280px] bg-[#f2f2f2] rounded-lg shadow-2xl border border-gray-300/50 p-3 animate-fade-in origin-top-left text-gray-800 font-sans select-none"
        style={{ top: popoverPos.top, left: popoverPos.left }}
      >
        {/* Header */}
        <div className="text-center text-xs font-semibold text-gray-500 mb-3 tracking-wide">
          RGB Sliders
        </div>

        {/* Sliders Section */}
        <div className="space-y-3 mb-4 px-1">
          {/* Red */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium w-8 text-right">Red</span>
            <div className="flex-1 h-5 relative flex items-center">
              <div
                className="absolute inset-0 rounded-full h-1.5"
                style={{
                  background: `linear-gradient(to right, rgb(0, ${rgb.g}, ${rgb.b}), rgb(255, ${rgb.g}, ${rgb.b}))`,
                }}
              ></div>
              <input
                type="range"
                min="0"
                max="255"
                value={rgb.r}
                onChange={(e) => handleRgbChange('r', e.target.value)}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
              <div
                className="pointer-events-none absolute h-3.5 w-3.5 bg-white border border-gray-300 rounded-full shadow-sm"
                style={{ left: `${(rgb.r / 255) * 100}%`, transform: 'translateX(-50%)' }}
              />
            </div>
            <input
              type="number"
              min="0"
              max="255"
              value={rgb.r}
              onChange={(e) => handleRgbChange('r', e.target.value)}
              className="w-10 h-5 text-xs text-center border border-gray-300 rounded shadow-sm bg-white focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          {/* Green */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium w-8 text-right">Green</span>
            <div className="flex-1 h-5 relative flex items-center">
              <div
                className="absolute inset-0 rounded-full h-1.5"
                style={{
                  background: `linear-gradient(to right, rgb(${rgb.r}, 0, ${rgb.b}), rgb(${rgb.r}, 255, ${rgb.b}))`,
                }}
              ></div>
              <input
                type="range"
                min="0"
                max="255"
                value={rgb.g}
                onChange={(e) => handleRgbChange('g', e.target.value)}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
              <div
                className="pointer-events-none absolute h-3.5 w-3.5 bg-white border border-gray-300 rounded-full shadow-sm"
                style={{ left: `${(rgb.g / 255) * 100}%`, transform: 'translateX(-50%)' }}
              />
            </div>
            <input
              type="number"
              min="0"
              max="255"
              value={rgb.g}
              onChange={(e) => handleRgbChange('g', e.target.value)}
              className="w-10 h-5 text-xs text-center border border-gray-300 rounded shadow-sm bg-white focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          {/* Blue */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium w-8 text-right">Blue</span>
            <div className="flex-1 h-5 relative flex items-center">
              <div
                className="absolute inset-0 rounded-full h-1.5"
                style={{
                  background: `linear-gradient(to right, rgb(${rgb.r}, ${rgb.g}, 0), rgb(${rgb.r}, ${rgb.g}, 255))`,
                }}
              ></div>
              <input
                type="range"
                min="0"
                max="255"
                value={rgb.b}
                onChange={(e) => handleRgbChange('b', e.target.value)}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
              <div
                className="pointer-events-none absolute h-3.5 w-3.5 bg-white border border-gray-300 rounded-full shadow-sm"
                style={{ left: `${(rgb.b / 255) * 100}%`, transform: 'translateX(-50%)' }}
              />
            </div>
            <input
              type="number"
              min="0"
              max="255"
              value={rgb.b}
              onChange={(e) => handleRgbChange('b', e.target.value)}
              className="w-10 h-5 text-xs text-center border border-gray-300 rounded shadow-sm bg-white focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <span className="text-xs text-gray-500">Hex Colour #</span>
            <input
              type="text"
              value={hexInput}
              onChange={(e) => {
                const val = e.target.value;
                if (/^[0-9A-Fa-f]{0,6}$/.test(val)) {
                  setHexInput(val.toUpperCase());
                  if (val.length === 6) onChange('#' + val);
                }
              }}
              onBlur={() => {
                if (hexInput.length !== 6) {
                  setHexInput(value.replace('#', '').toUpperCase());
                }
              }}
              className="w-20 h-6 text-xs px-2 border border-gray-300 rounded shadow-sm bg-white uppercase focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="border-t border-gray-300 my-3"></div>

        {/* Footer: Swatch + Eyedropper + Presets */}
        <div className="flex gap-2">
          {/* Large Preview */}
          <div
            className="w-12 h-12 rounded-lg border border-gray-300 shadow-sm shrink-0"
            style={{ backgroundColor: value }}
          />
          {/* Eyedropper */}
          <button
            onClick={handleEyeDropper}
            className="w-8 h-full flex flex-col items-center justify-center text-gray-500 hover:text-gray-800"
            title="Eyedropper"
            disabled={!window.EyeDropper}
          >
            <Icon path={mdiEyedropper} size={1} />
          </button>
          <div className="border-r border-gray-300 h-10 self-center mx-1"></div>
          {/* Grid */}
          <div className="grid grid-cols-5 gap-1 pt-1">
            {presets.map((color, index) => (
              <button
                key={`${color}-${index}`}
                onClick={() => {
                  onChange(color);
                  setIsOpen(false);
                }}
                className="w-5 h-4 border border-gray-400/50 bg-black/5 rounded-[1px] overflow-hidden hover:opacity-80 focus:outline-none focus:ring-1 focus:ring-blue-500"
                title={color}
              >
                <div className="w-full h-full" style={{ backgroundColor: color }} />
              </button>
            ))}
            {/* Add Preset Button */}
            <button
              onClick={handleAddPreset}
              className="w-5 h-4 border border-gray-400/50 bg-gray-50 hover:bg-gray-100 flex items-center justify-center rounded-[1px] text-gray-500"
              title="Save current color"
            >
              <Icon path={mdiPlus} size={0.6} />
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div className="relative inline-block text-left" ref={triggerRef}>
      {label && <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>}
      {/* Trigger Button - Mimicking the small swatch */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-[40px] h-[24px] rounded border border-gray-300 shadow-sm p-[2px] bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title="Choose color"
      >
        <div
          className="w-full h-full rounded-[2px] border border-black/10"
          style={{ backgroundColor: value }}
        />
      </button>

      {createPortal(popoverContent, document.body)}
    </div>
  );
};

const ShareApp = () => {
  const { t } = useTranslation();
  const { role } = useUserRole();
  const { organizationLogo, organizationLogoRaw, loading: logoLoading } = useOrganizationLogo();
  const qrRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [savedPresets, setSavedPresets] = useState([]);
  const [presetName, setPresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [orgDefaultConfig, setOrgDefaultConfig] = useState(null);
  const [loadingOrgPreset, setLoadingOrgPreset] = useState(true);
  const [isDynamicLogo, setIsDynamicLogo] = useState(true); // Track if we are using dynamic org logo

  // Path to the logo in public folder
  const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  // Use the current window location as the base for the QR code
  // This ensures it works for Production, Staging, and Dev environments automatically
  // If VITE_DEFAULT_PATH is set (staging), append ?mode=visitor to bypass the admin redirect
  const queryString =
    import.meta.env.VITE_DEFAULT_PATH && import.meta.env.VITE_DEFAULT_PATH !== '/'
      ? '?mode=visitor'
      : '';

  const APP_URL = window.location.origin + baseUrl + queryString;

  // Configuration State
  const [config, setConfig] = useState({
    type: 'svg',
    width: 2048,
    height: 2048,
    margin: 80,
    data: APP_URL,
    image: '',
    qrOptions: {
      typeNumber: 0,
      mode: 'Byte',
      errorCorrectionLevel: 'H',
    },
    dotsOptions: {
      color: '#000000',
      type: 'square',
    },
    backgroundOptions: {
      color: '#ffffff',
    },
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: 20, // Increased default margin for high res
      imageSize: 0.4,
    },
    cornersSquareOptions: {
      type: 'square',
      color: '#000000',
    },
    cornersDotOptions: {
      type: 'square',
      color: '#000000',
    },
  });

  // Load saved presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('qr_presets');
    if (saved) {
      try {
        setSavedPresets(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load presets', e);
      }
    }
  }, []);

  // Load organization default preset
  useEffect(() => {
    const fetchOrgDefault = async () => {
      try {
        const { data, error } = await supabase
          .from('organization_profile')
          .select('qr_config')
          .eq('id', 1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching org default QR:', error);
        }

        if (data?.qr_config && Object.keys(data.qr_config).length > 0) {
          setOrgDefaultConfig(data.qr_config);
          // Apply organization default style on initial load
          // Only apply styles, preserve data content
          const hasSavedImage = data.qr_config.image !== undefined && data.qr_config.image !== '';
          setConfig((prev) => ({
            ...prev,
            ...data.qr_config,
            data: prev.data,
            // Prioritize the Organization Logo if the org default config doesn't specify one
            // (Since we usually delete it on save, this means it will use the default logic)
            image: hasSavedImage ? data.qr_config.image : '',
          }));
          setIsDynamicLogo(!hasSavedImage);
          setSelectedPresetId(ORG_DEFAULT_ID);
        } else {
          // No saved config, default to dynamic
          setIsDynamicLogo(true);
        }
      } catch (err) {
        console.error('Error loading org default:', err);
      } finally {
        setLoadingOrgPreset(false);
      }
    };
    fetchOrgDefault();
  }, []);

  // Initialize generic QR Code Styling instance
  const qrCode = useMemo(() => new QRCodeStyling(config), []);

  // Update QR Code instance on config change
  useEffect(() => {
    // If we have a gradient, we should use it.
    // If dotsOptions.gradient is present but disabled/null, we must delete it
    // because qr-code-styling might prioritize it over 'color'.
    // However, the library typically prioritizes 'color' if 'gradient' is undefined.

    // Safe merge config
    const safeConfig = { ...config };

    // Explicitly set gradient to null if not present, to clear it
    // The library deep merges, so we need to be careful.
    const dotsOptionsUpdate = { ...config.dotsOptions };
    if (!dotsOptionsUpdate.gradient) {
      // Force removal by setting to null
      dotsOptionsUpdate.gradient = null;
    }

    try {
      qrCode.update({
        ...safeConfig,
        dotsOptions: dotsOptionsUpdate,
        image: safeConfig.image || undefined,
      });
    } catch (err) {
      console.warn('QR Generation Error (Density too low?):', err);
      // If the error is due to low density (typeNumber), revert to Auto
      if (safeConfig.qrOptions?.typeNumber && safeConfig.qrOptions.typeNumber > 0) {
        setConfig((prev) => ({
          ...prev,
          qrOptions: {
            ...prev.qrOptions,
            typeNumber: 0,
          },
        }));
      }
    }
  }, [config, qrCode]);

  // ... (rest of the code)

  // Initial render to container
  useEffect(() => {
    if (qrRef.current) {
      qrRef.current.innerHTML = '';
      qrCode.append(qrRef.current);
      setLoading(false);
    }
  }, [qrCode]);

  // Set default organization logo when loaded (ONLY if no custom image is set)
  useEffect(() => {
    // Wait for org preset loading to finish first to avoid race condition
    if (loadingOrgPreset) return;

    // Determine the best source URL for the logo:
    // 1. If we have a raw URL (http/https), use it directly to get high-res (Supabase storage original)
    // 2. Otherwise fall back to the resolved path (local assets/defaults)
    const logoSource =
      organizationLogoRaw &&
      (organizationLogoRaw.startsWith('http://') || organizationLogoRaw.startsWith('https://'))
        ? organizationLogoRaw
        : organizationLogo;

    // Ensure we don't accidentally overwrite an Org Default image that loaded quickly
    // 2. We now allow overwriting if the config.image is empty (which happens if Org Default
    //    has no image, i.e., dynamic)
    if (!logoLoading && logoSource && isDynamicLogo) {
      const cacheBust = new Date().getTime();
      const separator = logoSource.includes('?') ? '&' : '?';
      const srcUrl = logoSource.startsWith('data:')
        ? logoSource
        : `${logoSource}${separator}t=${cacheBust}`;

      // Only update if current image is different (ignoring cache bust for check to avoid infinite loop?)
      // Actually srcUrl changes every render because of Date().getTime().
      // Use ref to store last updated timestamp or just check if config.image includes logoSource?

      // Better: Check if config.image starts with logoSource (raw).
      const currentImage = config.image || '';
      if (!currentImage.includes(logoSource)) {
        setConfig((prev) => ({
          ...prev,
          image: srcUrl,
        }));
      }
    }
  }, [
    logoLoading,
    organizationLogo,
    organizationLogoRaw,
    loadingOrgPreset,
    isDynamicLogo,
    config.image,
  ]);

  const handleDownload = async (extension = 'png') => {
    // Determine the rendering type: SVG for SVG downloads, Canvas for raster images (PNG/JPG)
    const type = extension === 'svg' ? 'svg' : 'canvas';

    // Create a high-res instance specifically for download
    // Ensure sufficient margin on both exports to match the visual "white space" seen on screen
    // We add significant padding (+120px) to simulate the container padding
    const downloadMargin = (config.margin || 80) + 120;

    const highResQR = new QRCodeStyling({
      ...config,
      type: type,
      width: 2048,
      height: 2048,
      margin: downloadMargin,
      image: config.image || undefined,
    });
    try {
      await highResQR.download({
        name: 'event-map-qr-custom',
        extension: extension,
      });
      setShowExportMenu(false);
    } catch (err) {
      console.error('Download failed', err);
      alert('Download failed. Please try again.');
    }
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;

    try {
      const newPreset = {
        id: `user-${Date.now()}`,
        label: presetName,
        config: JSON.parse(JSON.stringify(config)), // Deep copy
      };

      const updatedPresets = [...savedPresets, newPreset];
      // Try stringify and setItem first to catch quota errors
      const serialized = JSON.stringify(updatedPresets);
      localStorage.setItem('qr_presets', serialized);

      // Only update state if storage succeeded
      setSavedPresets(updatedPresets);
      setPresetName('');
      setShowSaveDialog(false);
      setSelectedPresetId(newPreset.id); // Select the new preset
    } catch (e) {
      console.error('Failed to save preset:', e);
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        alert(
          'Failed to save: The image is too large for local storage. Please try a smaller image or ask a Super Admin to save it as the Organization Default.',
        );
      } else {
        alert('Failed to save preset: ' + e.message);
      }
    }
  };

  const handleDeletePreset = () => {
    if (!selectedPresetId || !selectedPresetId.startsWith('user-')) return;

    if (window.confirm('Are you sure you want to delete this preset?')) {
      const updatedPresets = savedPresets.filter((p) => p.id !== selectedPresetId);
      setSavedPresets(updatedPresets);
      localStorage.setItem('qr_presets', JSON.stringify(updatedPresets));
      setSelectedPresetId(''); // Reset selection
    }
  };

  const handleSaveOrgDefault = async () => {
    if (
      !window.confirm(
        'Are you sure you want to update the Organization Default QR style? This will affect all new sessions for all users.',
      )
    ) {
      return;
    }

    try {
      const configToSave = JSON.parse(JSON.stringify(config));

      // If we are in "dynamic logo" mode, we want to save the image as empty.
      // This ensures that future sessions will load the CURRENT (possibly updated) dynamic logo.
      // If we saved the resolved string, it would become static.
      if (isDynamicLogo) {
        configToSave.image = '';
      }

      const { error } = await supabase
        .from('organization_profile')
        .update({ qr_config: configToSave })
        .eq('id', 1);

      if (error) throw error;

      setOrgDefaultConfig(configToSave);
      setSelectedPresetId(ORG_DEFAULT_ID);
      // alert('Organization default updated successfully!'); // Avoiding alert if possible, but nice feedback
    } catch (err) {
      console.error('Error saving org default:', err);
      alert('Failed to save organization default: ' + err.message);
    }
  };

  const updateConfig = (section, key, value, subKey = null) => {
    setConfig((prev) => {
      const newConfig = { ...prev };
      if (section) {
        if (subKey) {
          // Handle nested updates (e.g., dotsOptions.gradient.rotation)
          newConfig[section] = {
            ...newConfig[section],
            [key]: {
              ...newConfig[section][key],
              [subKey]: value,
            },
          };
        } else {
          newConfig[section] = {
            ...newConfig[section],
            [key]: value,
          };
        }
      } else {
        newConfig[key] = value;
      }
      return newConfig;
    });
  };

  const handleGradientStopChange = (index, color) => {
    setConfig((prev) => {
      const newStops = [...prev.dotsOptions.gradient.colorStops];
      newStops[index] = { ...newStops[index], color };
      return {
        ...prev,
        dotsOptions: {
          ...prev.dotsOptions,
          gradient: {
            ...prev.dotsOptions.gradient,
            colorStops: newStops,
          },
        },
      };
    });
  };

  const handleGradientChange = (hasGradient) => {
    setConfig((prev) => {
      const newConfig = { ...prev };
      if (hasGradient) {
        newConfig.dotsOptions = {
          ...newConfig.dotsOptions,
          gradient: {
            type: 'linear',
            rotation: 0,
            colorStops: [
              { offset: 0, color: prev.dotsOptions.color || '#000000' },
              { offset: 1, color: '#3b82f6' },
            ],
          },
        };
      } else {
        const { gradient, ...rest } = newConfig.dotsOptions;
        newConfig.dotsOptions = rest;
        // Restore color from first stop or default
        if (gradient && gradient.colorStops && gradient.colorStops[0]) {
          newConfig.dotsOptions.color = gradient.colorStops[0].color;
        }
      }
      return newConfig;
    });
  };

  const handleApplyPreset = (id) => {
    if (!id) return;
    setSelectedPresetId(id);

    if (id === ORG_DEFAULT_ID && orgDefaultConfig) {
      applyPreset(orgDefaultConfig, ORG_DEFAULT_ID);
      return;
    }

    const systemPreset = PRESETS.find((p) => p.id === id);
    if (systemPreset) {
      applyPreset(systemPreset.config, id);
      return;
    }
    const userPreset = savedPresets.find((p) => p.id === id);
    if (userPreset) {
      applyPreset(userPreset.config, id);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setIsDynamicLogo(false);
        updateConfig(null, 'image', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyPreset = (presetConfig, presetId = null) => {
    // Determine if we should use the preset's image or keep the current one.
    // If the preset has a valid string/media URL, we use it.
    const hasPresetImage =
      'image' in presetConfig &&
      presetConfig.image !== undefined &&
      presetConfig.image !== null &&
      presetConfig.image !== '';

    // If preset forces an image, we switch to static mode.
    // If preset is the Org Default (which we now know saves image as ''), we interpret empty as dynamic.
    if (presetId === ORG_DEFAULT_ID) {
      setIsDynamicLogo(!hasPresetImage);
    } else if (hasPresetImage) {
      setIsDynamicLogo(false);
    }

    // Use image from preset if available, otherwise keep current.
    // If we're loading an Org Default that has had its image stripped (undefined or empty),
    // we want to fall back to empty so the live logo loader kicks in.
    let targetImage;
    if (hasPresetImage) {
      targetImage = presetConfig.image;
    } else if (presetId === ORG_DEFAULT_ID) {
      // Special case: If loading org default and it has no image, we want to RESET to live logo
      targetImage = '';
    } else {
      targetImage = undefined; // Signal to keep previous (undefined resolved below)
    }

    setConfig((prev) => ({
      ...presetConfig,
      // Preserve current data (URL)
      data: prev.data,
      // Use resolved image logic. If targetImage is undefined, keep prev.image.
      // If targetImage is '', it will clear the image and trigger dynamic loader.
      image: targetImage !== undefined ? targetImage : prev.image,
      // Couple image options (size, margin) to the image source.
      // If we use the preset's image (or reset it), we use its sizing.
      // If we keep our current image, we KEEP our current sizing.
      imageOptions:
        hasPresetImage || presetId === ORG_DEFAULT_ID
          ? { crossOrigin: 'anonymous', ...(presetConfig.imageOptions || {}) }
          : { ...prev.imageOptions, crossOrigin: 'anonymous' },
      // Ensure dimensions are high-res for crisp preview
      type: 'svg',
      width: 2048,
      height: 2048,
      margin: 80,
      // If we are applying a preset that DOESN'T specify errorCorrectionLevel, ensure 'H' is maintained
      // Also preserve typeNumber if the preset doesn't override it (structure vs style)
      qrOptions: {
        typeNumber: prev.qrOptions?.typeNumber || 0,
        errorCorrectionLevel: 'H',
        ...(presetConfig.qrOptions || {}),
      },
    }));
  };

  const SectionTitle = ({ icon, title }) => (
    <div className="flex items-center gap-2 mb-3 mt-6 pb-2 border-b border-gray-100">
      <Icon path={icon} size={0.8} className="text-blue-600" />
      <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">{title}</h4>
    </div>
  );

  return (
    <div className="h-full flex flex-col -m-6">
      <div className="flex-1 bg-white rounded-none flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon path={mdiQrcode} size={1.2} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {t('shareApp.customQrTitle', 'Custom QR Designer')}
              </h2>
              <p className="text-sm text-gray-500">
                {t(
                  'shareApp.customQrSubtitle',
                  'Customize style, colors and logo for your QR code',
                )}
              </p>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md font-medium"
            >
              <Icon path={mdiDownload} size={0.9} />
              Export
              <Icon
                path={mdiChevronDown}
                size={0.8}
                className={`transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`}
              />
            </button>

            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-20 py-1 overflow-hidden">
                  <button
                    onClick={() => handleDownload('png')}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700 border-b border-gray-50"
                  >
                    <span className="bg-blue-100 text-blue-700 font-bold text-[10px] px-1.5 py-0.5 rounded uppercase w-8 text-center">
                      PNG
                    </span>
                    <span className="text-sm font-medium">Download Image</span>
                  </button>
                  <button
                    onClick={() => handleDownload('svg')}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                  >
                    <span className="bg-purple-100 text-purple-700 font-bold text-[10px] px-1.5 py-0.5 rounded uppercase w-8 text-center">
                      SVG
                    </span>
                    <span className="text-sm font-medium">Download Vector</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
          {/* Controls Panel */}
          <div className="lg:w-1/2 p-6 lg:overflow-y-auto border-r border-gray-100 h-auto lg:h-full">
            {/* Presets */}
            <SectionTitle icon={mdiViewGrid} title="Presets" />
            <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <label className="block text-xs font-medium text-gray-500 mb-2">
                {t('shareApp.loadPreset', 'Load Style Preset')}
              </label>
              <div className="flex gap-2 relative">
                <select
                  onChange={(e) => handleApplyPreset(e.target.value)}
                  className="w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2.5 bg-white pr-10"
                  value={selectedPresetId}
                >
                  <option value="" disabled>
                    Select a style...
                  </option>
                  {orgDefaultConfig && (
                    <option value={ORG_DEFAULT_ID} className="font-bold text-blue-600">
                      🏢 Organization Default
                    </option>
                  )}
                  <optgroup label="System Presets">
                    {PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </optgroup>
                  {savedPresets.length > 0 && (
                    <optgroup label="My Saved Presets">
                      {savedPresets.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                {selectedPresetId &&
                  selectedPresetId.startsWith('user-') &&
                  role === 'super_admin' && (
                    <button
                      onClick={handleDeletePreset}
                      className="px-3 bg-white border border-red-200 text-red-500 rounded hover:bg-red-50"
                      title="Delete this preset"
                    >
                      <Icon path={mdiDelete} size={0.8} />
                    </button>
                  )}

                {role === 'super_admin' && (
                  <button
                    onClick={handleSaveOrgDefault}
                    className="px-3 bg-white border border-blue-200 text-blue-600 rounded hover:bg-blue-50"
                    title="Set as Organization Default"
                  >
                    <Icon path={mdiDomain} size={0.8} />
                  </button>
                )}

                <button
                  onClick={() => setShowSaveDialog(!showSaveDialog)}
                  className="px-3 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-600"
                  title="Save as Personal Preset"
                >
                  <Icon path={mdiContentSave} size={0.8} />
                </button>
              </div>

              {/* Save Dialog Inline */}
              {showSaveDialog && (
                <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-100 animate-fade-in">
                  <label className="block text-xs font-medium text-blue-800 mb-1">
                    Save Current Style As:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="My Custom Style"
                      className="flex-1 rounded border-blue-200 text-sm py-1 px-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSavePreset}
                      disabled={!presetName.trim()}
                      className="px-3 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Colors */}
            <SectionTitle icon={mdiFormatColorFill} title="Colors" />
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <ColorPicker
                  label="Background Color"
                  value={config.backgroundOptions.color}
                  onChange={(val) => updateConfig('backgroundOptions', 'color', val)}
                />

                {/* User Requested: Background Radius in Pixels */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Radius (px)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={Math.min(config.width, config.height) / 2}
                    step="1"
                    value={Math.round(
                      (config.backgroundOptions.round || 0) *
                        (Math.min(config.width, config.height) / 2),
                    )}
                    onChange={(e) => {
                      const px = parseInt(e.target.value) || 0;
                      const maxPx = Math.min(config.width, config.height) / 2;
                      // Convert px back to 0-1 ratio for the library
                      updateConfig('backgroundOptions', 'round', px / maxPx);
                    }}
                    className="w-full h-9 px-2 border border-blue-200 rounded text-sm shadow-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <ColorPicker
                  label="Dots Color"
                  value={config.dotsOptions.color}
                  onChange={(val) => updateConfig('dotsOptions', 'color', val)}
                  disabled={!!config.dotsOptions.gradient}
                />
              </div>

              {/* Gradient Controls */}
              <div className="border-t border-gray-100 pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-medium text-gray-700 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!config.dotsOptions.gradient}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        if (isChecked) {
                          setConfig((prev) => ({
                            ...prev,
                            dotsOptions: {
                              ...prev.dotsOptions,
                              gradient: {
                                type: 'linear',
                                rotation: 0,
                                colorStops: [
                                  { offset: 0, color: prev.dotsOptions.color || '#000000' },
                                  { offset: 1, color: '#3b82f6' },
                                ],
                              },
                            },
                          }));
                        } else {
                          // Remove gradient
                          setConfig((prev) => {
                            const { gradient, ...rest } = prev.dotsOptions;
                            return {
                              ...prev,
                              dotsOptions: { ...rest, color: rest.color || '#000000' },
                            };
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    Enable Gradient Fill
                  </label>
                </div>

                {config.dotsOptions.gradient && (
                  <div className="space-y-3 bg-gray-50 p-3 rounded-md border border-gray-100">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Type</label>
                        <select
                          value={config.dotsOptions.gradient.type}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              dotsOptions: {
                                ...prev.dotsOptions,
                                gradient: { ...prev.dotsOptions.gradient, type: e.target.value },
                              },
                            }))
                          }
                          className="w-full text-xs rounded border-gray-300 py-1.5"
                        >
                          <option value="linear">Linear</option>
                          <option value="radial">Radial</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Rotation (deg)</label>
                        <input
                          type="number"
                          value={config.dotsOptions.gradient.rotation}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              dotsOptions: {
                                ...prev.dotsOptions,
                                gradient: {
                                  ...prev.dotsOptions.gradient,
                                  rotation: Number(e.target.value),
                                },
                              },
                            }))
                          }
                          className="w-full text-xs rounded border-gray-300 py-1.5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <ColorPicker
                          label="Start Color"
                          value={config.dotsOptions.gradient.colorStops[0].color}
                          onChange={(val) => handleGradientStopChange(0, val)}
                        />
                      </div>
                      <div>
                        <ColorPicker
                          label="End Color"
                          value={config.dotsOptions.gradient.colorStops[1].color}
                          onChange={(val) => handleGradientStopChange(1, val)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Shapes */}
            <SectionTitle icon={mdiShape} title="Shapes & Style" />
            <div className="space-y-4">
              {/* Pattern Density Dropdown - Directly addresses "pixels too big" feedback */}
              <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-blue-900">
                    Pattern Density (QR Complexity)
                  </label>
                  <span className="text-xs text-blue-700 font-mono bg-blue-100 px-1.5 py-0.5 rounded">
                    {config.qrOptions?.typeNumber ? `Level ${config.qrOptions.typeNumber}` : 'Auto'}
                  </span>
                </div>
                <select
                  value={config.qrOptions?.typeNumber || 0}
                  onChange={(e) =>
                    updateConfig('qrOptions', 'typeNumber', parseInt(e.target.value))
                  }
                  className="w-full rounded border-blue-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 bg-white"
                >
                  <option value={0}>Auto</option>
                  <option value={3}>Low</option>
                  <option value={4}>Medium</option>
                  <option value={5}>Balanced</option>
                  <option value={6}>High</option>
                  <option value={7}>Very High</option>
                </select>
                <p className="text-[10px] text-blue-600/70 mt-1.5 leading-tight">
                  Controls how many small squares make up the code.
                  <br />
                  <span className="opacity-75">
                    Higher levels = smaller blocks = sharper look with logos.
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Dots Style</label>
                <select
                  value={config.dotsOptions.type}
                  onChange={(e) => updateConfig('dotsOptions', 'type', e.target.value)}
                  className="w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2"
                >
                  {DOT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Corner Square
                  </label>
                  <select
                    value={config.cornersSquareOptions.type}
                    onChange={(e) => updateConfig('cornersSquareOptions', 'type', e.target.value)}
                    className="w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2"
                  >
                    {CORNER_SQUARE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <ColorPicker
                    label="Corner Square Color"
                    value={config.cornersSquareOptions.color}
                    onChange={(val) => updateConfig('cornersSquareOptions', 'color', val)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Corner Dot</label>
                  <select
                    value={config.cornersDotOptions.type}
                    onChange={(e) => updateConfig('cornersDotOptions', 'type', e.target.value)}
                    className="w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2"
                  >
                    {CORNER_DOT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <ColorPicker
                    label="Corner Dot Color"
                    value={config.cornersDotOptions.color}
                    onChange={(val) => updateConfig('cornersDotOptions', 'color', val)}
                  />
                </div>
              </div>
            </div>

            {/* Logo */}
            <SectionTitle icon={mdiImage} title="Logo Customization" />
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Custom Logo</label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-xs file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Button to clear custom logo and revert to dynamic Org Logo */}
                    {/* If we are NOT using the dynamic org logo (meaning we have a custom image OR no image at all), show reset button */}
                    {!isDynamicLogo && (
                      <button
                        onClick={() => {
                          setIsDynamicLogo(true);
                          updateConfig(null, 'image', ''); // Will be refilled by effect
                        }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 rounded transition flex items-center gap-1"
                        title="Reset to Organization Logo"
                      >
                        <Icon path={mdiRefresh} size={0.7} />
                        Reset to Organization Logo
                      </button>
                    )}

                    {/* OPTION: No Logo (Clear entirely) */}
                    {(isDynamicLogo || (config.image && config.image !== '')) && (
                      <button
                        onClick={() => {
                          setIsDynamicLogo(false);
                          updateConfig(null, 'image', '');
                        }}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-xs text-red-700 rounded transition flex items-center gap-1 border border-red-100"
                        title="Remove Logo entirely"
                      >
                        <Icon path={mdiDelete} size={0.7} />
                        No Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Logo Size ({Math.round(config.imageOptions.imageSize * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.6"
                    step="0.05"
                    value={config.imageOptions.imageSize}
                    onChange={(e) =>
                      updateConfig('imageOptions', 'imageSize', parseFloat(e.target.value))
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  {config.imageOptions.imageSize > 0.4 && (
                    <div className="text-[10px] text-orange-600 mt-1">
                      Warning: Large logos may make QR hard to scan.
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Logo Margin ({config.imageOptions.margin}px)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={config.imageOptions.margin}
                    onChange={(e) =>
                      updateConfig('imageOptions', 'margin', parseInt(e.target.value))
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:w-1/2 p-8 bg-gray-50 flex flex-col items-center justify-center min-h-[400px] lg:h-full lg:overflow-hidden">
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 mb-8 max-w-full">
              <div
                ref={qrRef}
                className="qr-container [&>canvas]:max-w-full [&>canvas]:h-auto [&>svg]:max-w-full [&>svg]:h-auto flex justify-center"
                style={{ width: '100%', maxWidth: '1024px' }}
              />
            </div>

            <div className="text-center max-w-sm mx-auto space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Target URL</h3>
                {role === 'super_admin' ? (
                  <textarea
                    value={config.data || APP_URL}
                    onChange={(e) => updateConfig(null, 'data', e.target.value)}
                    rows={2}
                    className="w-full bg-white p-2 px-3 rounded text-xs text-blue-600 break-all font-mono border focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  />
                ) : (
                  <p className="bg-white p-2 px-3 rounded text-xs text-blue-600 break-all font-mono border">
                    {config.data || APP_URL}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 md:hidden w-full relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md font-medium"
                >
                  <Icon path={mdiDownload} size={1} />
                  Export QR Code
                  <Icon path={mdiChevronDown} size={0.8} />
                </button>

                {showExportMenu && (
                  <div className="bg-white rounded-lg border border-gray-100 shadow-xl overflow-hidden mt-1">
                    <button
                      onClick={() => handleDownload('png')}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700 border-b border-gray-100"
                    >
                      <span className="bg-blue-100 text-blue-700 font-bold text-[10px] px-1.5 py-0.5 rounded uppercase w-8 text-center">
                        PNG
                      </span>
                      <span className="text-sm font-medium">Download Image</span>
                    </button>
                    <button
                      onClick={() => handleDownload('svg')}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                    >
                      <span className="bg-purple-100 text-purple-700 font-bold text-[10px] px-1.5 py-0.5 rounded uppercase w-8 text-center">
                        SVG
                      </span>
                      <span className="text-sm font-medium">Download Vector</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareApp;
