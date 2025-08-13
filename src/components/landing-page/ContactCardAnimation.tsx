'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ContactCard {
	id: number;
	name: string;
	role: string;
	company: string;
	avatar: string;
	color: string;
	initials: string;
	x: number;
	y: number;
	z: number;
	rotation: number;
	targetX: number;
	targetY: number;
	targetRotation: number;
	scale: number;
	opacity: number;
	interactions: Interaction[];
}

interface Interaction {
	type: 'email' | 'meeting';
	date: string;
	title: string;
}

export default function ContactCardAnimation() {
	const containerRef = useRef<HTMLDivElement>(null);
	const carouselRef = useRef<HTMLDivElement>(null);
	const [cards, setCards] = useState<ContactCard[]>([]);
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
	const animationRef = useRef<number>(0);
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
	const [isMouseInContainer, setIsMouseInContainer] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const [activeCardIndex, setActiveCardIndex] = useState(0);

	// Sample data for the cards
	const sampleCards: Omit<ContactCard, 'x' | 'y' | 'z' | 'rotation' | 'targetX' | 'targetY' | 'targetRotation' | 'scale' | 'opacity'>[] = [
		{
			id: 1,
			name: 'Andrew Chen',
			role: 'General Partner',
			company: 'at a16z',
			avatar: '',
			color: '#6366f1', // Indigo
			initials: 'AC',
			interactions: [
				{ type: 'meeting', date: 'May 15', title: 'Series A discussion' },
				{ type: 'email', date: 'May 16', title: 'Term sheet review' },
			],
		},
		{
			id: 2,
			name: 'Garry Tan',
			role: 'Managing Director',
			company: 'at Y Combinator',
			avatar: '',
			color: '#f59e0b', // Amber
			initials: 'GT',
			interactions: [
				{ type: 'meeting', date: 'June 2', title: 'YC application review' },
				{ type: 'meeting', date: 'June 5', title: 'Startup advice session' },
			],
		},
		{
			id: 3,
			name: 'Ivan Zhao',
			role: 'Co-founder & CEO',
			company: 'at Notion',
			avatar: '',
			color: '#10b981', // Emerald
			initials: 'IZ',
			interactions: [
				{ type: 'email', date: 'May 15', title: 'Partnership opportunity' },
				{ type: 'email', date: 'May 20', title: 'Integration possibilities' },
			],
		},
		{
			id: 4,
			name: 'Whitney Wolfe Herd',
			role: 'Founder & CEO',
			company: 'at Bumble',
			avatar: '',
			color: '#ec4899', // Pink
			initials: 'WW',
			interactions: [
				{ type: 'meeting', date: 'May 12', title: 'Social platform discussion' },
				{ type: 'email', date: 'May 14', title: 'Community building strategies' },
			],
		},
		{
			id: 5,
			name: 'Melanie Perkins',
			role: 'Co-founder & CEO',
			company: 'at Canva',
			avatar: '',
			color: '#8b5cf6', // Violet
			initials: 'MP',
			interactions: [
				{ type: 'email', date: 'May 10', title: 'Design collaboration' },
				{ type: 'meeting', date: 'May 18', title: 'Product roadmap sharing' },
			],
		},
		{
			id: 6,
			name: 'Dylan Field',
			role: 'Co-founder & CEO',
			company: 'at Figma',
			avatar: '',
			color: '#3b82f6', // Blue
			initials: 'DF',
			interactions: [
				{ type: 'meeting', date: 'May 22', title: 'Design system review' },
				{ type: 'email', date: 'May 24', title: 'Plugin development' },
			],
		},
	];

	// Check if we're on mobile
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	}, []);

	// Initialize cards with better positioned starting points
	useEffect(() => {
		if (!containerRef.current) return;

		const rect = containerRef.current.getBoundingClientRect();
		setDimensions({ width: rect.width, height: rect.height });

		// Create a grid-like distribution for initial positions
		const initialCards = sampleCards.map((card, index) => {
			// Calculate grid position
			const cols = 3;
			const col = index % cols;
			const row = Math.floor(index / cols);

			// Add some randomness to grid positions
			const xOffset = (Math.random() - 0.5) * 100;
			const yOffset = (Math.random() - 0.5) * 60;

			const x = (rect.width / (cols + 1)) * (col + 1) + xOffset;
			const y = (rect.height / 4) * ((row % 3) + 1) + yOffset;
			const z = Math.floor(Math.random() * 5);
			const rotation = (Math.random() - 0.5) * 10;

			return {
				...card,
				x,
				y,
				z,
				rotation,
				targetX: x,
				targetY: y,
				targetRotation: rotation,
				scale: 1,
				opacity: 1,
			};
		});

		setCards(initialCards);

		// Handle window resize
		const handleResize = () => {
			if (!containerRef.current) return;
			const rect = containerRef.current.getBoundingClientRect();
			setDimensions({ width: rect.width, height: rect.height });
		};

		window.addEventListener('resize', handleResize);

		const handleMouseMove = (e: MouseEvent) => {
			if (!containerRef.current) return;
			const rect = containerRef.current.getBoundingClientRect();
			setMousePosition({
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			});
		};

		const handleMouseEnter = () => {
			setIsMouseInContainer(true);
		};

		const handleMouseLeave = () => {
			setIsMouseInContainer(false);
		};

		containerRef.current.addEventListener('mousemove', handleMouseMove);
		containerRef.current.addEventListener('mouseenter', handleMouseEnter);
		containerRef.current.addEventListener('mouseleave', handleMouseLeave);

		return () => {
			window.removeEventListener('resize', handleResize);
			if (containerRef.current) {
				containerRef.current.removeEventListener('mousemove', handleMouseMove);
				containerRef.current.removeEventListener('mouseenter', handleMouseEnter);
				containerRef.current.removeEventListener('mouseleave', handleMouseLeave);
			}
		};
	}, []);

	// Animation loop for desktop
	useEffect(() => {
		if (cards.length === 0 || isMobile) return;

		// Define initial positions in a grid to prevent overlapping
		const updateInitialPositions = () => {
			setCards((prevCards) => {
				const cols = Math.ceil(Math.sqrt(prevCards.length));
				const cellWidth = dimensions.width / cols;
				const cellHeight = dimensions.height / Math.ceil(prevCards.length / cols);

				return prevCards.map((card, index) => {
					const col = index % cols;
					const row = Math.floor(index / cols);

					// Center of the cell with slight randomness
					const centerX = cellWidth * (col + 0.5) + (Math.random() - 0.5) * 40;
					const centerY = cellHeight * (row + 0.5) + (Math.random() - 0.5) * 40;

					return {
						...card,
						// Set both current and target to the same initial position
						x: centerX,
						y: centerY,
						targetX: centerX,
						targetY: centerY,
						// Slight random rotation
						rotation: (Math.random() - 0.5) * 6,
						targetRotation: (Math.random() - 0.5) * 6,
					};
				});
			});
		};

		// Call once to set initial positions
		if (cards.some((card) => card.x === 0 && card.y === 0)) {
			updateInitialPositions();
		}

		const animate = () => {
			setCards((prevCards) => {
				return prevCards.map((card, index) => {
					// Calculate distance from mouse
					const dx = mousePosition.x - card.x;
					const dy = mousePosition.y - card.y;
					const distance = Math.sqrt(dx * dx + dy * dy);

					// Calculate new target position
					let newTargetX = card.targetX;
					let newTargetY = card.targetY;

					if (isMouseInContainer) {
						// Repel cards from mouse with inverse square falloff
						const repelStrength = 10000 / (distance + 100);
						const maxRepel = 150;
						const repelX = Math.min(maxRepel, (repelStrength * dx) / distance) || 0;
						const repelY = Math.min(maxRepel, (repelStrength * dy) / distance) || 0;

						// Calculate new target position with repulsion
						newTargetX = card.x - repelX * 0.2;
						newTargetY = card.y - repelY * 0.2;

						// Keep cards within bounds with padding
						const padding = 100;
						newTargetX = Math.max(padding, Math.min(dimensions.width - padding, newTargetX));
						newTargetY = Math.max(padding, Math.min(dimensions.height - padding, newTargetY));
					} else {
						// When mouse is not in container, slowly return to original position
						const originalX = (dimensions.width * ((index % 3) + 1)) / 4;
						const originalY = (dimensions.height * (Math.floor(index / 3) + 1)) / 4;

						newTargetX = card.targetX + (originalX - card.targetX) * 0.01;
						newTargetY = card.targetY + (originalY - card.targetY) * 0.01;
					}

					// Add subtle floating animation
					const time = Date.now() / 1000;
					const floatX = Math.sin(time * 0.5 + index) * 5;
					const floatY = Math.cos(time * 0.3 + index * 2) * 5;

					// Move towards target with easing
					const easing = 0.08;
					const newX = card.x + (newTargetX - card.x + floatX) * easing;
					const newY = card.y + (newTargetY - card.y + floatY) * easing;

					// Add slight rotation based on movement
					const movementRotation = (newX - card.x) * 0.05;
					const newRotation = card.rotation + (movementRotation - card.rotation) * 0.1;

					return {
						...card,
						x: newX,
						y: newY,
						targetX: newTargetX,
						targetY: newTargetY,
						rotation: newRotation,
					};
				});
			});

			animationRef.current = requestAnimationFrame(animate);
		};

		animationRef.current = requestAnimationFrame(animate);
		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [cards.length, dimensions, mousePosition, isMouseInContainer, isMobile]);

	// Carousel navigation functions
	const handleNextCard = () => {
		setActiveCardIndex((prev) => (prev === cards.length - 1 ? 0 : prev + 1));
	};

	const handlePrevCard = () => {
		setActiveCardIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1));
	};

	// Scroll carousel to active card
	useEffect(() => {
		if (isMobile && carouselRef.current) {
			const scrollAmount = activeCardIndex * carouselRef.current.offsetWidth;
			carouselRef.current.scrollTo({
				left: scrollAmount,
				behavior: 'smooth',
			});
		}
	}, [activeCardIndex, isMobile]);

	// Duplicate functions removed
	// const nextCard = () => {
	//   setActiveCardIndex((prev) => (prev === cards.length - 1 ? 0 : prev + 1))
	// }

	// const prevCard = () => {
	//   setActiveCardIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1))
	// }

	// Handle touch events for carousel
	useEffect(() => {
		if (!carouselRef.current || !isMobile) return;

		let startX: number;
		let currentX: number;

		const handleTouchStart = (e: TouchEvent) => {
			startX = e.touches[0].clientX;
		};

		const handleTouchMove = (e: TouchEvent) => {
			currentX = e.touches[0].clientX;
		};

		const handleTouchEnd = () => {
			if (startX - currentX > 50) {
				// Swipe left
				handleNextCard();
			} else if (currentX - startX > 50) {
				// Swipe right
				handlePrevCard();
			}
		};

		carouselRef.current.addEventListener('touchstart', handleTouchStart);
		carouselRef.current.addEventListener('touchmove', handleTouchMove);
		carouselRef.current.addEventListener('touchend', handleTouchEnd);

		return () => {
			if (carouselRef.current) {
				carouselRef.current.removeEventListener('touchstart', handleTouchStart);
				carouselRef.current.removeEventListener('touchmove', handleTouchMove);
				carouselRef.current.removeEventListener('touchend', handleTouchEnd);
			}
		};
	}, [isMobile, cards]);

	return (
		<div ref={containerRef} className='w-full h-[500px] md:h-[700px] relative overflow-hidden flex flex-col'>
			{/* Desktop floating cards */}
			{!isMobile &&
				cards.map((card) => (
					<div
						key={card.id}
						className='absolute bg-white rounded-lg shadow-lg p-4 w-72 border border-gray-200'
						style={{
							transform: `translate(${card.x - 144}px, ${card.y - 100}px) rotate(${card.rotation}deg)`,
							zIndex: card.z,
							transition: 'box-shadow 0.3s ease',
							boxShadow: isMouseInContainer
								? '0 10px 25px rgba(0, 0, 0, 0.08), 0 5px 10px rgba(0, 0, 0, 0.05)'
								: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
						}}>
						<div className='flex items-start gap-3'>
							<div className='w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold' style={{ backgroundColor: card.color }}>
								{card.initials}
							</div>
							<div>
								<h3 className='font-bold text-base'>{card.name}</h3>
								<p className='text-xs text-gray-500'>
									{card.role} {card.company}
								</p>
							</div>
						</div>

						<div className='mt-3 space-y-2'>
							{card.interactions.map((interaction, idx) => (
								<div key={idx} className='flex items-start gap-2'>
									<div className='mt-1'>
										{interaction.type === 'email' ? (
											<svg
												xmlns='http://www.w3.org/2000/svg'
												width='14'
												height='14'
												viewBox='0 0 24 24'
												fill='none'
												stroke='currentColor'
												strokeWidth='2'
												strokeLinecap='round'
												strokeLinejoin='round'
												className='text-gray-400'>
												<rect width='20' height='16' x='2' y='4' rx='2' />
												<path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' />
											</svg>
										) : (
											<svg
												xmlns='http://www.w3.org/2000/svg'
												width='14'
												height='14'
												viewBox='0 0 24 24'
												fill='none'
												stroke='currentColor'
												strokeWidth='2'
												strokeLinecap='round'
												strokeLinejoin='round'
												className='text-gray-400'>
												<rect width='18' height='18' x='3' y='4' rx='2' ry='2' />
												<line x1='16' x2='16' y1='2' y2='6' />
												<line x1='8' x2='8' y1='2' y2='6' />
												<line x1='3' x2='21' y1='10' y2='10' />
											</svg>
										)}
									</div>
									<div className='text-xs'>
										<div className='flex items-center gap-1'>
											<span className='text-gray-400'>{interaction.date}</span>
										</div>
										<p className='font-medium'>{interaction.title}</p>
									</div>
								</div>
							))}
						</div>

						<div className='mt-3 pt-3 border-t border-gray-100'>
							<div className='text-xs text-gray-500'>
								<span className='font-medium'>AI Context:</span>
								<p className='mt-1'>
									{card.id === 1
										? "Andrew discussed your product's network effects potential and suggested refining your metrics to better position for a16z investment in your next round."
										: card.id === 2
										? 'Garry was interested in your go-to-market strategy and mentioned potential YC connections that could help with your next funding round.'
										: card.id === 3
										? "Ivan shared Notion's early challenges with product-market fit and offered to connect you with their API team to explore integration opportunities."
										: card.id === 4
										? "Whitney was impressed by your user acquisition approach and suggested exploring partnership opportunities with Bumble's platform."
										: card.id === 5
										? "Melanie discussed Canva's global expansion strategy and recommended focusing on building a strong design-first culture as you scale your team."
										: "Dylan shared insights about scaling design teams and offered advice on building a product-led growth strategy similar to Figma's approach."}
								</p>
							</div>
						</div>
					</div>
				))}

			{/* Mobile carousel */}
			{isMobile && (
				<div className='w-full h-full flex flex-col'>
					<div ref={carouselRef} className='flex-1 flex snap-x snap-mandatory overflow-x-hidden'>
						{cards.map((card, index) => (
							<div key={card.id} className='w-full h-full flex-shrink-0 snap-center flex items-center justify-center px-4'>
								<div className='bg-white rounded-lg shadow-lg p-4 w-full max-w-xs border border-gray-200'>
									<div className='flex items-start gap-3'>
										<div
											className='w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold'
											style={{ backgroundColor: card.color }}>
											{card.initials}
										</div>
										<div>
											<h3 className='font-bold text-base'>{card.name}</h3>
											<p className='text-xs text-gray-500'>
												{card.role} {card.company}
											</p>
										</div>
									</div>

									<div className='mt-3 space-y-2'>
										{card.interactions.map((interaction, idx) => (
											<div key={idx} className='flex items-start gap-2'>
												<div className='mt-1'>
													{interaction.type === 'email' ? (
														<svg
															xmlns='http://www.w3.org/2000/svg'
															width='14'
															height='14'
															viewBox='0 0 24 24'
															fill='none'
															stroke='currentColor'
															strokeWidth='2'
															strokeLinecap='round'
															strokeLinejoin='round'
															className='text-gray-400'>
															<rect width='20' height='16' x='2' y='4' rx='2' />
															<path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' />
														</svg>
													) : (
														<svg
															xmlns='http://www.w3.org/2000/svg'
															width='14'
															height='14'
															viewBox='0 0 24 24'
															fill='none'
															stroke='currentColor'
															strokeWidth='2'
															strokeLinecap='round'
															strokeLinejoin='round'
															className='text-gray-400'>
															<rect width='18' height='18' x='3' y='4' rx='2' ry='2' />
															<line x1='16' x2='16' y1='2' y2='6' />
															<line x1='8' x2='8' y1='2' y2='6' />
															<line x1='3' x2='21' y1='10' y2='10' />
														</svg>
													)}
												</div>
												<div className='text-xs'>
													<div className='flex items-center gap-1'>
														<span className='text-gray-400'>{interaction.date}</span>
													</div>
													<p className='font-medium'>{interaction.title}</p>
												</div>
											</div>
										))}
									</div>

									<div className='mt-3 pt-3 border-t border-gray-100'>
										<div className='text-xs text-gray-500'>
											<span className='font-medium'>AI Context:</span>
											<p className='mt-1'>
												{card.id === 1
													? "Andrew discussed your product's network effects potential and suggested refining your metrics to better position for a16z investment in your next round."
													: card.id === 2
													? 'Garry was interested in your go-to-market strategy and mentioned potential YC connections that could help with your next funding round.'
													: card.id === 3
													? "Ivan shared Notion's early challenges with product-market fit and offered to connect you with their API team to explore integration opportunities."
													: card.id === 4
													? "Whitney was impressed by your user acquisition approach and suggested exploring partnership opportunities with Bumble's platform."
													: card.id === 5
													? "Melanie discussed Canva's global expansion strategy and recommended focusing on building a strong design-first culture as you scale your team."
													: "Dylan shared insights about scaling design teams and offered advice on building a product-led growth strategy similar to Figma's approach."}
											</p>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>

					{/* Updated carousel controls positioning */}
					<div className='flex justify-center items-center gap-4 py-4 bg-white/50 backdrop-blur-sm'>
						<button onClick={handlePrevCard} className='p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-gray-200' aria-label='Previous card'>
							<ChevronLeft size={20} />
						</button>

						<div className='flex gap-1'>
							{cards.map((_, index) => (
								<div key={index} className={`w-2 h-2 rounded-full ${index === activeCardIndex ? 'bg-black' : 'bg-gray-300'}`} />
							))}
						</div>

						<button onClick={handleNextCard} className='p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-gray-200' aria-label='Next card'>
							<ChevronRight size={20} />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
