export type TicketStatus = 'open' | 'in_progress' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'agent' | 'admin';
}

export interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  customer: User;
  assignedTo?: User;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  content: string;
  user: User;
  created_at: string;
}