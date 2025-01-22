import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Ticket } from "@/types/ticket";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const Customers = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('role, company_id')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (!userProfile?.company_id) {
          throw new Error('No company associated with user');
        }

        // Get customers who have tickets with the admin/agent's company
        const { data: ticketCustomers, error: ticketError } = await supabase
          .from('profiles')
          .select(`
            *,
            tickets!customer_id (
              id,
              title,
              status,
              priority,
              created_at,
              company_id
            )
          `)
          .eq('role', 'customer')
          .eq('tickets.company_id', userProfile.company_id);

        if (ticketError) throw ticketError;

        // Filter out customers with no tickets for the company
        const validCustomers = ticketCustomers?.filter(customer => 
          customer.tickets && customer.tickets.length > 0
        ) || [];

        console.log('Fetched customers:', validCustomers);
        setCustomers(validCustomers);
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast({
          title: "Error",
          description: "Could not fetch customers",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewTicket = (ticketId: string) => {
    navigate(`/tickets?ticketId=${ticketId}`);
  };

  return (
    <div className="flex h-screen bg-zendesk-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <h1 className="text-2xl font-bold text-zendesk-secondary mb-6">
            Company Customers
          </h1>
          <div className="grid gap-4">
            {loading ? (
              <Card>
                <CardContent className="p-6">
                  Loading customers...
                </CardContent>
              </Card>
            ) : customers.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  No customers found with tickets in your company.
                </CardContent>
              </Card>
            ) : (
              customers.map((customer) => (
                <Card key={customer.id}>
                  <CardHeader>
                    <CardTitle>{customer.full_name || 'Unnamed Customer'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p><strong>Email:</strong> {customer.email}</p>
                        <p><strong>Joined:</strong> {new Date(customer.created_at).toLocaleDateString()}</p>
                      </div>
                      
                      <Accordion type="single" collapsible>
                        <AccordionItem value="tickets">
                          <AccordionTrigger>
                            Customer Tickets ({customer.tickets.length})
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3">
                              {customer.tickets.map((ticket: any) => (
                                <div 
                                  key={ticket.id}
                                  className="p-3 bg-gray-50 rounded-lg space-y-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium">{ticket.title}</h4>
                                    <div className="flex gap-2">
                                      <Badge className={getStatusColor(ticket.status)}>
                                        {ticket.status.replace('_', ' ')}
                                      </Badge>
                                      {ticket.priority && (
                                        <Badge className={getPriorityColor(ticket.priority)}>
                                          {ticket.priority}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between text-sm text-gray-500">
                                    <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleViewTicket(ticket.id)}
                                    >
                                      View Ticket
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Customers;