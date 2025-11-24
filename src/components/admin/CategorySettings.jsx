import React from 'react';
import Icon from '@mdi/react';
import { mdiTag } from '@mdi/js';
import CategoryManagement from './CategoryManagement';

/**
 * CategorySettings - Wrapper for category management in settings menu
 * Only visible to system managers and super admins
 */
export default function CategorySettings() {
  return <CategoryManagement />;
}
