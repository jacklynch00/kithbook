'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signOut, useSession } from '@/lib/auth-client';
import { redirect } from 'next/navigation';
import { useState, useMemo } from 'react';
import { useContacts, useArchiveContact, useUpdateContact } from '@/hooks/use-contacts';
import { useSync } from '@/hooks/use-sync';
import { useNetworkGraph } from '@/hooks/use-network-graph';
import { ContactTimeline } from '@/components/contact-timeline';
import { NetworkGraph } from '@/components/network-graph';
import { ContactType } from '@/lib/types';
import { Archive, Network, Edit3, Check, X } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
	const { data: session, isPending } = useSession();
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedContact, setSelectedContact] = useState<ContactType | null>(null);
	const [editingContact, setEditingContact] = useState<string | null>(null);
	const [editForm, setEditForm] = useState({ name: '', email: '' });

	// React Query hooks
	const { data: allContacts = [], isLoading: loadingContacts, error: contactsError } = useContacts();
	const { mutate: syncData, isPending: syncing, data: syncResult, error: syncError } = useSync();
	const { mutate: archiveContact, isPending: archiving } = useArchiveContact();
	const { mutate: updateContact, isPending: updating } = useUpdateContact();
	const { data: networkData, isLoading: loadingNetwork } = useNetworkGraph();

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
			email: contact.email 
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

		updateContact({ contactId, updates }, {
			onSuccess: () => {
				setEditingContact(null);
				setEditForm({ name: '', email: '' });
			}
		});
	};

	// Filter contacts based on search term
	const filteredContacts = useMemo(() => {
		if (!searchTerm.trim()) {
			return allContacts;
		}
		return allContacts.filter((contact) => contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) || contact.email.toLowerCase().includes(searchTerm.toLowerCase()));
	}, [searchTerm, allContacts]);

	if (isPending) {
		return (
			<main className='min-h-screen flex items-center justify-center'>
				<div className='text-center'>
					<p>Loading...</p>
				</div>
			</main>
		);
	}

	if (!session) {
		return redirect('/');
	}

	return (
		<main className='min-h-screen bg-background'>
			<header className='border-b'>
				<div className='container mx-auto px-4 py-4 flex justify-between items-center'>
					<div className='flex items-center gap-8'>
						<h1 className='text-2xl font-bold'>KithBook</h1>
						<nav className='flex items-center gap-4'>
							<Link href='/dashboard' className='text-sm font-medium hover:text-primary transition-colors'>
								Dashboard
							</Link>
							<Link href='/network' className='text-sm font-medium hover:text-primary transition-colors flex items-center gap-1'>
								<Network className='w-4 h-4' />
								Network
							</Link>
						</nav>
					</div>
					<div className='flex items-center gap-4'>
						<span className='text-sm text-muted-foreground'>Welcome, {session.user.name || session.user.email}</span>
						<Button onClick={async () => await signOut()} variant='outline'>
							Sign Out
						</Button>
					</div>
				</div>
			</header>

			<div className='container mx-auto px-4 py-8'>
				<div className='max-w-4xl mx-auto space-y-8'>
					<div className='text-center'>
						<h2 className='text-3xl font-bold mb-4'>Welcome to your Dashboard</h2>
						<p className='text-lg text-muted-foreground'>Track your contacts and manage your relationships</p>
					</div>

					<div className='space-y-6'>
						{/* Sync Section */}
						<div className='text-center'>
							<Button onClick={handleSync} disabled={syncing} size='lg'>
								{syncing ? 'Syncing...' : 'Sync Gmail & Calendar'}
							</Button>
						</div>

						{/* Network Graph Section */}
						<div className='space-y-4'>
							<div className='flex items-center justify-between'>
								<h3 className='text-xl font-semibold'>Contact Network</h3>
								<Link href='/network' className='text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1'>
									<Network className='w-4 h-4' />
									View Full Screen
								</Link>
							</div>
							
							<div className='border rounded-lg bg-background' style={{ height: '400px' }}>
								<NetworkGraph data={networkData} isLoading={loadingNetwork} compact={true} />
							</div>
							
							{networkData && (
								<div className='flex flex-col sm:flex-row justify-between items-center gap-4'>
									<div className='text-center sm:text-left text-sm text-muted-foreground'>
										Showing {networkData.nodes.length} contacts with {networkData.edges.length} connections
									</div>
									
									{/* Legend */}
									<div className='flex flex-wrap items-center gap-4 text-xs text-muted-foreground'>
										<div className='flex items-center gap-1'>
											<div className='w-3 h-3 rounded-full bg-red-500'></div>
											<span>Very active (20+)</span>
										</div>
										<div className='flex items-center gap-1'>
											<div className='w-3 h-3 rounded-full bg-orange-500'></div>
											<span>Active (10-19)</span>
										</div>
										<div className='flex items-center gap-1'>
											<div className='w-3 h-3 rounded-full bg-yellow-500'></div>
											<span>Moderate (5-9)</span>
										</div>
										<div className='flex items-center gap-1'>
											<div className='w-3 h-3 rounded-full bg-blue-500'></div>
											<span>Less active (&lt;5)</span>
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Contacts Section */}
						<div className='space-y-4'>
							<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
								<div className='flex items-center gap-4'>
									<h3 className='text-xl font-semibold'>Your Contacts</h3>
								</div>
								<div className='w-full sm:w-80'>
									<Input type='text' placeholder='Filter contacts...' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='w-full' />
								</div>
							</div>

							{/* Contact Table */}
							<div className='border rounded-lg'>
								<div className='p-4 border-b bg-muted/50'>
									<h4 className='font-semibold'>
										{loadingContacts ? 'Loading contacts...' : `${filteredContacts.length} contacts${searchTerm ? ` (filtered)` : ''}`}
									</h4>
								</div>

								{contactsError ? (
									<div className='p-8 text-center text-red-600'>Failed to load contacts. Please try again.</div>
								) : loadingContacts ? (
									<div className='p-8 text-center text-muted-foreground'>Loading your contacts...</div>
								) : filteredContacts.length > 0 ? (
									<div className='divide-y'>
										{filteredContacts.map((contact) => (
											<div key={contact.id} className='p-4 hover:bg-muted/30 transition-colors' onClick={() => editingContact !== contact.id ? setSelectedContact(contact) : undefined}>
												<div className='flex justify-between items-start'>
													<div className='space-y-1 flex-1'>
														{editingContact === contact.id ? (
															// Edit mode
															<div className='space-y-2' onClick={(e) => e.stopPropagation()}>
																<Input
																	value={editForm.name}
																	onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
																	placeholder='Contact name'
																	className='text-sm'
																/>
																<Input
																	value={editForm.email}
																	onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
																	placeholder='Contact email'
																	type='email'
																	className='text-sm'
																/>
																<div className='text-xs text-muted-foreground'>
																	{contact.interactionCount} interactions • Last: {contact.lastInteractionAt.toLocaleDateString()}
																</div>
															</div>
														) : (
															// View mode
															<div>
																<div className='font-medium'>{contact.name || contact.email}</div>
																{contact.name && <div className='text-sm text-muted-foreground'>{contact.email}</div>}
																<div className='text-xs text-muted-foreground'>
																	{contact.interactionCount} interactions • Last: {contact.lastInteractionAt.toLocaleDateString()}
																</div>
															</div>
														)}
													</div>
													<div className='flex items-center gap-2'>
														{editingContact === contact.id ? (
															// Edit action buttons
															<div className='flex items-center gap-1'>
																<Button
																	variant='ghost'
																	size='sm'
																	onClick={(e) => handleSaveEdit(contact.id, e)}
																	disabled={updating}
																	className='text-xs text-green-600 hover:text-green-700'>
																	<Check className='w-4 h-4' />
																</Button>
																<Button
																	variant='ghost'
																	size='sm'
																	onClick={handleCancelEdit}
																	className='text-xs text-gray-600 hover:text-gray-700'>
																	<X className='w-4 h-4' />
																</Button>
															</div>
														) : (
															// View action buttons
															<>
																<div className='text-xs text-muted-foreground'>Click to view timeline</div>
																<Button
																	variant='ghost'
																	size='sm'
																	onClick={(e) => handleStartEdit(contact, e)}
																	className='text-xs text-muted-foreground hover:text-blue-600'>
																	<Edit3 className='w-4 h-4' />
																</Button>
																<Button
																	variant='ghost'
																	size='sm'
																	onClick={(e) => handleArchiveContact(contact.id, e)}
																	disabled={archiving}
																	className='text-xs text-muted-foreground hover:text-red-600'>
																	<Archive className='w-4 h-4 text-red-600' />
																</Button>
															</>
														)}
													</div>
												</div>
											</div>
										))}
									</div>
								) : (
									<div className='p-8 text-center text-muted-foreground'>
										{searchTerm ? `No contacts found matching "${searchTerm}"` : 'No contacts yet. Sync your Gmail & Calendar to discover contacts.'}
									</div>
								)}
							</div>
						</div>

						{/* Sync Results */}
						{syncResult && (
							<div className='max-w-2xl mx-auto p-4 border rounded-lg text-left'>
								<h3 className='font-semibold mb-2'>Sync Results:</h3>
								{syncResult.success ? (
									<div className='space-y-2'>
										{syncResult.results?.gmail && (
											<p className='text-green-600'>
												📧 Gmail: {syncResult.results.gmail.syncedCount} new emails synced (of {syncResult.results.gmail.totalFound} found)
											</p>
										)}
										{syncResult.results?.calendar && (
											<p className='text-green-600'>
												📅 Calendar: {syncResult.results.calendar.syncedCount} new events synced (of {syncResult.results.calendar.totalFound} found)
											</p>
										)}
										{syncResult.results?.errors && syncResult.results.errors.length > 0 && (
											<div className='text-red-600'>
												<p>Errors:</p>
												{syncResult.results?.errors?.map((error: string, i: number) => (
													<p key={i}>• {error}</p>
												))}
											</div>
										)}
									</div>
								) : (
									<p className='text-red-600'>
										❌ {syncResult.error}: {syncResult.details}
									</p>
								)}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Contact Timeline Modal */}
			{selectedContact && <ContactTimeline contactEmail={selectedContact.email} contactName={selectedContact.name} onClose={() => setSelectedContact(null)} />}
		</main>
	);
}
