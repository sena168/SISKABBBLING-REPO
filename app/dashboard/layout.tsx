import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { getAuthUser } from '@/lib/auth';
import Link from 'next/link';
import UserBadge from '@/components/UserBadge';
import HealthStatus from '@/components/HealthStatus';
import SignOutButton from './SignOutButton';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Get user session from cookie
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('__session')?.value;

  if (!sessionToken) {
    redirect('/login');
  }

  // 2. Fetch user from database using Firebase Admin
  const user = await getAuthUser(`Bearer ${sessionToken}`);

  if (!user) {
    // Session is invalid or user not in DB
    redirect('/login');
  }

  // Stakeholders have their own separate view
  if (user.role === 'stakeholder') {
    redirect('/view');
  }

  const navLinks = [
    { name: 'Patrol Log', href: '/dashboard', roles: ['admin', 'leader', 'member'] },
    { name: 'Users', href: '/dashboard/admin/users', roles: ['admin', 'leader'] },
    { name: 'System', href: '/dashboard/admin/system', roles: ['admin'] },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            S
          </div>
          <span className="font-bold text-gray-900">SPM-01</span>
        </div>
        <SignOutButton />
      </div>

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex-shrink-0 md:h-screen md:sticky md:top-0 hidden md:flex md:flex-col overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
            S
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">SPM-01</h1>
            <p className="text-xs text-gray-500">Security Patrol</p>
          </div>
        </div>
        
        <div className="p-4 flex flex-col gap-2">
          {navLinks
            .filter((link) => link.roles.includes(user.role))
            .map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
              >
                {link.name}
              </Link>
            ))}
        </div>

        <div className="mt-auto p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col gap-3">
             <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800 truncate pr-2">
                  {user.displayName || user.email.split('@')[0]}
                </span>
                <UserBadge role={user.role} />
             </div>
             <HealthStatus />
             <SignOutButton className="w-full mt-2 justify-center bg-white border border-gray-300 text-gray-700 hover:bg-gray-100" />
          </div>
        </div>
      </aside>

      {/* Mobile User Summary (shown below header on mobile) */}
      <div className="md:hidden bg-white p-4 border-b border-gray-200 flex flex-wrap gap-2 items-center justify-between sticky top-[65px] z-20">
         <div className="flex items-center gap-2">
           <span className="text-sm font-semibold text-gray-800 truncate max-w-[120px]">
             {user.displayName || user.email.split('@')[0]}
           </span>
           <UserBadge role={user.role} />
         </div>
         <HealthStatus />
      </div>

      {/* Mobile nav links */}
      <div className="md:hidden bg-gray-50 p-2 flex overflow-x-auto gap-2 border-b border-gray-200 no-scrollbar">
         {navLinks
            .filter((link) => link.roles.includes(user.role))
            .map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="px-4 py-2 rounded-full bg-white border border-gray-300 shadow-sm text-sm font-medium text-gray-700 whitespace-nowrap active:bg-blue-50 active:border-blue-200"
              >
                {link.name}
              </Link>
          ))}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 w-full max-w-5xl mx-auto flex flex-col min-h-0 relative">
        {children}
      </main>
    </div>
  );
}
