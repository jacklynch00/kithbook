'use client';

import { useSession } from '@/lib/auth-client';
import { redirect } from 'next/navigation';
import { AppNavigation } from '@/components/app-navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <main className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return redirect('/');
  }

  return (
    <main className='min-h-screen bg-background'>
      <AppNavigation />
      {children}
    </main>
  );
}