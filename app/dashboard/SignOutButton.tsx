'use client';

import { useRouter } from 'next/navigation';
import { auth, signOutUser } from '@/lib/firebase-client';

export default function SignOutButton({ className = '' }: { className?: string }) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOutUser();
      document.cookie = '__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      router.push('/login');
    } catch (error) {
      console.error('Failed to sign out', error);
      // force navigation anyway
      document.cookie = '__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      router.push('/login');
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className={`text-sm font-medium px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition ${className}`}
    >
      Sign Out
    </button>
  );
}
