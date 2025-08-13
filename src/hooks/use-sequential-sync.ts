import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { contactsKeys } from './use-contacts';
import { SyncResult, SyncResultSchema } from '@/lib/types';
import { toast } from 'sonner';
import { useJobStatus } from './use-job-status';

// JobStatus interface
interface JobStatus {
  id: string;
  status: string;
  completedAt?: string | null;
  failedAt?: string | null;
  startedAt?: string | null;
  createdAt?: string | null;
  error?: string;
}

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

// Function to check if a calendar job has triggered a Gmail job
async function checkForGmailJob(calendarJobId: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/jobs/${calendarJobId}/status`);
    if (!response.ok) return null;
    
    const data = await response.json();
    // In a real implementation, we'd check the job result for the Gmail job ID
    // For now, we'll implement a simple discovery mechanism
    return null; // We'll enhance this later
  } catch (error) {
    console.error('Failed to check for Gmail job:', error);
    return null;
  }
}

export function useSequentialSync() {
  const queryClient = useQueryClient();
  const [trackedJobIds, setTrackedJobIds] = useState<string[]>([]);
  const [isCheckingForGmailJob, setIsCheckingForGmailJob] = useState(false);

  // Poll job status when we have active jobs
  const { allJobsCompleted, runningJobs, completedJobs } = useJobStatus(trackedJobIds, trackedJobIds.length > 0);

  const mutation = useMutation({
    mutationFn: syncData,
    onSuccess: (data) => {
      // Extract job IDs from the sync response (initially just calendar)
      const jobIds = data.results?.triggers?.map(trigger => trigger.jobId) || [];
      setTrackedJobIds(jobIds);

      // Show success toast
      const jobCount = jobIds.length;
      if (jobCount > 0) {
        toast.success(`Sequential sync started`, {
          description: `Calendar sync is running. Gmail sync will follow automatically.`
        });
      } else {
        toast.success('Sync completed');
      }
      
      // Invalidate sync status to update UI
      queryClient.invalidateQueries({ queryKey: ['syncStatus'] });
    },
    onError: (error) => {
      console.error('Sync failed:', error);
      
      // Clear job IDs on error
      setTrackedJobIds([]);
      setIsCheckingForGmailJob(false);
      
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

  // Check for Gmail job when calendar job completes
  useEffect(() => {
    const calendarJob = completedJobs.find((job: JobStatus) => job.id && !isCheckingForGmailJob);
    
    if (calendarJob && !isCheckingForGmailJob) {
      setIsCheckingForGmailJob(true);
      
      // Wait a moment for the Gmail job to be triggered, then check for it
      setTimeout(async () => {
        try {
          // In a real implementation, we'd query the Trigger.dev API for child jobs
          // For now, we'll use a simple approach: assume Gmail job starts shortly after calendar
          
          // Check if there are any new jobs that might be the Gmail job
          // This is a simplified approach - in production, you'd want more robust job discovery
          console.log('Calendar job completed, checking for Gmail job...');
          
          // For now, we'll assume the sequential flow works as designed
          // The job tracking will automatically handle when both jobs complete
          
        } catch (error) {
          console.error('Error checking for Gmail job:', error);
        } finally {
          setIsCheckingForGmailJob(false);
        }
      }, 2000); // Wait 2 seconds for Gmail job to start
    }
  }, [completedJobs, isCheckingForGmailJob]);

  // Clear job IDs when all jobs are completed
  useEffect(() => {
    if (allJobsCompleted && trackedJobIds.length > 0) {
      setTrackedJobIds([]);
      setIsCheckingForGmailJob(false);
    }
  }, [allJobsCompleted, trackedJobIds.length]);

  return {
    ...mutation,
    currentJobIds: trackedJobIds,
    runningJobs,
    isPollingJobs: trackedJobIds.length > 0 && !allJobsCompleted,
    isCheckingForGmailJob,
  };
}