// Passthrough layout. Auth lives in (protected)/layout.tsx so /admin/login
// isn't wrapped by requireAdmin (which would cause a redirect loop).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
