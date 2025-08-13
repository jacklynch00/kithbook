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
      
      // For sequential sync, poll for longer to catch the Gmail job
      return allJobsFinished ? false : 4000; // Poll every 4 seconds (slightly longer for sequential jobs)
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
      // For sequential sync, we want to check if this is a complete sync cycle
      const allJobsFinished = query.data.jobs.every(job => 
        job.status === 'COMPLETED' || 
        job.status === 'FAILED' || 
        job.status === 'CANCELLED' ||
        job.status === 'UNKNOWN'
      );

      // Only refresh data and show completion when ALL jobs are done
      if (allJobsFinished) {
        // Invalidate contacts and network data to refresh
        queryClient.invalidateQueries({ queryKey: contactsKeys.all });
        queryClient.invalidateQueries({ queryKey: ['networkGraph'] });
        
        // Show success notification
        const successfulJobs = query.data.jobs.filter(job => job.status === 'COMPLETED').length;
        const totalJobs = query.data.jobs.length;
        
        if (successfulJobs === totalJobs) {
          toast.success('Sync completed');
        } else {
          toast.success('Sync partially completed');
        }
      }
    }

    // Handle failed jobs immediately (don't wait for all to complete)
    if (failedJobs.length > 0) {
      toast.error('Sync failed');
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