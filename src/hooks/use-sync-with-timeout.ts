import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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

export function useSyncWithTimeout() {
  const queryClient = useQueryClient();
  const [isWaitingForCompletion, setIsWaitingForCompletion] = useState(false);

  const mutation = useMutation({
    mutationFn: syncData,
    onSuccess: (data) => {
      // Extract job count from the sync response
      const jobCount = data.results?.triggers?.length || 0;
      
      if (jobCount > 0) {
        toast.success(`Background sync started`, {
          description: `${jobCount} sync job(s) are running in the background. Data will refresh automatically in a few minutes.`
        });

        // Set waiting state and start timeout for auto-refresh
        setIsWaitingForCompletion(true);
        
        // Refresh data after a reasonable delay (2-3 minutes for sync jobs to complete)
        setTimeout(() => {
          console.log('Auto-refreshing data after sync timeout');
          queryClient.invalidateQueries({ queryKey: contactsKeys.all });
          queryClient.invalidateQueries({ queryKey: ['networkGraph'] });
          setIsWaitingForCompletion(false);
          
          toast.success('Data refreshed', {
            description: 'Your contacts have been updated with the latest sync results.'
          });
        }, 2.5 * 60 * 1000); // 2.5 minutes
        
      } else {
        toast.success('Sync completed');
      }
      
      // Invalidate sync status to update UI
      queryClient.invalidateQueries({ queryKey: ['syncStatus'] });
    },
    onError: (error) => {
      console.error('Sync failed:', error);
      
      // Clear waiting state on error
      setIsWaitingForCompletion(false);
      
      // Handle rate limiting errors specially
      if (error instanceof Error && error.message.includes('Rate limited')) {
        toast.error('Sync rate limited', {
          description: error.message
        });
      } else {
        toast.error('Sync failed', {
          description: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
      
      // Invalidate sync status to update UI even on error
      queryClient.invalidateQueries({ queryKey: ['syncStatus'] });
    },
  });

  return {
    ...mutation,
    isWaitingForCompletion,
  };
}