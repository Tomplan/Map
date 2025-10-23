import React, { useState, Suspense, lazy } from 'react';
const FeedbackForm = lazy(() => import('./FeedbackForm'));

export default function FeedbackToggle() {
  const [show, setShow] = useState(false);
  return (
    <div className="my-4">
      <button
        onClick={() => setShow((v) => !v)}
        className="px-4 py-2 bg-yellow-500 text-white rounded shadow"
        aria-label={show ? 'Hide Feedback Form' : 'Show Feedback Form'}
      >
        {show ? 'Hide Feedback Form' : 'Send Feedback'}
      </button>
      {show && (
        <Suspense fallback={<div>Loading feedback form...</div>}>
          <FeedbackForm />
        </Suspense>
      )}
    </div>
  );
}