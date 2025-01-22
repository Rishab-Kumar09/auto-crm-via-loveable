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
  id: 1,
  name: "John Doe",
  email: "john@example.com",
  role: "agent" as UserRole,
};

// Simulated ticket data - in a real app, this would come from an API
const mockTickets: Ticket[] = [
  {
    id: 1,
    subject: "Cannot access my account",
    description: "I'm unable to log in to my account after the recent update.",
    customer: {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah@example.com",
      role: "customer",
    },
    assignedTo: currentUser,
    status: "Open",
    priority: "High",
    created: "2h ago",
    updated: "1h ago",
    comments: [
      {
        id: 1,
        ticketId: 1,
        user: currentUser,
        content: "I'll look into this right away.",
        created: "1h ago",
      },
    ],
  },
  {
    id: 2,
    subject: "Feature request: Dark mode",
    description: "Would love to see a dark mode option in the app.",
    customer: {
      id: 3,
      name: "Mike Brown",
      email: "mike@example.com",
      role: "customer",
    },
    status: "Pending",
    priority: "Medium",
    created: "1d ago",
    updated: "12h ago",
    comments: [],
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
          ticket.subject.toLowerCase().includes(searchQuery) ||
          ticket.customer.name.toLowerCase().includes(searchQuery)
      )
    : tickets;

  const handleTicketClick = (ticket: Ticket) => {
    toast({
      title: `Ticket #${ticket.id}`,
      description: `Viewing ticket: ${ticket.subject}`,
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
        ? { ...t, assignedTo: currentUser, status: "Pending" as TicketStatus }
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
      case "Open":
        return "bg-red-100 text-red-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Closed":
        return "bg-green-100 text-green-800";
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
                  <h3 className="font-medium text-zendesk-secondary">{ticket.subject}</h3>
                  <div className="flex items-center space-x-2 text-sm text-zendesk-muted">
                    <User className="w-4 h-4" />
                    <span>{ticket.customer.name}</span>
                    {ticket.comments.length > 0 && (
                      <>
                        <MessageSquare className="w-4 h-4 ml-2" />
                        <span>{ticket.comments.length}</span>
                      </>
                    )}
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
                  <span className="text-sm text-zendesk-muted">{ticket.created}</span>
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