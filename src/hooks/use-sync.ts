import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { contactsKeys } from './use-contacts';
import { SyncResult, SyncResultSchema } from '@/lib/types';
import { toast } from 'sonner';
import { useJobStatus } from './use-job-status';

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
  const [currentJobIds, setCurrentJobIds] = useState<string[]>([]);

  // Poll job status when we have active jobs
  const { allJobsCompleted, runningJobs } = useJobStatus(currentJobIds, currentJobIds.length > 0);

  const mutation = useMutation({
    mutationFn: syncData,
    onSuccess: (data) => {
      // Extract job IDs from the sync response
      const jobIds = data.results?.triggers?.map(trigger => trigger.jobId) || [];
      setCurrentJobIds(jobIds);

      // Show success toast with job count
      const jobCount = jobIds.length;
      if (jobCount > 0) {
        toast.success('Syncing data');
      } else {
        toast.success('Sync completed');
      }
      
      // Invalidate sync status to update UI
      queryClient.invalidateQueries({ queryKey: ['syncStatus'] });
    },
    onError: (error) => {
      console.error('Sync failed:', error);
      
      // Clear job IDs on error
      setCurrentJobIds([]);
      
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

  // Clear job IDs when all jobs are completed
  if (allJobsCompleted && currentJobIds.length > 0) {
    setCurrentJobIds([]);
  }

  return {
    ...mutation,
    currentJobIds,
    runningJobs,
    isPollingJobs: currentJobIds.length > 0 && !allJobsCompleted,
  };
}