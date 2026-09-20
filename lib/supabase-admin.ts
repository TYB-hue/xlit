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
  const adminEmails = (process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const supabase = getSupabaseAdmin();

  if (!token || !adminEmails.length || !supabase) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user.email || !adminEmails.includes(data.user.email.toLowerCase())) return null;

  return supabase;
}
