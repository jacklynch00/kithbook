import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  ContactType, 
  ContactSchema,
  ContactsApiResponse, 
  ContactsApiResponseSchema,
  TimelineApiResponse,
  TimelineApiResponseSchema,
  TimelineItem
} from '@/lib/types';

// Query keys
export const contactsKeys = {
	all: ['contacts'] as const,
	list: () => [...contactsKeys.all, 'list'] as const,
	search: (term: string) => [...contactsKeys.all, 'search', term] as const,
	timeline: (email: string) => [...contactsKeys.all, 'timeline', email] as const,
};

// Fetch all contacts
async function fetchContacts(): Promise<ContactType[]> {
	const response = await fetch('/api/contacts');
	
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const rawResult = await response.json();
	console.log('Raw API response:', rawResult); // Debug log
	
	const result = ContactsApiResponseSchema.safeParse(rawResult);

	if (!result.success) {
		console.error('Zod validation failed:', result.error); // Debug log
		console.error('Validation details:', JSON.stringify(result.error.format(), null, 2)); // More detailed log
		throw new Error(`Invalid API response format: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`);
	}

	if (!result.data.success) {
		throw new Error(result.data.error || 'Failed to fetch contacts');
	}

	console.log('Parsed contacts:', result.data.contacts); // Debug log
	return result.data.contacts || [];
}

// Search contacts
async function searchContacts(searchTerm: string): Promise<ContactType[]> {
	if (!searchTerm.trim()) return [];

	const response = await fetch(`/api/contacts/search?q=${encodeURIComponent(searchTerm)}`);
	
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const rawResult = await response.json();
	const result = ContactsApiResponseSchema.safeParse(rawResult);

	if (!result.success) {
		throw new Error('Invalid API response format');
	}

	if (!result.data.success) {
		throw new Error(result.data.error || 'Failed to search contacts');
	}

	return result.data.contacts || [];
}

// Hook to get all contacts
export function useContacts() {
	return useQuery({
		queryKey: contactsKeys.list(),
		queryFn: fetchContacts,
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: false, // Disable retries for debugging
		refetchOnWindowFocus: false,
	});
}

// Hook to search contacts (using useQuery for caching)
export function useSearchContacts(searchTerm: string) {
	return useQuery({
		queryKey: contactsKeys.search(searchTerm),
		queryFn: () => searchContacts(searchTerm),
		enabled: searchTerm.trim().length >= 2,
		staleTime: 2 * 60 * 1000, // 2 minutes for search results
	});
}

// Fetch contact timeline
async function fetchContactTimeline(contactEmail: string): Promise<TimelineItem[]> {
	const response = await fetch(`/api/contacts/${encodeURIComponent(contactEmail)}/timeline`);
	
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const rawResult = await response.json();
	const result = TimelineApiResponseSchema.safeParse(rawResult);

	if (!result.success) {
		throw new Error('Invalid API response format');
	}

	if (!result.data.success) {
		throw new Error(result.data.error || 'Failed to fetch contact timeline');
	}

	return result.data.timeline || [];
}

// Hook to get contact timeline
export function useContactTimeline(contactEmail: string) {
	return useQuery({
		queryKey: contactsKeys.timeline(contactEmail),
		queryFn: () => fetchContactTimeline(contactEmail),
		enabled: !!contactEmail,
		staleTime: 2 * 60 * 1000, // 2 minutes
	});
}

// Archive contact function
async function archiveContactApi(contactId: string): Promise<ContactType> {
	const response = await fetch(`/api/contacts/${contactId}/archive`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
	});
	
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const rawResult = await response.json();
	const result = ContactsApiResponseSchema.safeParse(rawResult);

	if (!result.success) {
		throw new Error('Invalid API response format');
	}

	if (!result.data.success) {
		throw new Error(result.data.error || 'Failed to archive contact');
	}

	if (!result.data.contacts?.[0]) {
		throw new Error('No contact returned from archive operation');
	}

	return result.data.contacts[0];
}

// Hook to archive contact
export function useArchiveContact() {
	const queryClient = useQueryClient();
	
	return useMutation({
		mutationFn: archiveContactApi,
		onSuccess: () => {
			// Invalidate and refetch contacts after successful archive
			queryClient.invalidateQueries({ queryKey: contactsKeys.all });
		},
		onError: (error) => {
			console.error('Archive contact failed:', error);
		},
	});
}

// Recalculate interaction counts function
async function recalculateInteractionCounts(): Promise<{ success: boolean; message: string }> {
	const response = await fetch('/api/contacts/recalculate', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
	});
	
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const result = await response.json();
	return result;
}

// Hook to recalculate interaction counts
export function useRecalculateInteractionCounts() {
	const queryClient = useQueryClient();
	
	return useMutation({
		mutationFn: recalculateInteractionCounts,
		onSuccess: () => {
			// Invalidate and refetch contacts after successful recalculation
			queryClient.invalidateQueries({ queryKey: contactsKeys.all });
		},
		onError: (error) => {
			console.error('Recalculate interaction counts failed:', error);
		},
	});
}

// Update contact function
async function updateContactApi(contactId: string, updates: { name?: string; email?: string }): Promise<ContactType> {
	const response = await fetch(`/api/contacts/${contactId}/update`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(updates),
	});
	
	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || `HTTP error! status: ${response.status}`);
	}

	const rawResult = await response.json();
	
	if (!rawResult.success) {
		throw new Error(rawResult.error || 'Failed to update contact');
	}

	// Validate and coerce the contact data through Zod
	const contactValidation = ContactSchema.safeParse(rawResult.contact);
	if (!contactValidation.success) {
		console.error('Contact validation failed:', contactValidation.error);
		throw new Error('Invalid contact data received from server');
	}

	return contactValidation.data;
}

// Hook to update contact
export function useUpdateContact() {
	const queryClient = useQueryClient();
	
	return useMutation({
		mutationFn: ({ contactId, updates }: { contactId: string; updates: { name?: string; email?: string } }) => 
			updateContactApi(contactId, updates),
		onSuccess: (updatedContact) => {
			// Update the contact in the cache
			queryClient.setQueryData<ContactType[]>(contactsKeys.list(), (oldContacts) => {
				if (!oldContacts) return oldContacts;
				return oldContacts.map(contact => 
					contact.id === updatedContact.id ? updatedContact : contact
				);
			});
			
			// Also invalidate related queries
			queryClient.invalidateQueries({ queryKey: ['networkGraph'] });
		},
		onError: (error) => {
			console.error('Update contact failed:', error);
		},
	});
}
