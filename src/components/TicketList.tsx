import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Ticket, TicketStatus, UserRole } from "@/types/ticket";
import { useState } from "react";
import { MessageSquare, User } from "lucide-react";

// Simulated user data - in a real app, this would come from authentication
const currentUser = {
  id: "1",
  name: "John Doe",
  email: "john@example.com",
  role: "agent" as UserRole,
};

// Simulated ticket data - in a real app, this would come from an API
const mockTickets: Ticket[] = [
  {
    id: "1",
    title: "Cannot access my account",
    description: "I'm unable to log in to my account after the recent update.",
    customer: {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah@example.com",
      role: "customer",
    },
    assignedTo: currentUser,
    status: "open",
    priority: "high",
    created_at: "2h ago",
    updated_at: "1h ago",
  },
  {
    id: "2",
    title: "Feature request: Dark mode",
    description: "Would love to see a dark mode option in the app.",
    customer: {
      id: "3",
      name: "Mike Brown",
      email: "mike@example.com",
      role: "customer",
    },
    status: "in_progress",
    priority: "medium",
    created_at: "1d ago",
    updated_at: "12h ago",
  },
];

const TicketList = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const searchQuery = searchParams.get("q")?.toLowerCase();

  const filteredTickets = searchQuery
    ? tickets.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(searchQuery) ||
          ticket.customer.name.toLowerCase().includes(searchQuery)
      )
    : tickets;

  const handleTicketClick = (ticket: Ticket) => {
    toast({
      title: `Ticket #${ticket.id}`,
      description: `Viewing ticket: ${ticket.title}`,
    });
  };

  const handleAssignTicket = (e: React.MouseEvent, ticket: Ticket) => {
    e.stopPropagation();
    if (currentUser.role === "customer") {
      toast({
        title: "Permission Denied",
        description: "Only agents and admins can assign tickets.",
        variant: "destructive",
      });
      return;
    }

    const updatedTickets = tickets.map((t) =>
      t.id === ticket.id
        ? { ...t, assignedTo: currentUser, status: "in_progress" as TicketStatus }
        : t
    );
    setTickets(updatedTickets);
    toast({
      title: "Ticket Assigned",
      description: `Ticket #${ticket.id} has been assigned to you.`,
    });
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "closed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-zendesk-border">
        <h2 className="text-lg font-semibold text-zendesk-secondary">
          {searchQuery ? `Search Results (${filteredTickets.length})` : "Recent Tickets"}
        </h2>
      </div>
      <div className="divide-y divide-zendesk-border">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="p-4 hover:bg-zendesk-background transition-colors cursor-pointer"
              onClick={() => handleTicketClick(ticket)}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium text-zendesk-secondary">{ticket.title}</h3>
                  <div className="flex items-center space-x-2 text-sm text-zendesk-muted">
                    <User className="w-4 h-4" />
                    <span>{ticket.customer.name}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge
                    variant="secondary"
                    className={cn("text-xs", getStatusColor(ticket.status))}
                  >
                    {ticket.status}
                  </Badge>
                  {!ticket.assignedTo && currentUser.role !== "customer" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleAssignTicket(e, ticket)}
                    >
                      Assign to me
                    </Button>
                  )}
                  <span className="text-sm text-zendesk-muted">{ticket.created_at}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-zendesk-muted">
            No tickets found matching your search criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketList;