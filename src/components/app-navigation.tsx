'use client';

import { Button } from '@/components/ui/button';
import { signOut, useSession } from '@/lib/auth-client';
import { Network } from 'lucide-react';
import Link from 'next/link';

export function AppNavigation() {
	const { data: session } = useSession();

	if (!session) return null;

	return (
		<header className='border-b'>
			<div className='container mx-auto px-4 py-4 flex justify-between items-center'>
				<div className='flex items-center gap-8'>
					<h1 className='text-2xl font-bold'>KithBook</h1>
					<nav className='flex items-center gap-4'>
						<Button variant='ghost' asChild>
							<Link href='/dashboard' className='text-sm font-medium hover:text-primary transition-colors'>
								Dashboard
							</Link>
						</Button>
						<Button variant='ghost' asChild>
							<Link href='/network' className='text-sm font-medium hover:text-primary transition-colors flex items-center gap-1'>
								Network
							</Link>
						</Button>
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
	);
}
