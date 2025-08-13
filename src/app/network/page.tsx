'use client';

import { NetworkGraph } from '@/components/network-graph';
import { useNetworkGraph } from '@/hooks/use-network-graph';
import { DashboardLayout } from '@/components/dashboard-layout';

export default function NetworkPage() {
	const { data, isLoading, error } = useNetworkGraph();

	if (error) {
		return (
			<DashboardLayout>
				<div className='container mx-auto py-8'>
					<div className='text-center'>
						<h1 className='text-2xl font-bold mb-4'>Contact Network</h1>
						<div className='text-red-600'>Error loading network data: {error.message}</div>
					</div>
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout>
			<div className='flex flex-col' style={{ height: 'calc(100vh - 80px)' }}>
				<div className='border-b bg-background'>
					<div className='container mx-auto py-4'>
						<h2 className='text-2xl font-bold'>Contact Network</h2>
						<p className='text-muted-foreground'>Visualize connections between your contacts based on shared emails and meetings</p>
					</div>
				</div>

				<div className='flex-1'>
					<NetworkGraph data={data} isLoading={isLoading} />
				</div>
			</div>
		</DashboardLayout>
	);
}
