'use client';

export type PendingReview = {
  id: string;
  reviewer_name: string;
  reviewer_email: string | null;
  content: string;
  stars: number;
  created_at: string;
  products: { name: string; slug: string } | null;
};

export default function ReviewModeration({
  reviews,
  notice,
  moderatingReviewId,
  onModerate,
}: {
  reviews: PendingReview[];
  notice: string | null;
  moderatingReviewId: string | null;
  onModerate: (review: PendingReview, action: 'approve' | 'reject') => void;
}) {
  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-lime">Review moderation</p>
          <h2 className="mt-2 text-xl font-medium">Pending reviews</h2>
        </div>
        <span className="text-sm text-inkdim">{reviews.length} awaiting approval</span>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-stroke bg-card">
        {reviews.length === 0 ? (
          <p className="p-5 text-sm text-inkdim">No reviews are waiting for approval.</p>
        ) : reviews.map((review) => (
          <article key={review.id} className="border-b border-stroke p-5 last:border-b-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-ink">{review.reviewer_name} <span className="ml-2 tracking-[0.12em] text-lime">{'★'.repeat(review.stars)}</span></p>
                <p className="mt-1 text-xs text-inkdim">For {review.products?.name ?? 'Deleted product'} · {review.products?.slug ?? 'unavailable'} · {new Date(review.created_at).toLocaleDateString()}</p>
                {review.reviewer_email && <p className="mt-1 break-all text-xs text-inkdim">{review.reviewer_email}</p>}
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-inkdim">{review.content}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" disabled={moderatingReviewId === review.id} onClick={() => onModerate(review, 'approve')} className="rounded-lg bg-lime px-3 py-2 text-xs font-medium text-bg disabled:opacity-60">Approve</button>
                <button type="button" disabled={moderatingReviewId === review.id} onClick={() => onModerate(review, 'reject')} className="rounded-lg border border-red-400/50 px-3 py-2 text-xs font-medium text-red-300 disabled:opacity-60">Reject</button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {notice && <p className="mt-3 text-sm text-lime">{notice}</p>}
    </section>
  );
}
