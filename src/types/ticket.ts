export type TicketPriority = "Low" | "Medium" | "High";
export type TicketStatus = "Open" | "Pending" | "Closed";
export type UserRole = "customer" | "agent" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface Ticket {
  id: number;
  subject: string;
  description: string;
  customer: User;
  assignedTo?: User;
  status: TicketStatus;
  priority: TicketPriority;
  created: string;
  updated: string;
  comments: TicketComment[];
}

export interface TicketComment {
  id: number;
  ticketId: number;
  user: User;
  content: string;
  created: string;
}