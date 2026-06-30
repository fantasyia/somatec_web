import { requireAdmin } from '@/lib/admin/auth';
import { AdminShell } from '@/components/admin/AdminShell';

export const dynamic = 'force-dynamic';

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  // requireAdmin redirects to /admin/login if not authenticated or not admin.
  // Kept inside the (protected) route group so /admin/login itself is not gated
  // (otherwise: requireAdmin -> redirect /admin/login -> same layout -> loop).
  const user = await requireAdmin();

  return <AdminShell userEmail={user.email}>{children}</AdminShell>;
}
