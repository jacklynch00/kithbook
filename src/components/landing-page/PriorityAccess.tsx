'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Zap } from 'lucide-react';

export default function PriorityAccess() {
	return (
		<div className='bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100 shadow-sm'>
			<div className='flex flex-col items-center text-center gap-4'>
				<div className='flex items-center gap-2 bg-orange-100 px-3 py-1.5 rounded-full'>
					<Zap className='h-4 w-4 text-orange-600' />
					<span className='text-sm font-medium text-orange-800'>Priority Access</span>
				</div>

				<h3 className='text-xl font-bold'>Become an Early Believer</h3>

				<p className='text-gray-600'>
					Don&apos;t miss this <span className='font-bold'>exclusive opportunity</span> to be among the first to experience Kithbook! For just $3, you&apos;ll secure your
					spot as an <span className='font-bold'>EARLY BELIEVER</span> with guaranteed priority access. While others wait, you&apos;ll be building your network with
					powerful AI-driven insights. Your early support directly shapes our future — invest in your network today and watch your relationships transform tomorrow. This
					limited offer won&apos;t last!
				</p>

				<Button
					className='bg-orange-600 hover:bg-orange-700 text-white w-full md:w-auto'
					onClick={() => window.open('https://buy.stripe.com/bJe7sM4lO3EBfpNae808g03', '_blank')}>
					Get Priority Access ($3)
					<ArrowRight className='ml-2 h-4 w-4' />
				</Button>
			</div>
		</div>
	);
}
