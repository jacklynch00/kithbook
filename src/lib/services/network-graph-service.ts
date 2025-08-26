import { prisma } from "@/lib/prisma";

export interface NetworkNode {
  id: string;
  label: string;
  email: string;
  size?: number;
  color?: string;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  label?: string;
}

export interface NetworkGraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export async function getNetworkGraphData(userId: string): Promise<NetworkGraphData> {
  // Get all contacts for the user
  const contacts = await prisma.contact.findMany({
    where: {
      userId,
      archived: false,
    },
  });

  // Create a map for quick contact lookup
  const contactMap = new Map(contacts.map((c: any) => [c.email.toLowerCase(), c]));

  // Initialize nodes
  const nodes: NetworkNode[] = contacts.map((contact: any) => ({
    id: contact.email,
    label: contact.name || contact.email.split('@')[0],
    email: contact.email,
    size: Math.min(Math.max(contact.interactionCount * 2, 10), 50),
    color: getNodeColor(contact.interactionCount),
  }));

  // Track edges with weights
  const edgeMap = new Map<string, { weight: number; interactions: string[] }>();

  // Process emails to find group interactions
  const emails = await prisma.email.findMany({
    where: { userId },
    select: {
      id: true,
      subject: true,
      fromEmail: true,
      toEmails: true,
      receivedAt: true,
    },
  });

  for (const email of emails) {
    const participants = new Set<string>();
    
    // Add sender if it's a known contact
    if (email.fromEmail) {
      const cleanFromEmail = email.fromEmail.toLowerCase();
      if (contactMap.has(cleanFromEmail)) {
        participants.add(cleanFromEmail);
      }
    }

    // Add recipients if they are known contacts
    if (email.toEmails) {
      try {
        const toEmails = JSON.parse(email.toEmails);
        for (const toEmail of toEmails) {
          const cleanToEmail = toEmail.toLowerCase();
          if (contactMap.has(cleanToEmail)) {
            participants.add(cleanToEmail);
          }
        }
      } catch (e) {
        // Skip if JSON parsing fails
        continue;
      }
    }

    // Create edges between all pairs of participants
    const participantArray = Array.from(participants);
    for (let i = 0; i < participantArray.length; i++) {
      for (let j = i + 1; j < participantArray.length; j++) {
        const source = participantArray[i];
        const target = participantArray[j];
        const edgeKey = [source, target].sort().join('|');
        
        if (!edgeMap.has(edgeKey)) {
          edgeMap.set(edgeKey, { weight: 0, interactions: [] });
        }
        
        const edge = edgeMap.get(edgeKey)!;
        edge.weight++;
        edge.interactions.push(`Email: ${email.subject || 'No subject'}`);
      }
    }
  }

  // Process calendar events to find meeting interactions
  const calendarEvents = await prisma.calendarEvent.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      organizer: true,
      attendees: true,
      startTime: true,
    },
  });

  for (const event of calendarEvents) {
    const participants = new Set<string>();
    
    // Add organizer if it's a known contact
    if (event.organizer) {
      const cleanOrganizerEmail = event.organizer.toLowerCase();
      if (contactMap.has(cleanOrganizerEmail)) {
        participants.add(cleanOrganizerEmail);
      }
    }

    // Add attendees if they are known contacts
    if (event.attendees) {
      try {
        const attendees = JSON.parse(event.attendees);
        for (const attendee of attendees) {
          // Attendees might be objects with email property or just strings
          const attendeeEmail = typeof attendee === 'string' ? attendee : attendee.email;
          if (attendeeEmail) {
            const cleanAttendeeEmail = attendeeEmail.toLowerCase();
            if (contactMap.has(cleanAttendeeEmail)) {
              participants.add(cleanAttendeeEmail);
            }
          }
        }
      } catch (e) {
        // Skip if JSON parsing fails
        continue;
      }
    }

    // Create edges between all pairs of participants
    const participantArray = Array.from(participants);
    for (let i = 0; i < participantArray.length; i++) {
      for (let j = i + 1; j < participantArray.length; j++) {
        const source = participantArray[i];
        const target = participantArray[j];
        const edgeKey = [source, target].sort().join('|');
        
        if (!edgeMap.has(edgeKey)) {
          edgeMap.set(edgeKey, { weight: 0, interactions: [] });
        }
        
        const edge = edgeMap.get(edgeKey)!;
        edge.weight++;
        edge.interactions.push(`Meeting: ${event.title || 'No title'}`);
      }
    }
  }

  // Convert edge map to edge array
  const edges: NetworkEdge[] = [];
  edgeMap.forEach((edgeData, edgeKey) => {
    const [source, target] = edgeKey.split('|');
    edges.push({
      id: edgeKey,
      source,
      target,
      weight: edgeData.weight,
      label: `${edgeData.weight} interaction${edgeData.weight > 1 ? 's' : ''}`,
    });
  });

  return { nodes, edges };
}

function getNodeColor(interactionCount: number): string {
  // Color nodes based on interaction frequency
  if (interactionCount >= 20) return '#ff4444'; // Red for very active
  if (interactionCount >= 10) return '#ff8844'; // Orange for active
  if (interactionCount >= 5) return '#ffcc44';  // Yellow for moderate
  return '#44ccff'; // Blue for less active
}