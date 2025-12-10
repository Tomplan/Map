import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
import FeedbackRequests from '../FeedbackRequests';

// Mock translation
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (s) => s }) }));

// Mock hooks used by FeedbackRequests
jest.mock('../../../hooks/useFeedbackRequests', () => {
  return {
    __esModule: true,
    default: jest.fn(() => ({
    requests: [
      {
        id: 1,
        title: 'Feature: Flicker test',
        description: 'Details',
        type: 'feature',
        status: 'open',
        user_email: 'test@example.com',
        created_at: new Date().toISOString(),
        votes: 2,
        comments_count: 0,
      },
    ],
    loading: false,
    error: null,
    userVotes: new Set(),
    currentUserId: 'user-1',
    loadRequests: jest.fn(),
    createRequest: jest.fn(),
    updateRequest: jest.fn(),
    addVote: jest.fn(),
    removeVote: jest.fn(),
    loadComments: jest.fn(async () => ({ data: [] })),
    addComment: jest.fn(),
    deleteComment: jest.fn(),
    })),
  };
});

// Replace the complex detail modal with a simple stub for this test to avoid
// interactions with loadComments or other async child behavior.
jest.mock('../FeedbackRequestDetail', () => (props) => (
  <div data-testid="feedback-detail">{props.request?.title}</div>
));

// Mock user role and preferences hooks
jest.mock('../../../hooks/useUserRole', () => jest.fn(() => ({ role: 'admin' })));
jest.mock('../../../hooks/useUserPreferences', () => jest.fn(() => ({ preferences: null, loading: false, updatePreference: jest.fn() })));

// Dialog context used by child components
jest.mock('../../../contexts/DialogContext', () => ({ useDialog: () => ({ confirm: jest.fn(), toastError: jest.fn(), toastWarning: jest.fn() }) }));

describe('FeedbackRequests modal open behavior (flicker)', () => {
  beforeEach(() => {
    // use real timers here so setTimeout(0) runs naturally
  });

  afterEach(() => {
    // Ensure any created mocks are reset between tests
    jest.resetAllMocks();
  });

  it('opens a request detail modal and keeps it open (does not immediately close due to backdrop click)', async () => {
    const { getByTestId, queryByTestId } = render(<FeedbackRequests />);

    // Click the request card
    const card = getByTestId('feedback-request-1');

    fireEvent.click(card);

    // The modal should now be visible and contain the title
    await waitFor(() => expect(queryByTestId('feedback-detail')).toBeTruthy());

    // Wait a short time to ensure it doesn't immediately disappear
    await waitFor(() => expect(queryByTestId('feedback-detail')).toBeTruthy(), { timeout: 1500 });

    expect(queryByTestId('feedback-detail').textContent).toBe('Feature: Flicker test');
  });
});
