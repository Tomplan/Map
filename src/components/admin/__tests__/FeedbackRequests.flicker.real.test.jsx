import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import FeedbackRequests from '../FeedbackRequests';

// Mock translation
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (s) => s }) }));

// Mock hooks used by FeedbackRequests and FeedbackRequestDetail
jest.mock('../../../hooks/useFeedbackRequests', () => {
  // return a stable mock object so hook returns same references across renders
  const mockApi = {
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
  };

  return {
    __esModule: true,
    default: jest.fn(() => mockApi),
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

    // The modal should appear (dialog role)
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeTruthy();

    // Wait a short while and assert it did not immediately disappear (use role-based query to avoid ambiguity)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeTruthy(), { timeout: 300 });
  });

  it('does not close when click-up lands on backdrop (simulated pointer down -> click)', async () => {
    render(<FeedbackRequests />);

    const card = await screen.findByTestId('feedback-request-42');

    // Simulate pressing down then firing the click which mounts modal while pointer is still down.
    fireEvent.mouseDown(card);
    fireEvent.mouseUp(card);
    fireEvent.click(card);

    // Modal should be open (dialog role) — wait for the dialog to appear
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeTruthy();

    // Now simulate clicking backdrop immediately after (should be swallowed)
    const dialogEl = screen.getByRole('dialog');
    fireEvent.click(dialogEl);
    expect(screen.queryByRole('dialog')).toBeTruthy();

    // Wait past suppression and clicking again should close
    await new Promise((r) => setTimeout(r, 350));
    fireEvent.click(dialogEl);
    expect(screen.queryByRole('dialog')).toBeFalsy();
  });
});
