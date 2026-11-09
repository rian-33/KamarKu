import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminCookie, isAdminToken } from '@/lib/admin-auth';
import AdminConsole from './admin-console';
import './admin-layout.css';

export const runtime = 'nodejs';

export default async function AdminPage() {
  const session = await cookies();
  if (!isAdminToken(session.get(adminCookie.name)?.value)) redirect('/admin/login');
  return <AdminConsole />;
}
