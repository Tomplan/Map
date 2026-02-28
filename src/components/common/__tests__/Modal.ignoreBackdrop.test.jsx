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
    
    // Set initial time
    nowVal = base;

    // First render: Component should capture `base` (via testMountedAt or nowStub)
    const { getByRole } = render(
      <Modal isOpen={true} onClose={onClose} title="Test" testMountedAt={base} testNow={base}>
        <div>content</div>
      </Modal>,
    );

    // Click immediately, time is still `base` or `base+50`
    // We update `nowVal` just in case logic uses global.performance
    nowVal = base + 50;
    
    // Simulate re-render or prop update if needed? 
    // No, handleBackdropClick reads values at click time.
    // However, if we passed `testNow` as prop, component uses that prop value. 
    // And that prop value IS STILL `base` because we didn't re-render with new prop.
    
    // Wait, if we passed `testNow={base}`, then `currentTime` inside handler is `base`.
    // `mountAt` is `base`.
    // `timeSinceMount` is 0.
    // 0 < 150 is true.
    // So it should ignore.
    
    fireEvent.click(getByRole('dialog'));

    expect(onClose).not.toHaveBeenCalled();
  });

  test('allows backdrop clicks after the 150ms guard window', async () => {
    const onClose = jest.fn();
    const base = 2000;
    
    // Render with initial time
    const { getByRole, rerender } = render(
      <Modal isOpen={true} onClose={onClose} title="Test" testMountedAt={base} testNow={base}>
        <div>content</div>
      </Modal>,
    );

    // Update time: Advance by 200ms
    // We MUST re-render to pass the new `testNow` value to the component props
    rerender(
      <Modal isOpen={true} onClose={onClose} title="Test" testMountedAt={base} testNow={base + 200}>
        <div>content</div>
      </Modal>,
    );
    
    const backdrop = getByRole('dialog');
    fireEvent.click(backdrop);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
