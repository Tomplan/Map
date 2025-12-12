import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import Modal from '../Modal';

describe('Modal backdrop click guard', () => {
  let originalPerformance;
  let nowVal = 0;

  beforeEach(() => {
    originalPerformance = global.performance;
    // Provide a deterministic performance.now implementation
    global.performance = { now: () => nowVal };
  });

  afterEach(() => {
    global.performance = originalPerformance;
  });

  test('ignores backdrop clicks that occur within 150ms after open', () => {
    const onClose = jest.fn();
    const base = 1000;
    nowVal = base;

    const { getByRole } = render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <div>content</div>
      </Modal>,
    );

    // Simulate a very-early click (50ms after mount)
    nowVal = base + 50;
    fireEvent.click(getByRole('dialog'));

    expect(onClose).not.toHaveBeenCalled();
  });

  test('allows backdrop clicks after the 150ms guard window', async () => {
    const onClose = jest.fn();
    const base = 2000;
    nowVal = base;

    const { getByRole } = render(
      <Modal isOpen={true} onClose={onClose} title="Test" testMountedAt={base} testNow={base + 200}>
        <div>content</div>
      </Modal>,
    );

    // Simulate a later click (200ms after mount)
    nowVal = base + 200;
    const backdrop = getByRole('dialog');
    fireEvent.click(backdrop);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
