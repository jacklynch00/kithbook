import { useQuery } from '@tanstack/react-query';
import { NetworkGraphData } from '@/lib/services/network-graph-service';

async function fetchNetworkGraphData(): Promise<NetworkGraphData> {
  const response = await fetch('/api/network');
  if (!response.ok) {
    throw new Error('Failed to fetch network graph data');
  }
  const result = await response.json();
  return result.data;
}

export function useNetworkGraph() {
  return useQuery({
    queryKey: ['networkGraph'],
    queryFn: fetchNetworkGraphData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });
}