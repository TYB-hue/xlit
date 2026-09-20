import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const reviewAttempts = new Map<string, number[]>();
const REVIEW_LIMIT = 3;
const REVIEW_WINDOW_MS = 15 * 60 * 1000;

function getClientIp(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const recentAttempts = (reviewAttempts.get(ip) ?? []).filter((time) => now - time < REVIEW_WINDOW_MS);
  recentAttempts.push(now);
  reviewAttempts.set(ip, recentAttempts);
  return recentAttempts.length > REVIEW_LIMIT;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Please wait before submitting another review.' }, { status: 429 });
  }

  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Invalid review submission.' }, { status: 400 });
  }

  const { slug, name, email, content, stars, website } = payload as Record<string, unknown>;

  // Quietly accept bot submissions without writing anything to the database.
  if (typeof website === 'string' && website.length > 0) {
    return NextResponse.json({ message: 'Thanks for your review.' });
  }

  const normalizedSlug = typeof slug === 'string' ? slug.trim() : '';
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const normalizedContent = typeof content === 'string' ? content.trim() : '';
  const normalizedStars = typeof stars === 'number' ? stars : Number(stars);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)
    || normalizedName.length < 2 || normalizedName.length > 80
    || normalizedContent.length < 10 || normalizedContent.length > 800
    || !Number.isInteger(normalizedStars) || normalizedStars < 1 || normalizedStars > 5
    || (normalizedEmail && !/^\S+@\S+\.\S+$/.test(normalizedEmail))) {
    return NextResponse.json({ error: 'Please complete the review fields correctly.' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    return NextResponse.json({ error: 'Reviews are not configured yet.' }, { status: 503 });
  }

  const supabase = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id')
    .eq('slug', normalizedSlug)
    .eq('is_active', true)
    .maybeSingle();

  if (productError || !product) {
    return NextResponse.json({ error: 'This product is not available for review.' }, { status: 404 });
  }

  const { error: insertError } = await supabase.from('product_reviews').insert({
    product_id: product.id,
    reviewer_name: normalizedName,
    reviewer_email: normalizedEmail || null,
    content: normalizedContent,
    stars: normalizedStars,
    status: 'pending',
  });

  if (insertError) {
    console.error('Unable to save product review:', insertError.message);
    return NextResponse.json({ error: 'Unable to submit your review. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Thanks. Your review is awaiting approval.' }, { status: 201 });
}
