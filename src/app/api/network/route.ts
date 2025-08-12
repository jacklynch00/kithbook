import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getNetworkGraphData } from '@/lib/services/network-graph-service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const networkData = await getNetworkGraphData(session.user.id);

    return NextResponse.json({
      success: true,
      data: networkData
    });
  } catch (error) {
    console.error('Error fetching network graph data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch network graph data' }, 
      { status: 500 }
    );
  }
}