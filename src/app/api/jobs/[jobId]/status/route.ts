import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { runs } from '@trigger.dev/sdk/v3';

export async function GET(request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const resolvedParams = await params;
		const jobId = resolvedParams.jobId;

		if (!jobId) {
			return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
		}

		// Get job status from Trigger.dev
		const run = await runs.retrieve(jobId);

		return NextResponse.json({
			success: true,
			job: {
				id: run.id,
				status: run.status,
				isCompleted: run.isCompleted,
				isFailed: run.isFailed,
				startedAt: run.startedAt,
				createdAt: run.createdAt,
			},
		});
	} catch (error) {
		console.error('Job status check error:', error);
		return NextResponse.json(
			{
				success: false,
				error: 'Failed to get job status',
			},
			{ status: 500 }
		);
	}
}
