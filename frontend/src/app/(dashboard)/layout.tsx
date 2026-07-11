export const dynamic = 'force-dynamic';

import ClientLayout from './layout-client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
