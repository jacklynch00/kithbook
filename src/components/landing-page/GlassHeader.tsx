'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import KithbookLogo from '@/components/kithbook-logo';
import { X } from 'lucide-react';

export default function GlassHeader() {
	const [scrolled, setScrolled] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			const isScrolled = window.scrollY > 10;
			if (isScrolled !== scrolled) {
				setScrolled(isScrolled);
			}
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, [scrolled]);

	// Close mobile menu when clicking on a link
	const handleNavLinkClick = () => {
		setMobileMenuOpen(false);
	};

	// Prevent scrolling when mobile menu is open
	useEffect(() => {
		if (mobileMenuOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [mobileMenuOpen]);

	return (
		<>
			<header
				className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
					scrolled ? 'bg-white/10 backdrop-blur-md border-b border-white/10 py-3' : 'bg-transparent py-4 md:py-6'
				}`}>
				<div className='container mx-auto flex items-center justify-between'>
					<KithbookLogo />
					<nav className='hidden md:flex items-center gap-6'>
						<Link href='#how-it-works' className='text-sm font-medium hover:underline'>
							How It Works
						</Link>
						<Link href='#features' className='text-sm font-medium hover:underline'>
							Features
						</Link>
						<Link href='#why-kithbook' className='text-sm font-medium hover:underline'>
							Why Kithbook
						</Link>
					</nav>
					<button className='md:hidden focus:outline-none' onClick={() => setMobileMenuOpen(true)} aria-label='Open menu'>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							width='24'
							height='24'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'>
							<line x1='4' x2='20' y1='12' y2='12' />
							<line x1='4' x2='20' y1='6' y2='6' />
							<line x1='4' x2='20' y1='18' y2='18' />
						</svg>
					</button>
				</div>
			</header>

			{/* Mobile Menu Overlay */}
			{mobileMenuOpen && (
				<div className='fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col md:hidden'>
					<div className='container flex justify-between items-center py-4'>
						<KithbookLogo />
						<button onClick={() => setMobileMenuOpen(false)} className='text-white focus:outline-none' aria-label='Close menu'>
							<X size={24} />
						</button>
					</div>
					<div className='flex-1 flex flex-col items-center justify-center gap-8 text-white'>
						<Link href='#how-it-works' className='text-xl font-medium hover:underline' onClick={handleNavLinkClick}>
							How It Works
						</Link>
						<Link href='#features' className='text-xl font-medium hover:underline' onClick={handleNavLinkClick}>
							Features
						</Link>
						<Link href='#why-kithbook' className='text-xl font-medium hover:underline' onClick={handleNavLinkClick}>
							Why Kithbook
						</Link>
					</div>
				</div>
			)}
		</>
	);
}
