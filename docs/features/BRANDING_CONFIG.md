# Branding Configuration Guide

## Overview

The default logo (`4x4Vakantiebeurs.png`) is now centrally managed through the `BRANDING_CONFIG` constant in `src/config/mapConfig.js`. This makes it easy to update the default logo across the entire application.

## How to Change the Default Logo

### Option 1: Update the Configuration File (Recommended)

1. Open `src/config/mapConfig.js`
2. Locate the `BRANDING_CONFIG` object:
   ```javascript
   export const BRANDING_CONFIG = {
     DEFAULT_LOGO: '4x4Vakantiebeurs.png',
     getDefaultLogoPath: () =>
       `${import.meta.env.BASE_URL}assets/logos/${BRANDING_CONFIG.DEFAULT_LOGO}`,
   };
   ```
3. Change the `DEFAULT_LOGO` value to your new logo filename:
   ```javascript
   DEFAULT_LOGO: 'my-new-logo.png',
   ```
4. Ensure your logo file is placed in `public/assets/logos/`

### Option 2: Update Through the Admin Dashboard

The default logo can also be overridden at runtime through the Admin Dashboard's Branding Settings panel. This allows you to:

- Upload a custom logo
- Change the event name
- Adjust theme colors
- Modify font families

Changes made through the admin dashboard are stored in Supabase and take precedence over the default configuration.

## Files Updated

All references to the hardcoded `4x4Vakantiebeurs.png` have been replaced with `BRANDING_CONFIG`:

- ✅ `src/config/mapConfig.js` - Central configuration
- ✅ `src/App.jsx` - Main app branding state
- ✅ `src/components/AdminDashboard.jsx` - Admin dashboard branding
- ✅ `src/components/AdminLogin.jsx` - Login page logo
- ✅ `src/components/BrandingSettings.jsx` - Branding settings defaults
- ✅ `src/utils/clusterIcons.js` - Cluster marker logos

## Best Practices

1. **Logo Files**: Place all logo files in `public/assets/logos/`
2. **Naming**: Use descriptive filenames without spaces (e.g., `event-logo-2025.png`)
3. **Formats**: Supported formats include PNG, AVIF, JPG, SVG
4. **Size**: Optimize logos for web (recommended max 200KB)
5. **Aspect Ratio**: Logos with square or landscape orientation work best

## Example

To change to a new event logo:

```javascript
// In src/config/mapConfig.js
export const BRANDING_CONFIG = {
  DEFAULT_LOGO: 'winter-event-2025.png',
  getDefaultLogoPath: () =>
    `${import.meta.env.BASE_URL}assets/logos/${BRANDING_CONFIG.DEFAULT_LOGO}`,
};
```

Then place `winter-event-2025.png` in `public/assets/logos/`.
