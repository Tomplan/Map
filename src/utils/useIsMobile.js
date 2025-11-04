// utils/useIsMobile.js
import { useEffect, useState } from 'react';

export default function useIsMobile(breakpoint = 'md') {
  const breakpoints = {
    sm: '(max-width: 639px)',
    md: '(max-width: 767px)',
    lg: '(max-width: 1023px)',
    xl: '(max-width: 1279px)',
    '2xl': '(max-width: 1535px)',
  };

  const query = breakpoints[breakpoint] || breakpoints.md;
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia(query);
    const handleChange = () => setIsMobile(media.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [query]);

  return isMobile;
}
