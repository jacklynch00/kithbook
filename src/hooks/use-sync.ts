import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsKeys } from './use-contacts';
import { SyncResult, SyncResultSchema } from '@/lib/types';
import { toast } from 'sonner';

async function syncData(): Promise<SyncResult> {
  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const rawResult = await response.json();
  const result = SyncResultSchema.safeParse(rawResult);

  if (!result.success) {
    throw new Error('Invalid API response format');
  }

  if (!result.data.success) {
    throw new Error(result.data.error || 'Sync failed');
  }
  
  return result.data;
}

export function useSync() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: syncData,
    onSuccess: (data) => {
      // Show success toast with job count
      const jobCount = data.results?.triggers?.length || 0;
      if (jobCount > 0) {
        toast.success(`Background sync started`, {
          description: `${jobCount} sync job(s) are running in the background.`
        });
      } else {
        toast.success('Sync completed');
      }
      
      // Invalidate and refetch contacts after successful sync
      queryClient.invalidateQueries({ queryKey: contactsKeys.all });
      // Also invalidate network graph data since it depends on contacts
      queryClient.invalidateQueries({ queryKey: ['networkGraph'] });
    },
    onError: (error) => {
      console.error('Sync failed:', error);
      toast.error('Sync failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    },
  });
}