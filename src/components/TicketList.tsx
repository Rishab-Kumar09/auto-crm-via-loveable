import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const tickets = [
  {
    id: 1,
    subject: "Cannot access my account",
    customer: "John Smith",
    status: "Open",
    priority: "High",
    created: "2h ago",
  },
  {
    id: 2,
    subject: "How do I reset my password?",
    customer: "Sarah Johnson",
    status: "Pending",
    priority: "Medium",
    created: "4h ago",
  },
  {
    id: 3,
    subject: "Billing issue with subscription",
    customer: "Mike Brown",
    status: "Closed",
    priority: "Low",
    created: "1d ago",
  },
];

const TicketList = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const searchQuery = searchParams.get("q")?.toLowerCase();

  const filteredTickets = searchQuery
    ? tickets.filter(
        (ticket) =>
          ticket.subject.toLowerCase().includes(searchQuery) ||
          ticket.customer.toLowerCase().includes(searchQuery)
      )
    : tickets;

  const handleTicketClick = (ticket: typeof tickets[0]) => {
    toast({
      title: `Ticket #${ticket.id}`,
      description: `Viewing ticket: ${ticket.subject}`,
    });
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
                  <p className="text-sm text-zendesk-muted">{ticket.customer}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      ticket.status === "Open" && "bg-red-100 text-red-800",
                      ticket.status === "Pending" && "bg-yellow-100 text-yellow-800",
                      ticket.status === "Closed" && "bg-green-100 text-green-800"
                    )}
                  >
                    {ticket.status}
                  </Badge>
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