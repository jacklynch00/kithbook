import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface ContactSummary {
  summary: string;
  keyTopics: string[];
  relationshipInsights: string[];
  totalEmails: number;
  dateRange: {
    earliest: Date;
    latest: Date;
  } | null;
}

interface ContactSummaryResponse {
  success: boolean;
  summary?: ContactSummary;
  exists?: boolean;
  error?: string;
  details?: string;
}

async function fetchExistingContactSummary(contactEmail: string): Promise<ContactSummary | null> {
  const response = await fetch(`/api/contacts/${encodeURIComponent(contactEmail)}/summary`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const data: ContactSummaryResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch summary');
  }

  if (!data.summary) {
    return null;
  }

  // Convert date strings back to Date objects
  const summary = {
    ...data.summary,
    dateRange: data.summary.dateRange ? {
      earliest: new Date(data.summary.dateRange.earliest),
      latest: new Date(data.summary.dateRange.latest)
    } : null
  };

  return summary;
}

async function generateContactSummary(contactEmail: string): Promise<ContactSummary> {
  const response = await fetch(`/api/contacts/${encodeURIComponent(contactEmail)}/summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const data: ContactSummaryResponse = await response.json();

  if (!data.success || !data.summary) {
    throw new Error(data.error || 'Failed to generate summary');
  }

  // Convert date strings back to Date objects
  const summary = {
    ...data.summary,
    dateRange: data.summary.dateRange ? {
      earliest: new Date(data.summary.dateRange.earliest),
      latest: new Date(data.summary.dateRange.latest)
    } : null
  };

  return summary;
}

export function useExistingContactSummary(contactEmail: string | null) {
  return useQuery({
    queryKey: ['contact-summary', contactEmail],
    queryFn: () => contactEmail ? fetchExistingContactSummary(contactEmail) : null,
    enabled: !!contactEmail,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useContactSummary() {
  return useMutation({
    mutationFn: generateContactSummary,
    onSuccess: () => {
      toast.success('AI summary generated');
    },
    onError: (error) => {
      console.error('Summary generation failed:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('AI service temporarily unavailable')) {
          toast.error('AI service unavailable', {
            description: 'Please try again in a moment'
          });
        } else if (error.message.includes('AI service not configured')) {
          toast.error('AI service not available', {
            description: 'Contact administrator'
          });
        } else {
          toast.error('Failed to generate summary', {
            description: error.message
          });
        }
      } else {
        toast.error('Failed to generate summary');
      }
    },
  });
}

// ContactSummary interface is already exported above