import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { tasks } from '@trigger.dev/sdk/v3';

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { jobIds } = await request.json();

		if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
			return NextResponse.json({ error: 'Job IDs array is required' }, { status: 400 });
		}

		console.log('Checking job statuses for:', jobIds);

		// Get status for all jobs
		const jobStatuses = await Promise.allSettled(
			jobIds.map(async (jobId: string) => {
				console.log(`Retrieving status for job: ${jobId}`);

				// Try different methods for retrieving job status
				let run;
				try {
					// Try runs.retrieve first
					const { runs } = await import('@trigger.dev/sdk/v3');
					run = await runs.retrieve(jobId);
				} catch (e1) {
					throw new Error(`Failed to retrieve job ${jobId}: ${e1}`);
				}
				return {
					id: run.id,
					status: run.status,
					isCompleted: run.isCompleted,
					isFailed: run.isFailed,
					startedAt: run.startedAt,
					createdAt: run.createdAt,
				};
			})
		);

		const jobs = jobStatuses.map((result, index) => {
			if (result.status === 'fulfilled') {
				return result.value;
			} else {
				console.error(`Failed to get status for job ${jobIds[index]}:`, result.reason);
				console.error('Error name:', result.reason?.name);
				console.error('Error message:', result.reason?.message);
				console.error('Error stack:', result.reason?.stack);

				return {
					id: jobIds[index],
					status: 'UNKNOWN',
					error: result.reason?.message || result.reason?.toString() || 'Failed to retrieve status',
				};
			}
		});

		return NextResponse.json({
			success: true,
			jobs,
		});
	} catch (error) {
		console.error('Batch job status check error:', error);
		return NextResponse.json(
			{
				success: false,
				error: 'Failed to get job statuses',
			},
			{ status: 500 }
		);
	}
}
