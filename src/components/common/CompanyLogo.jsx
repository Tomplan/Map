import React from 'react';
import Icon from '@mdi/react';
import { mdiDomain, mdiArchive } from '@mdi/js';
import { getLogoPath, getResponsiveLogoSources } from '../../utils/getLogoPath';
import { getDefaultLogoPath } from '../../utils/getDefaultLogo';

export default function CompanyLogo({
  logo,
  name,
  backgroundColor,
  sizeClassName = 'w-8 h-8',
  wrapperClassName = '',
  imgClassName = 'w-full h-full object-contain',
  roundedClassName = 'rounded',
  fallback = 'domain',
  defaultBackgroundColor = 'transparent',
}) {
  const source = logo && logo.trim() !== '' ? logo : getDefaultLogoPath();
  const responsive = getResponsiveLogoSources(source);
  const effectiveBackgroundColor = backgroundColor || defaultBackgroundColor;

  return (
    <div
      className={`${sizeClassName} ${roundedClassName} ${wrapperClassName}`.trim()}
      style={{ backgroundColor: effectiveBackgroundColor }}
    >
      {logo ? (
        <img
          {...(responsive
            ? { src: responsive.src, srcSet: responsive.srcSet, sizes: responsive.sizes }
            : { src: getLogoPath(source) })}
          alt={name || 'Company logo'}
          className={imgClassName}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Icon
            path={fallback === 'archive' ? mdiArchive : mdiDomain}
            size={0.8}
            className="text-gray-300"
          />
        </div>
      )}
    </div>
  );
}
