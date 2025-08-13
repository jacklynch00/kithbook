import { useQuery } from '@tanstack/react-query';

interface SyncStatus {
  canSync: boolean;
  minutesUntilNext: number | null;
  lastSyncAt: Date | null;
}

async function fetchSyncStatus(): Promise<SyncStatus> {
  const response = await fetch('/api/sync/status');
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    canSync: data.canSync,
    minutesUntilNext: data.minutesUntilNext,
    lastSyncAt: data.lastSyncAt ? new Date(data.lastSyncAt) : null,
  };
}

export function useSyncStatus() {
  return useQuery<SyncStatus>({
    queryKey: ['syncStatus'],
    queryFn: fetchSyncStatus,
    refetchInterval: (query) => {
      // Refetch every minute if user can't sync yet
      const data = query.state.data as SyncStatus | undefined;
      return data?.canSync === false ? 60 * 1000 : false;
    },
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
  });
}