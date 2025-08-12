'use client';

import { Button } from '@/components/ui/button';
import { signIn, signOut, useSession } from '@/lib/auth-client';

export default function Home() {
	const { data: session } = useSession();

	const handleGoogleSignIn = async () => {
		await signIn.social({
			provider: 'google',
			callbackURL: '/dashboard',
		});
	};

	return (
		<main className='min-h-screen flex items-center justify-center bg-background'>
			<div className='text-center space-y-6 max-w-md mx-auto p-8'>
				<div>
					<h1 className='text-4xl font-bold mb-4'>Welcome to KithBook</h1>
					<p className='text-lg text-muted-foreground'>Your personal book companion</p>
				</div>
				{session ? (
					<Button onClick={async () => await signOut()} size='lg' className='w-full'>
						Sign out
					</Button>
				) : (
					<Button onClick={handleGoogleSignIn} size='lg' className='w-full'>
						Sign in with Google
					</Button>
				)}
			</div>
		</main>
	);
}
