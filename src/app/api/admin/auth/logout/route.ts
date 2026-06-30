import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/admin/auth';
import { logActivity, getRequestMeta } from '@/lib/admin/audit';

export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (user) {
    const meta = getRequestMeta(request);
    await logActivity({
      userId: user.id,
      userEmail: user.email,
      action: 'admin_logout',
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
