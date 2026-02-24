import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DialogProvider, useDialog } from '../../../contexts/DialogContext';
import MapManagement from '../MapManagement';

// --- MOCKS TO FIX JEST ENV ISSUES ---
// These files use import.meta.env which fails in Jest (Node env)

jest.mock('../../../config/markerTableConfig', () => ({
  ICON_OPTIONS: [],
  ICON_PATH_PREFIX: 'assets/icons/',
  TABS: { CORE: 'core' },
}));

jest.mock('../../../config/markerTabsConfig', () => ({
  TABS: [],
  ICON_OPTIONS: [],
  ICON_PATH_PREFIX: 'assets/icons/',
}));

jest.mock('../../../utils/getLogoPath', () => ({
  getLogoPath: (path) => path,
  getResponsiveLogoSources: () => ({ src: '', srcSet: '', sizes: '' }),
}));

// --- COMPONENT MOCKS ---

// Mock EventMap to avoid heavy dependencies and import.meta issues
jest.mock('../../EventMap/EventMap', () => () => <div data-testid="event-map-mock" />);

jest.mock('../../../hooks/useUserRole', () => ({
  __esModule: true,
  default: () => ({
    role: 'super_admin',
    isSuperAdmin: true, // needed for admin check
    isSystemManager: true,
    isEventManager: false, // Must be false to meaningful edit
    hasAnyRole: () => true,
  }),
}));

// Mock DialogContext
const mockToastSuccess = jest.fn();
jest.mock('../../../contexts/DialogContext', () => {
  const actual = jest.requireActual('../../../contexts/DialogContext');
  return {
    ...actual,
    useDialog: () => ({
      confirm: jest.fn(),
      toastError: jest.fn(),
      toastSuccess: mockToastSuccess,
    }),
    DialogProvider: ({ children }) => <div>{children}</div>
  };
});

// Mock Supabase & Hooks
jest.mock('../../../supabaseClient', () => ({
  supabase: {
    from: () => ({ 
      select: () => ({ 
        eq: () => ({ then: (cb) => cb({ data: [], error: null }) }) 
      }) 
    }),
    channel: () => ({ 
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }) 
    }),
    removeChannel: () => {},
    auth: { getUser: () => Promise.resolve({ data: { user: {} } }) },
  },
}));

jest.mock('../../../hooks/useEventSubscriptions', () => ({
  __esModule: true,
  default: () => ({ subscriptions: [], loading: false, refetch: jest.fn() }),
}));

jest.mock('../../../hooks/useAssignments', () => ({
  __esModule: true,
  default: () => ({ assignments: [], loadAssignments: jest.fn(), loading: false }),
}));

// Mock OrganizationLogoContext
jest.mock('../../../contexts/OrganizationLogoContext', () => ({
  useOrganizationLogo: () => ({ logoPath: '' }),
}));


const defaultProps = {
  selectedYear: '2025',
  markersState: [{ id: 1, name: 'Test Marker' }], // Providing markers to avoid empty state
  assignmentsState: {
    assignments: [],
    loading: false,
  },
  setMarkersState: jest.fn(),
  updateMarker: jest.fn(),
  undo: jest.fn(),
  redo: jest.fn(),
  canUndo: false,
  canRedo: false,
  archiveMarkers: jest.fn(),
  copyMarkers: jest.fn(),
  markerHistoryStack: [],
  markerRedoStack: [],
};

describe('MapManagement Edit All Button', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders "Edit All" button in the markers list header', () => {
    render(
      <DialogProvider>
        <MapManagement {...defaultProps} />
      </DialogProvider>
    );
    
    // Open the sidebar first (the toggle is the Chevron Right icon when closed)
    const toggleBtn = screen.getByTitle('Show Markers & Details');
    fireEvent.click(toggleBtn);
    
    // Now Edit All button should be visible/accessible
    const editAllBtn = screen.getByTitle('Edit All Markers'); // Title is 'Edit All Markers' in code
    expect(editAllBtn).toBeInTheDocument();
  });

  test('shows "not implemented" toast when clicked', () => {
    render(
      <DialogProvider>
        <MapManagement {...defaultProps} />
      </DialogProvider>
    );

    // Open the sidebar first
    const toggleBtn = screen.getByTitle('Show Markers & Details');
    fireEvent.click(toggleBtn);

    const editAllBtn = screen.getByTitle('Edit All Markers');
    fireEvent.click(editAllBtn);

    expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringMatching(/not implemented/i));
  });
});
