import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Ticket, TicketStatus, UserRole } from "@/types/ticket";
import { useState, useEffect } from "react";
import { MessageSquare, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const TicketList = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const searchQuery = searchParams.get("q")?.toLowerCase();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const { data: ticketsData, error } = await supabase
          .from('tickets')
          .select(`
            *,
            customer:profiles!tickets_customer_id_fkey (
              id,
              full_name,
              email,
              role
            ),
            assignedTo:profiles!tickets_assignee_id_fkey (
              id,
              full_name,
              email,
              role
            )
          `);

        if (error) {
          console.error('Error fetching tickets:', error);
          toast({
            title: "Error",
            description: "Failed to load tickets. Please try again.",
            variant: "destructive",
          });
          return;
        }

        // Transform the data to match our Ticket type
        const formattedTickets = ticketsData.map((ticket: any) => ({
          id: ticket.id,
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          customer: {
            id: ticket.customer.id,
            name: ticket.customer.full_name,
            email: ticket.customer.email,
            role: ticket.customer.role,
          },
          ...(ticket.assignedTo && {
            assignedTo: {
              id: ticket.assignedTo.id,
              name: ticket.assignedTo.full_name,
              email: ticket.assignedTo.email,
              role: ticket.assignedTo.role,
            },
          }),
          created_at: new Date(ticket.created_at).toLocaleString(),
          updated_at: new Date(ticket.updated_at).toLocaleString(),
        }));

        setTickets(formattedTickets);
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "Failed to load tickets. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [toast]);

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

  const handleAssignTicket = async (e: React.MouseEvent, ticket: Ticket) => {
    e.stopPropagation();
    
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .single();
      
      if (profileError) throw profileError;

      if (profileData.role === "customer") {
        toast({
          title: "Permission Denied",
          description: "Only agents and admins can assign tickets.",
          variant: "destructive",
        });
        return;
      }

      const { error: updateError } = await supabase
        .from('tickets')
        .update({ 
          assignee_id: userData.user.id,
          status: 'in_progress' as TicketStatus 
        })
        .eq('id', ticket.id);

      if (updateError) throw updateError;

      // Update local state
      setTickets(tickets.map((t) =>
        t.id === ticket.id
          ? {
              ...t,
              assignedTo: {
                id: profileData.id,
                name: profileData.full_name,
                email: profileData.email,
                role: profileData.role,
              },
              status: 'in_progress',
            }
          : t
      ));

      toast({
        title: "Ticket Assigned",
        description: `Ticket #${ticket.id} has been assigned to you.`,
      });
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast({
        title: "Error",
        description: "Failed to assign ticket. Please try again.",
        variant: "destructive",
      });
    }
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center text-zendesk-muted">
          Loading tickets...
        </div>
      </div>
    );
  }

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
                  {!ticket.assignedTo && (
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