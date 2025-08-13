interface KithbookLogoProps {
	size?: number;
	className?: string;
}

export default function KithbookLogo({ size = 32, className = '' }: KithbookLogoProps) {
	return (
		<svg width={size} height={size} viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg' className={className}>
			<rect width='32' height='32' rx='8' fill='url(#gradient)' />
			<path d='M8 12h16v2H8v-2zm0 4h16v2H8v-2zm0 4h12v2H8v-2z' fill='white' opacity='0.9' />
			<circle cx='22' cy='10' r='3' fill='white' opacity='0.8' />
			<defs>
				<linearGradient id='gradient' x1='0' y1='0' x2='32' y2='32' gradientUnits='userSpaceOnUse'>
					<stop stopColor='#3B82F6' />
					<stop offset='1' stopColor='#8B5CF6' />
				</linearGradient>
			</defs>
		</svg>
	);
}

// Named export for compatibility
export { KithbookLogo };
