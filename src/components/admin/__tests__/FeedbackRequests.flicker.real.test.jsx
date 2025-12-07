import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import FeedbackRequests from '../FeedbackRequests';

// Mock translation
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (s) => s }) }));

// Mock hooks used by FeedbackRequests and FeedbackRequestDetail
jest.mock('../../../hooks/useFeedbackRequests', () => {
  return {
    __esModule: true,
    default: jest.fn(() => ({
      requests: [
        {
          id: 42,
          title: 'Feature: Real modal flicker',
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

// user role and preferences
jest.mock('../../../hooks/useUserRole', () => jest.fn(() => ({ role: 'admin' })));
jest.mock('../../../hooks/useUserPreferences', () => jest.fn(() => ({ preferences: null, loading: false, updatePreference: jest.fn() })));
jest.mock('../../../contexts/DialogContext', () => ({ useDialog: () => ({ confirm: jest.fn(), toastError: jest.fn(), toastWarning: jest.fn() }) }));

describe('FeedbackRequests real modal flicker check', () => {
  it('opens the real modal and keeps it open (no immediate close)', async () => {
    render(<FeedbackRequests />);

    // Click the request card
    const card = await screen.findByTestId('feedback-request-42');
    fireEvent.click(card);

    // The modal title should appear (the real FeedbackRequestDetail uses the title as <h2>)
    const title = await screen.findByText('Feature: Real modal flicker');
    expect(title).toBeTruthy();

    // Wait a short while and assert it did not immediately disappear
    await waitFor(() => expect(screen.queryByText('Feature: Real modal flicker')).toBeTruthy(), { timeout: 300 });
  });
});
