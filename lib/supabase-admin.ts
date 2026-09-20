import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) return null;

  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireAdmin(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const supabase = getSupabaseAdmin();

  if (!token || !adminEmail || !supabase) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || data.user.email?.toLowerCase() !== adminEmail) return null;

  return supabase;
}
