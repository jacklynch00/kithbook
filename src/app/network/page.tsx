'use client';

import { NetworkGraph } from '@/components/network-graph';
import { useNetworkGraph } from '@/hooks/use-network-graph';
import { Button } from '@/components/ui/button';
import { signOut, useSession } from '@/lib/auth-client';
import { redirect } from 'next/navigation';
import { Network } from 'lucide-react';
import Link from 'next/link';

export default function NetworkPage() {
  const { data: session, isPending } = useSession();
  const { data, isLoading, error } = useNetworkGraph();

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

  if (error) {
    return (
      <main className='min-h-screen bg-background'>
        <header className='border-b'>
          <div className='container mx-auto px-4 py-4 flex justify-between items-center'>
            <div className='flex items-center gap-8'>
              <h1 className='text-2xl font-bold'>KithBook</h1>
              <nav className='flex items-center gap-4'>
                <Link href='/dashboard' className='text-sm font-medium hover:text-primary transition-colors'>
                  Dashboard
                </Link>
                <Link href='/network' className='text-sm font-medium hover:text-primary transition-colors flex items-center gap-1'>
                  <Network className='w-4 h-4' />
                  Network
                </Link>
              </nav>
            </div>
            <div className='flex items-center gap-4'>
              <span className='text-sm text-muted-foreground'>Welcome, {session.user.name || session.user.email}</span>
              <Button onClick={async () => await signOut()} variant='outline'>
                Sign Out
              </Button>
            </div>
          </div>
        </header>
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Contact Network</h1>
            <div className="text-red-600">
              Error loading network data: {error.message}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-background'>
      <header className='border-b'>
        <div className='container mx-auto px-4 py-4 flex justify-between items-center'>
          <div className='flex items-center gap-8'>
            <h1 className='text-2xl font-bold'>KithBook</h1>
            <nav className='flex items-center gap-4'>
              <Link href='/dashboard' className='text-sm font-medium hover:text-primary transition-colors'>
                Dashboard
              </Link>
              <Link href='/network' className='text-sm font-medium hover:text-primary transition-colors flex items-center gap-1'>
                <Network className='w-4 h-4' />
                Network
              </Link>
            </nav>
          </div>
          <div className='flex items-center gap-4'>
            <span className='text-sm text-muted-foreground'>Welcome, {session.user.name || session.user.email}</span>
            <Button onClick={async () => await signOut()} variant='outline'>
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      <div className="flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
        <div className="border-b bg-background">
          <div className="container mx-auto py-4">
            <h2 className="text-2xl font-bold">Contact Network</h2>
            <p className="text-muted-foreground">
              Visualize connections between your contacts based on shared emails and meetings
            </p>
          </div>
        </div>
        
        <div className="flex-1">
          <NetworkGraph data={data} isLoading={isLoading} />
        </div>
      </div>
    </main>
  );
}