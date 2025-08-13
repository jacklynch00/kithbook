'use client';

import { useContactTimeline } from '@/hooks/use-contacts';
import { Button } from '@/components/ui/button';
import { ContactAvatar } from '@/components/contact-avatar';
import { X, Mail, Calendar, MapPin, Clock, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { TimelineItem } from '@/lib/types';
import { useState } from 'react';

interface ContactTimelineProps {
  contactEmail: string;
  contactName: string | null;
  profileImageUrl?: string | null;
  onClose: () => void;
}

export function ContactTimeline({ contactEmail, contactName, profileImageUrl, onClose }: ContactTimelineProps) {
  const { data: timeline = [], isLoading, error } = useContactTimeline(contactEmail);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-4">
            <ContactAvatar
              name={contactName}
              email={contactEmail}
              profileImageUrl={profileImageUrl}
              size="lg"
            />
            <div>
              <h2 className="text-2xl font-bold">
                {contactName || contactEmail}
              </h2>
              {contactName && (
                <p className="text-muted-foreground">{contactEmail}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error ? (
            <div className="text-center text-red-600 py-8">
              Failed to load timeline. Please try again.
            </div>
          ) : isLoading ? (
            <div className="text-center text-muted-foreground py-8">
              Loading timeline...
            </div>
          ) : timeline.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No interactions found with this contact.
            </div>
          ) : (
            <div className="space-y-6">
              {timeline.map((item, index) => {
                const isExpanded = expandedItems.has(`${item.type}-${item.id}`);
                const itemKey = `${item.type}-${item.id}`;
                
                return (
                  <div key={itemKey} className="flex gap-4">
                    {/* Timeline indicator */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        item.type === 'email' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {item.type === 'email' ? (
                          <Mail className="h-4 w-4" />
                        ) : (
                          <Calendar className="h-4 w-4" />
                        )}
                      </div>
                      {index < timeline.length - 1 && (
                        <div className={`w-px bg-border mt-2 ${isExpanded ? 'h-32' : 'h-16'}`} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="bg-muted/30 rounded-lg p-4 space-y-3 hover:bg-muted/40 transition-colors">
                        {/* Header */}
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="font-medium text-sm truncate">{item.title}</h3>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <time className="text-xs text-muted-foreground">
                              {format(item.date, 'MMM d, yyyy h:mm a')}
                            </time>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(itemKey)}
                              className="h-6 w-6 p-0"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Type-specific content */}
                        {item.type === 'email' ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span>From: {item.details.fromName || item.details.from}</span>
                              {item.details.isRead === false && (
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                                  Unread
                                </span>
                              )}
                            </div>
                            {item.details.body && (
                              <div className="text-sm text-muted-foreground">
                                {isExpanded ? (
                                  <div className="whitespace-pre-wrap max-h-96 overflow-y-auto p-3 bg-background rounded border">
                                    {item.details.body}
                                  </div>
                                ) : (
                                  <p className="line-clamp-3">{item.details.body}</p>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {format(item.details.startTime, 'h:mm a')} - {format(item.details.endTime, 'h:mm a')}
                                </span>
                              </div>
                              {item.details.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span className={isExpanded ? '' : 'truncate'}>{item.details.location}</span>
                                </div>
                              )}
                            </div>
                            
                            {isExpanded && (
                              <div className="space-y-3 p-3 bg-background rounded border">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Start Time:</span>
                                    <div className="text-muted-foreground">
                                      {format(item.details.startTime, 'EEEE, MMMM d, yyyy h:mm a')}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-medium">End Time:</span>
                                    <div className="text-muted-foreground">
                                      {format(item.details.endTime, 'EEEE, MMMM d, yyyy h:mm a')}
                                    </div>
                                  </div>
                                  {item.details.location && (
                                    <div className="col-span-2">
                                      <span className="font-medium">Location:</span>
                                      <div className="text-muted-foreground">{item.details.location}</div>
                                    </div>
                                  )}
                                  {item.details.organizer && (
                                    <div className="col-span-2">
                                      <span className="font-medium">Organizer:</span>
                                      <div className="text-muted-foreground">{item.details.organizer}</div>
                                    </div>
                                  )}
                                  {item.details.status && (
                                    <div>
                                      <span className="font-medium">Status:</span>
                                      <div>
                                        <span className={`inline-block text-xs px-2 py-0.5 rounded ${
                                          item.details.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                          item.details.status === 'tentative' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-red-100 text-red-800'
                                        }`}>
                                          {item.details.status}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {item.details.description && (
                                  <div>
                                    <span className="font-medium text-sm">Description:</span>
                                    <div className="text-muted-foreground text-sm whitespace-pre-wrap mt-1 max-h-48 overflow-y-auto">
                                      {item.details.description}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {!isExpanded && (
                              <>
                                {item.details.organizer && (
                                  <div className="text-sm text-muted-foreground">
                                    Organizer: {item.details.organizer}
                                  </div>
                                )}
                                {item.details.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-3">
                                    {item.details.description}
                                  </p>
                                )}
                                {item.details.status && (
                                  <span className={`inline-block text-xs px-2 py-0.5 rounded ${
                                    item.details.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                    item.details.status === 'tentative' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {item.details.status}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}