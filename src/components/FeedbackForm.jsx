import React, { useState, useRef } from 'react';

export default function FeedbackForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const messageRef = useRef(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.message.trim()) {
      // Let browser show native validation message
      if (messageRef.current) messageRef.current.focus();
      return;
    }
    setSubmitted(true);
    // Simulate sending or store locally if offline
    if (navigator.onLine) {
      // TODO: Replace with real API call to submit feedback
      // For now, feedback is only stored when offline
    } else {
      const feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
      feedbacks.push({ ...form, date: Date.now() });
      localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
    }
  }

  if (submitted) {
    return (
      <div role="status" aria-live="polite" className="p-4 text-green-700">
        Thank you for your feedback!
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-4 border rounded bg-white shadow"
      aria-label="Feedback form"
      noValidate
    >
      <h2 className="text-lg font-bold mb-2">Send Feedback</h2>
      <label className="block mb-2">
        Name (optional)
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          autoComplete="name"
        />
      </label>
      <label className="block mb-2">
        Email (optional)
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          autoComplete="email"
          type="email"
        />
      </label>
      <label className="block mb-2">
        Message <span className="text-red-600">*</span>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
          rows={4}
          ref={messageRef}
        />
      </label>
      <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
        Submit
      </button>
    </form>
  );
}
