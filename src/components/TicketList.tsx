import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-zendesk-border">
        <h2 className="text-lg font-semibold text-zendesk-secondary">Recent Tickets</h2>
      </div>
      <div className="divide-y divide-zendesk-border">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="p-4 hover:bg-zendesk-background transition-colors cursor-pointer"
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
        ))}
      </div>
    </div>
  );
};

export default TicketList;