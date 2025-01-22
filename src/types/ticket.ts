import { Database } from "@/integrations/supabase/types";

export type TicketPriority = Database["public"]["Enums"]["ticket_priority"];
export type TicketStatus = Database["public"]["Enums"]["ticket_status"];
export type UserRole = "customer" | "agent" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Company {
  id: string;
  name: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string | null;
  customer: User;
  assignedTo?: User;
  company?: Company;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  updated_at: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  user: User;
  content: string;
  created_at: string;
}