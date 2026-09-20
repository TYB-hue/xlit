import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../lib/supabase-admin';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = await requireAdmin(request);
  if (!supabase) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const action = body && typeof body === 'object' ? (body as { action?: unknown }).action : null;
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Choose whether to approve or reject this review.' }, { status: 400 });
  }

  const { data: review, error: reviewError } = await supabase
    .from('product_reviews')
    .select('id, product_id, stars, status')
    .eq('id', params.id)
    .maybeSingle();

  if (reviewError || !review) return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
  if (review.status !== 'pending') return NextResponse.json({ error: 'This review has already been moderated.' }, { status: 409 });

  const { error: updateError } = await supabase
    .from('product_reviews')
    .update({ status: action === 'approve' ? 'approved' : 'rejected', approved_at: action === 'approve' ? new Date().toISOString() : null })
    .eq('id', review.id)
    .eq('status', 'pending');

  if (updateError) return NextResponse.json({ error: 'Unable to update this review.' }, { status: 500 });

  if (action === 'approve') {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('rating, review_count')
      .eq('id', review.product_id)
      .maybeSingle();

    if (productError || !product) return NextResponse.json({ error: 'Review approved, but the product rating could not be updated.' }, { status: 500 });

    const nextCount = product.review_count + 1;
    const nextRating = Math.round(((Number(product.rating) * product.review_count + review.stars) / nextCount) * 10) / 10;
    const { error: ratingError } = await supabase
      .from('products')
      .update({ rating: nextRating, review_count: nextCount })
      .eq('id', review.product_id);

    if (ratingError) return NextResponse.json({ error: 'Review approved, but the product rating could not be updated.' }, { status: 500 });
  }

  return NextResponse.json({ message: action === 'approve' ? 'Review approved and published.' : 'Review rejected.' });
}
