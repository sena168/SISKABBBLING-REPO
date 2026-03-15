import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getAuthUser } from '@/lib/auth';
import SignOutButton from '@/app/dashboard/SignOutButton';
import HealthStatus from '@/components/HealthStatus';

export default async function ViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('__session')?.value;

  if (!sessionToken) {
    redirect('/login');
  }

  const user = await getAuthUser(`Bearer ${sessionToken}`);

  if (!user) {
    redirect('/login');
  }

  // Redirect non-stakeholders to dashboard
  if (user.role !== 'stakeholder') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow">
            S
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg">SPM-01</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Official Patrol Record</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <HealthStatus />
          </div>
          <div className="text-sm font-medium text-gray-700 hidden sm:block">
             {user.displayName || user.email.split('@')[0]}
          </div>
          <SignOutButton className="bg-white text-gray-800 border border-gray-300 hover:bg-gray-100" />
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 p-8 text-center mt-auto">
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Records are automatically captured and stored. Contact your administrator for full access.
        </p>
      </footer>
    </div>
  );
}
