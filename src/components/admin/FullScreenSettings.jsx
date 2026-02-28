import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import { mdiFullscreen, mdiFullscreenExit } from '@mdi/js';

export default function FullScreenSettings() {
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Icon
              path={isFullscreen ? mdiFullscreenExit : mdiFullscreen}
              size={1}
              className="text-gray-500"
            />
            {t('settings.fullScreen.title', 'Full Screen Mode')}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {t(
              'settings.fullScreen.description',
              'Toggle full screen mode for an immersive experience.',
            )}
          </p>
        </div>
        <button
          onClick={toggleFullscreen}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isFullscreen
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
          }`}
        >
          {isFullscreen
            ? t('settings.fullScreen.exit', 'Exit Full Screen')
            : t('settings.fullScreen.enter', 'Enter Full Screen')}
        </button>
      </div>
    </div>
  );
}
