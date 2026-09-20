import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/supabase-admin';

export async function GET(request: Request) {
  const supabase = await requireAdmin(request);
  if (!supabase) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { data, error } = await supabase
    .from('product_reviews')
    .select('id, reviewer_name, reviewer_email, content, stars, status, created_at, product_id, products(name, slug)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Unable to load pending reviews.' }, { status: 500 });
  return NextResponse.json({ reviews: data ?? [] });
}
