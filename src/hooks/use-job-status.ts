import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { contactsKeys } from './use-contacts';
import { toast } from 'sonner';

interface JobStatus {
  id: string;
  status: string;
  completedAt?: string | null;
  failedAt?: string | null;
  startedAt?: string | null;
  createdAt?: string | null;
  error?: string;
}

interface JobStatusResponse {
  success: boolean;
  jobs: JobStatus[];
}

async function fetchJobStatuses(jobIds: string[]): Promise<JobStatusResponse> {
  const response = await fetch('/api/jobs/status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ jobIds }),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export function useJobStatus(jobIds: string[], enabled: boolean = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['jobStatus', jobIds],
    queryFn: () => fetchJobStatuses(jobIds),
    enabled: enabled && jobIds.length > 0,
    refetchInterval: (data) => {
      // Stop polling if all jobs are completed or failed
      const allJobsFinished = data?.jobs?.every(job => 
        job.status === 'COMPLETED' || 
        job.status === 'FAILED' || 
        job.status === 'CANCELLED' ||
        job.status === 'UNKNOWN'
      );
      
      return allJobsFinished ? false : 3000; // Poll every 3 seconds
    },
    staleTime: 0, // Always consider stale so it refetches
  });

  // Effect to handle completed jobs
  useEffect(() => {
    if (!query.data?.jobs) return;

    const completedJobs = query.data.jobs.filter(job => 
      job.status === 'COMPLETED' && job.completedAt
    );
    
    const failedJobs = query.data.jobs.filter(job => 
      job.status === 'FAILED' && job.failedAt
    );

    // Check if any jobs just completed
    if (completedJobs.length > 0) {
      // Invalidate contacts and network data to refresh
      queryClient.invalidateQueries({ queryKey: contactsKeys.all });
      queryClient.invalidateQueries({ queryKey: ['networkGraph'] });
      
      // Show success notification
      toast.success('Sync completed', {
        description: `${completedJobs.length} sync job(s) finished successfully. Your data has been updated.`
      });
    }

    // Handle failed jobs
    if (failedJobs.length > 0) {
      toast.error('Some sync jobs failed', {
        description: `${failedJobs.length} sync job(s) encountered errors. Please try syncing again.`
      });
    }
  }, [query.data, queryClient]);

  return {
    ...query,
    allJobsCompleted: query.data?.jobs?.every(job => 
      job.status === 'COMPLETED' || 
      job.status === 'FAILED' || 
      job.status === 'CANCELLED' ||
      job.status === 'UNKNOWN'
    ) ?? false,
    completedJobs: query.data?.jobs?.filter(job => job.status === 'COMPLETED') ?? [],
    failedJobs: query.data?.jobs?.filter(job => job.status === 'FAILED') ?? [],
    runningJobs: query.data?.jobs?.filter(job => 
      job.status === 'QUEUED' || 
      job.status === 'EXECUTING' || 
      job.status === 'WAITING_FOR_DEPLOY'
    ) ?? [],
  };
}