'use client';

import Link from 'next/link';
import ContactCardAnimation from '@/components/landing-page/ContactCardAnimation';
import GlassHeader from '@/components/landing-page/GlassHeader';
// import GoogleForm from '@/components/google-form';
import KithbookLogo from '@/components/kithbook-logo';
import TypewriterText from '@/components/landing-page/TypewriterText';
import PriorityAccess from '@/components/landing-page/PriorityAccess';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { signIn, signOut, useSession } from '@/lib/auth-client';

export default function LandingPage() {
	const { data: session } = useSession();

	const handleGoogleSignIn = async () => {
		await signIn.social({
			provider: 'google',
			callbackURL: '/dashboard',
		});
	};

	return (
		<div className='flex min-h-screen flex-col'>
			<GlassHeader />

			<main className='flex-1'>
				{/* Hero Section */}
				<section className='pt-24 md:pt-32 pb-16 md:pb-24 space-y-6 md:space-y-8'>
					<div className='flex flex-col items-center text-center space-y-4'>
						<h1 className='text-3xl md:text-6xl font-bold leading-tight tracking-tighter md:leading-tight max-w-3xl'>
							A modern rolodex built for busy <TypewriterText words={['founders', 'VCs', 'creators', 'operators', 'people']} />
						</h1>
						<p className='text-lg text-gray-600 max-w-2xl'>
							Kithbook helps you recall every intro, meeting, and email — automatically. No more digging through your inbox or calendar to remember who you met and
							why.
						</p>

						<div className='w-full max-w-2xl space-y-6 pt-4'>
							<PriorityAccess />

							<div className='relative pt-4'>
								<div className='absolute inset-0 flex items-center'>
									<div className='w-full border-t border-gray-200'></div>
								</div>
								<div className='relative flex justify-center'>
									<span className='bg-white px-4 text-sm text-gray-500'>Or join the waitlist</span>
								</div>
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
					</div>

					{/* Contact Card Animation - with responsive height */}
					<div className='h-[500px] md:h-[700px] w-full relative mt-8 md:mt-16 mb-8'>
						<ContactCardAnimation />
					</div>
				</section>

				<div className='section-divider'></div>

				{/* How It Works Section */}
				<section id='how-it-works' className='py-20 relative'>
					<div className='absolute inset-0 bg-gray-50/80 backdrop-blur-sm -z-10'></div>
					<div className='container mx-auto space-y-16'>
						<div className='text-center space-y-4'>
							<h2 className='text-3xl font-bold tracking-tight'>From meetings to memory, without lifting a finger</h2>
							<p className='text-gray-600 max-w-2xl mx-auto'>Kithbook seamlessly integrates with your existing workflow to build your network.</p>
						</div>

						<div className='grid md:grid-cols-3 gap-12'>
							<div className='flex flex-col items-center text-center space-y-4'>
								<div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center'>
									<svg
										xmlns='http://www.w3.org/2000/svg'
										width='28'
										height='28'
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth='2'
										strokeLinecap='round'
										strokeLinejoin='round'
										className='text-black'>
										<path d='M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' />
										<path d='M3 3v5h5' />
										<path d='M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16' />
										<path d='M16 16h5v5' />
									</svg>
								</div>
								<h3 className='text-xl font-bold'>Connect your email + calendar</h3>
								<p className='text-gray-600 max-w-sm'>Securely sync your Gmail and GCal so Kithbook can start mapping your network.</p>
							</div>

							<div className='flex flex-col items-center text-center space-y-4'>
								<div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center'>
									<svg
										xmlns='http://www.w3.org/2000/svg'
										width='28'
										height='28'
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth='2'
										strokeLinecap='round'
										strokeLinejoin='round'
										className='text-black'>
										<path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' />
										<circle cx='9' cy='7' r='4' />
										<path d='M22 21v-2a4 4 0 0 0-3-3.87' />
										<path d='M16 3.13a4 4 0 0 1 0 7.75' />
									</svg>
								</div>
								<h3 className='text-xl font-bold'>AI enriches your network</h3>
								<p className='text-gray-600 max-w-sm'>AI crafts relationship threads between you and each contact, preserving context from every interaction.</p>
							</div>

							<div className='flex flex-col items-center text-center space-y-4'>
								<div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center'>
									<svg
										xmlns='http://www.w3.org/2000/svg'
										width='28'
										height='28'
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth='2'
										strokeLinecap='round'
										strokeLinejoin='round'
										className='text-black'>
										<path d='M18.5 17.5a9 9 0 1 1-1.5-11.5' />
										<path d='M21 22v-9h-9' />
									</svg>
								</div>
								<h3 className='text-xl font-bold'>Bring your network back into your orbit</h3>
								<p className='text-gray-600 max-w-sm'>
									Easily search, filter, and browse your network with all the context you need to pick up where you left off.
								</p>
							</div>
						</div>
					</div>
				</section>

				<div className='section-divider'></div>

				{/* Features Section */}
				<section id='features' className='container mx-auto py-20 space-y-16'>
					<div className='text-center space-y-4'>
						<h2 className='text-3xl font-bold tracking-tight'>Works like a second brain for your relationships</h2>
						<p className='text-gray-600 max-w-2xl mx-auto'>
							Kithbook turns forgotten connections into long-term relationships by remembering the details you don&apos;t have time to track.
						</p>
					</div>

					<div className='grid md:grid-cols-3 gap-12'>
						<div className='flex flex-col items-center text-center space-y-4'>
							<div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									width='28'
									height='28'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'
									className='text-black'>
									<rect width='18' height='18' x='3' y='4' rx='2' ry='2' />
									<line x1='16' x2='16' y1='2' y2='6' />
									<line x1='8' x2='8' y1='2' y2='6' />
									<line x1='3' x2='21' y1='10' y2='10' />
								</svg>
							</div>
							<h3 className='text-xl font-bold'>Meeting memory</h3>
							<p className='text-gray-600 max-w-sm'>Automatically captures who you meet with from your Google Calendar and creates contact cards.</p>
						</div>

						<div className='flex flex-col items-center text-center space-y-4'>
							<div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									width='28'
									height='28'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'
									className='text-black'>
									<rect width='20' height='16' x='2' y='4' rx='2' />
									<path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' />
								</svg>
							</div>
							<h3 className='text-xl font-bold'>Email context</h3>
							<p className='text-gray-600 max-w-sm'>Syncs with Gmail to extract relevant context from your conversations with each contact.</p>
						</div>

						<div className='flex flex-col items-center text-center space-y-4'>
							<div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									width='28'
									height='28'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'
									className='text-black'>
									<path d='M2 12c0 5.523 4.477 10 10 10s10-4.477 10-10S17.523 2 12 2 2 6.477 2 12z' />
									<path d='M12 2a5 5 0 0 0-5 5v5h5' />
									<path d='M12 2a5 5 0 0 1 5 5v5h-5' />
									<path d='M12 22v-6.5' />
								</svg>
							</div>
							<h3 className='text-xl font-bold'>Live profiles</h3>
							<p className='text-gray-600 max-w-sm'>AI periodically enriches and updates contact information, keeping your rolodex current.</p>
						</div>
					</div>
				</section>

				<div className='section-divider'></div>

				{/* Why Kithbook Section */}
				<section id='why-kithbook' className='py-20 relative'>
					<div className='absolute inset-0 bg-gray-50/80 backdrop-blur-sm -z-10'></div>
					<div className='container mx-auto space-y-16'>
						<div className='text-center space-y-4'>
							<h2 className='text-3xl font-bold tracking-tight'>Most people forget to follow up. Thanks to Kithbook, you won’t.</h2>
							<p className='text-gray-600 max-w-2xl mx-auto'>
								70% of people never follow up after a conversation — not because they don’t want to, but because they forget. Kithbook makes sure you never miss
								that moment again. It remembers who you met, when, and why — automatically — so you can build real relationships, not just contact lists.
							</p>
						</div>

						<div className='space-y-6 max-w-3xl mx-auto bg-white/70 backdrop-blur-sm rounded-xl p-8 shadow-sm border border-white/20'>
							<h3 className='text-2xl font-bold'>Stop Losing Valuable Connections</h3>
							<p className='text-gray-600'>
								The average professional meets hundreds of people each year, but most of these connections fade away due to lack of context and follow-up.
							</p>
							<ul className='space-y-2'>
								<li className='flex items-start gap-2'>
									<div className='rounded-full bg-gray-100 p-1 mt-1'>
										<svg className='h-3 w-3 text-black' fill='currentColor' viewBox='0 0 20 20'>
											<path
												fillRule='evenodd'
												d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
												clipRule='evenodd'
											/>
										</svg>
									</div>
									<span>Never forget who someone is or why you connected</span>
								</li>
								<li className='flex items-start gap-2'>
									<div className='rounded-full bg-gray-100 p-1 mt-1'>
										<svg className='h-3 w-3 text-black' fill='currentColor' viewBox='0 0 20 20'>
											<path
												fillRule='evenodd'
												d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
												clipRule='evenodd'
											/>
										</svg>
									</div>
									<span>Maintain relationships without spreadsheets or manual notes</span>
								</li>
								<li className='flex items-start gap-2'>
									<div className='rounded-full bg-gray-100 p-1 mt-1'>
										<svg className='h-3 w-3 text-black' fill='currentColor' viewBox='0 0 20 20'>
											<path
												fillRule='evenodd'
												d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
												clipRule='evenodd'
											/>
										</svg>
									</div>
									<span>Leverage your network when you need it most</span>
								</li>
							</ul>
						</div>
					</div>
				</section>

				<div className='section-divider'></div>

				{/* CTA Section */}
				<section className='bg-black py-16 relative overflow-hidden'>
					<div className='absolute inset-0 bg-black/80 backdrop-blur-sm -z-10'></div>
					<div className='container mx-auto text-center space-y-6 relative z-10'>
						<h2 className='text-3xl font-bold text-white'>Ready to transform your network?</h2>
						<p className='text-white/80 max-w-2xl mx-auto'>Get priority access or join the waitlist today.</p>
						<div className='max-w-md mx-auto pt-4 space-y-4'>
							<Button
								className='w-full bg-orange-600 hover:bg-orange-700 text-white'
								onClick={() => window.open('https://buy.stripe.com/bJe7sM4lO3EBfpNae808g03', '_blank')}>
								Get Priority Access ($3)
								<ArrowRight className='ml-2 h-4 w-4' />
							</Button>

							<div className='relative'>
								<div className='absolute inset-0 flex items-center'>
									<div className='w-full border-t border-white/10'></div>
								</div>
								<div className='relative flex justify-center'>
									<span className='bg-black px-4 text-sm text-white/60'>Or</span>
								</div>
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
					</div>
				</section>
			</main>

			<footer className='border-t py-12'>
				<div className='container mx-auto flex flex-col md:flex-row justify-between items-center gap-6'>
					<div className='flex items-center gap-2'>
						<KithbookLogo size={20} />
					</div>
					<div className='text-sm text-gray-500'>© {new Date().getFullYear()} Hedgehog Studios. All rights reserved.</div>
					<div className='flex items-center gap-6'>
						<Link href='/privacy' className='text-sm text-gray-500 hover:text-gray-900'>
							Privacy
						</Link>
						<Link href='/terms' className='text-sm text-gray-500 hover:text-gray-900'>
							Terms
						</Link>
						<a href='https://x.com/5harath' target='_blank' rel='noopener noreferrer' className='text-sm text-gray-500 hover:text-gray-900'>
							Reach the founder 💌
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
