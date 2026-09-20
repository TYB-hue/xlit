'use client';

import { FormEvent, useState } from 'react';

export default function ReviewForm({ productSlug }: { productSlug: string }) {
  const [stars, setStars] = useState(5);
  const [status, setStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reviewForm = event.currentTarget;
    setStatus(null);
    setIsSubmitting(true);

    const formData = new FormData(reviewForm);
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: productSlug,
        name: formData.get('name'),
        email: formData.get('email'),
        content: formData.get('content'),
        website: formData.get('website'),
        stars,
      }),
    }).catch(() => null);

    const result = response ? await response.json().catch(() => null) : null;
    setIsSubmitting(false);

    if (!response?.ok) {
      setStatus({ type: 'error', message: result?.error ?? 'Unable to submit your review. Please try again.' });
      return;
    }

    reviewForm.reset();
    setStars(5);
    setStatus({ type: 'success', message: result?.message ?? 'Thanks. Your review is awaiting approval.' });
  }

  return (
    <form onSubmit={submitReview} className="mx-auto mt-10 w-full max-w-2xl rounded-2xl border border-stroke bg-card p-4 sm:mt-12 sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-lime">Share your experience</p>
          <h3 className="font-display mt-3 text-2xl font-light text-ink sm:text-3xl">Write a review</h3>
        </div>
        <div className="flex gap-1" role="group" aria-label="Your rating">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button key={rating} type="button" onClick={() => setStars(rating)} aria-label={`${rating} star${rating === 1 ? '' : 's'}`} aria-pressed={stars === rating} className={`min-h-11 min-w-9 p-1 text-2xl transition-colors ${rating <= stars ? 'text-lime' : 'text-stroke hover:text-inkdim'}`}>★</button>
          ))}
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-ink">Name<input required name="name" minLength={2} maxLength={80} className="mt-2 h-11 w-full rounded-lg border border-stroke bg-[#0F0F0F] px-3 text-ink outline-none transition-colors focus:border-lime" /></label>
        <label className="text-sm text-ink">Email <span className="text-inkdim">(optional, never published)</span><input name="email" type="email" maxLength={255} className="mt-2 h-11 w-full rounded-lg border border-stroke bg-[#0F0F0F] px-3 text-ink outline-none transition-colors focus:border-lime" /></label>
      </div>
      <label className="mt-4 block text-sm text-ink">Your review<textarea required name="content" minLength={10} maxLength={800} rows={5} className="mt-2 w-full resize-y rounded-lg border border-stroke bg-[#0F0F0F] px-3 py-3 text-ink outline-none transition-colors focus:border-lime" /></label>
      <label className="sr-only" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-inkdim">Reviews are published after approval.</p>
        <button disabled={isSubmitting} className="w-full rounded-lg bg-lime px-5 py-3 text-sm font-medium uppercase tracking-wide text-bg transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60 sm:w-auto">{isSubmitting ? 'Submitting…' : 'Submit review'}</button>
      </div>
      {status && <p className={`mt-4 text-sm ${status.type === 'success' ? 'text-lime' : 'text-red-400'}`} role="status">{status.message}</p>}
    </form>
  );
}
