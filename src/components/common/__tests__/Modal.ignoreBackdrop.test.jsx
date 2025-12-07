import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Modal from '../Modal';

describe('Modal backdrop click protection', () => {
  it('ignores backdrop clicks within 150ms after mount but honors later clicks', async () => {
    const onClose = jest.fn();

    const { getByRole } = render(
      <Modal isOpen={true} title="Test" onClose={onClose}>
        <div>Content</div>
      </Modal>,
    );

    const dialog = getByRole('dialog');

    // immediate click should be swallowed
    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();

    // wait beyond the ignore window
    await new Promise((r) => setTimeout(r, 200));

    // clicking after the window should call onClose
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
