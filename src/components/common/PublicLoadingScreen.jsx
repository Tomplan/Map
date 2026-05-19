import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { getDefaultLogoPath } from '../../utils/getDefaultLogo';

export default function PublicLoadingScreen({ message }) {
  const { t } = useTranslation();
  const [fixedLogo] = React.useState(() => getDefaultLogoPath());

  const loadingMessage = message || t('common.loading');

  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="mb-10 flex h-28 w-[220px] items-center justify-center overflow-hidden">
          <img src={fixedLogo} alt="Loading" className="h-28 w-[220px] object-contain" />
        </div>
        <div className="mb-4 flex items-center gap-2" aria-hidden="true">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-orange-400" />
          <span
            className="h-2.5 w-2.5 animate-pulse rounded-full bg-orange-500"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="h-2.5 w-2.5 animate-pulse rounded-full bg-orange-600"
            style={{ animationDelay: '300ms' }}
          />
        </div>
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-orange-600">
          {loadingMessage}
        </p>
      </div>
    </div>
  );
}

PublicLoadingScreen.propTypes = {
  message: PropTypes.string,
};

PublicLoadingScreen.defaultProps = {
  message: null,
};
