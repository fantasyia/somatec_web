import 'server-only';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import type { AdminProfile } from '@/types/database';

export type AdminUser = {
  id: string;
  email: string;
  profile: AdminProfile;
};

/**
 * Returns the current admin user or redirects to /admin/login.
 * Call at the top of every admin Server Component.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const admin = getSupabaseAdminClient();
  const { data: profile } = await admin
    .from('admin_profiles')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    redirect('/admin/login?error=unauthorized');
  }

  return { id: user.id, email: user.email ?? profile.email, profile };
}

/**
 * Returns the current admin user without redirecting (for optional checks).
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const admin = getSupabaseAdminClient();
    const { data: profile } = await admin
      .from('admin_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('active', true)
      .maybeSingle();

    if (!profile) return null;
    return { id: user.id, email: user.email ?? profile.email, profile };
  } catch {
    return null;
  }
}