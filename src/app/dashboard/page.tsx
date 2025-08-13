'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ContactAvatar } from '@/components/contact-avatar';
import { useState, useMemo } from 'react';
import { useContacts, useArchiveContact, useUpdateContact } from '@/hooks/use-contacts';
import { useSync } from '@/hooks/use-sync';
import { useSyncStatus } from '@/hooks/use-sync-status';
import { ContactTimeline } from '@/components/contact-timeline';
import { NetworkGraphModal } from '@/components/network-graph-modal';
import { DashboardLayout } from '@/components/dashboard-layout';
import { ContactType } from '@/lib/types';
import { Archive, Network, Edit3, Check, X, Loader2 } from 'lucide-react';

export default function Dashboard() {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedContact, setSelectedContact] = useState<ContactType | null>(null);
	const [editingContact, setEditingContact] = useState<string | null>(null);
	const [editForm, setEditForm] = useState({ name: '', email: '' });
	const [showNetworkModal, setShowNetworkModal] = useState(false);

	// React Query hooks
	const { data: allContacts = [], isLoading: loadingContacts, error: contactsError } = useContacts();
	const { mutate: syncData, isPending: syncing, isPollingJobs, runningJobs } = useSync();
	const { data: syncStatus, isLoading: loadingSyncStatus } = useSyncStatus();
	const { mutate: archiveContact, isPending: archiving } = useArchiveContact();
	const { mutate: updateContact, isPending: updating } = useUpdateContact();

	const handleSync = () => {
		syncData();
	};

	const handleArchiveContact = (contactId: string, event: React.MouseEvent) => {
		event.stopPropagation(); // Prevent opening timeline
		if (confirm('Are you sure you want to archive this contact? They will no longer appear in your contact list.')) {
			archiveContact(contactId);
		}
	};

	const handleStartEdit = (contact: ContactType, event: React.MouseEvent) => {
		event.stopPropagation(); // Prevent opening timeline
		setEditingContact(contact.id);
		setEditForm({
			name: contact.name || '',
			email: contact.email,
		});
	};

	const handleCancelEdit = (event: React.MouseEvent) => {
		event.stopPropagation();
		setEditingContact(null);
		setEditForm({ name: '', email: '' });
	};

	const handleSaveEdit = (contactId: string, event: React.MouseEvent) => {
		event.stopPropagation();

		const updates: { name?: string; email?: string } = {};
		if (editForm.name.trim()) updates.name = editForm.name.trim();
		if (editForm.email.trim()) updates.email = editForm.email.trim();

		updateContact(
			{ contactId, updates },
			{
				onSuccess: () => {
					setEditingContact(null);
					setEditForm({ name: '', email: '' });
				},
			}
		);
	};

	// Filter contacts based on search term
	const filteredContacts = useMemo(() => {
		if (!searchTerm.trim()) {
			return allContacts;
		}
		return allContacts.filter((contact) => contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) || contact.email.toLowerCase().includes(searchTerm.toLowerCase()));
	}, [searchTerm, allContacts]);

	return (
		<DashboardLayout>
			<div className='container mx-auto px-4 py-8'>
				<div className='max-w-4xl mx-auto space-y-8'>
					<div className='flex justify-end items-start'>
						<div className='flex-1'></div>
						<div className='flex items-center gap-3 mt-2'>
							<Button onClick={() => setShowNetworkModal(true)} variant='outline' size='sm'>
								<Network className='w-4 h-4 mr-2' />
								View Network
							</Button>
							<Button 
								onClick={handleSync} 
								disabled={syncing || loadingSyncStatus || !syncStatus?.canSync || isPollingJobs} 
								variant='default' 
								size='sm'
								title={
									!syncStatus?.canSync && syncStatus?.minutesUntilNext 
										? `You can sync again in ${syncStatus.minutesUntilNext} minute(s)`
										: isPollingJobs
										? `Sequential sync in progress: Calendar first, then Gmail automatically`
										: undefined
								}
							>
								{(syncing || isPollingJobs) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
								{syncing ? 'Syncing...' : 
								 isPollingJobs ? `Processing...` :
								 !syncStatus?.canSync && syncStatus?.minutesUntilNext ? 
								 `Sync (${syncStatus.minutesUntilNext}m)` : 
								 'Sync Data'}
							</Button>
						</div>
					</div>

					<div className='space-y-6'>
						{/* Contacts Section */}
						<div className='space-y-4'>
							<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
								<div className='flex items-center gap-4'>
									<h3 className='text-xl font-semibold'>Your Contacts</h3>
								</div>
								<div className='w-full sm:w-80'>
									<Input type='text' placeholder='Search...' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='w-full' />
								</div>
							</div>

							{/* Contact Cards */}
							<div className='space-y-4'>
								<div className='flex justify-between items-center'>
									<h4 className='font-semibold'>
										{loadingContacts ? 'Loading contacts...' : `${filteredContacts.length} contacts${searchTerm ? ` (filtered)` : ''}`}
									</h4>
								</div>

								{contactsError ? (
									<div className='p-8 text-center text-red-600'>Failed to load contacts. Please try again.</div>
								) : loadingContacts ? (
									<div className='p-8 text-center text-muted-foreground'>Loading your contacts...</div>
								) : filteredContacts.length > 0 ? (
									<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
										{filteredContacts.map((contact) => (
											<Card
												key={contact.id}
												className='hover:shadow-md transition-all cursor-pointer'
												onClick={() => (editingContact !== contact.id ? setSelectedContact(contact) : undefined)}>
												{editingContact === contact.id ? (
													// Edit mode
													<CardContent className='p-4' onClick={(e) => e.stopPropagation()}>
														<div className='space-y-3'>
															<Input
																value={editForm.name}
																onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
																placeholder='Contact name'
																className='text-sm'
															/>
															<Input
																value={editForm.email}
																onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
																placeholder='Contact email'
																type='email'
																className='text-sm'
															/>
															<div className='text-xs text-muted-foreground'>
																{contact.interactionCount} interactions • Last: {contact.lastInteractionAt.toLocaleDateString()}
															</div>
															<div className='flex items-center gap-1 justify-end pt-2'>
																<Button
																	variant='ghost'
																	size='sm'
																	onClick={(e) => handleSaveEdit(contact.id, e)}
																	disabled={updating}
																	className='text-xs text-green-600 hover:text-green-700'>
																	<Check className='w-4 h-4' />
																</Button>
																<Button variant='ghost' size='sm' onClick={handleCancelEdit} className='text-xs text-gray-600 hover:text-gray-700'>
																	<X className='w-4 h-4' />
																</Button>
															</div>
														</div>
													</CardContent>
												) : (
													// View mode
													<>
														<CardHeader className='pb-3'>
															<div className='flex items-center space-x-3'>
																<ContactAvatar name={contact.name} email={contact.email} profileImageUrl={contact.profileImageUrl} size='md' />
																<div className='space-y-1 flex-1 min-w-0'>
																	<h3 className='font-medium text-sm leading-tight truncate'>{contact.name || contact.email}</h3>
																	{contact.name && <p className='text-xs text-muted-foreground truncate'>{contact.email}</p>}
																</div>
															</div>
														</CardHeader>
														<CardContent className='pt-0 pb-4'>
															<div className='space-y-2'>
																<div className='text-xs text-muted-foreground'>{contact.interactionCount} interactions</div>
																<div className='text-xs text-muted-foreground'>
																	Last interaction: {contact.lastInteractionAt.toLocaleDateString()}
																</div>
																<div className='flex items-center gap-1 justify-end pt-2'>
																	<Button
																		variant='ghost'
																		size='sm'
																		onClick={(e) => handleStartEdit(contact, e)}
																		className='h-8 w-8 p-0 text-muted-foreground hover:text-blue-600'>
																		<Edit3 className='w-4 h-4' />
																	</Button>
																	<Button
																		variant='ghost'
																		size='sm'
																		onClick={(e) => handleArchiveContact(contact.id, e)}
																		disabled={archiving}
																		className='h-8 w-8 p-0 text-muted-foreground hover:text-red-600'>
																		<Archive className='w-4 h-4' />
																	</Button>
																</div>
															</div>
														</CardContent>
													</>
												)}
											</Card>
										))}
									</div>
								) : (
									<div className='p-8 text-center text-muted-foreground'>
										{searchTerm ? `No contacts found matching "${searchTerm}"` : 'No contacts yet. Sync your Gmail & Calendar to discover contacts.'}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Contact Timeline Modal */}
			{selectedContact && (
				<ContactTimeline
					contactEmail={selectedContact.email}
					contactName={selectedContact.name}
					profileImageUrl={selectedContact.profileImageUrl}
					onClose={() => setSelectedContact(null)}
				/>
			)}

			{/* Network Graph Modal */}
			<NetworkGraphModal isOpen={showNetworkModal} onClose={() => setShowNetworkModal(false)} />
		</DashboardLayout>
	);
}
