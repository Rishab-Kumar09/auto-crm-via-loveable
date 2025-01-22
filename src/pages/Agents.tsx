import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  email: string;
  full_name: string | null;
  tickets: {
    id: string;
    title: string;
    status: string;
    priority: string;
  }[];
}

const Agents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "bg-[#FEF7CD] text-yellow-800"; // Soft Yellow
      case "open":
        return "bg-[#FFDEE2] text-red-800"; // Soft Pink
      case "closed":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500 text-white";
      case "medium":
        return "bg-[#FEF7CD] text-yellow-800"; // Soft Yellow
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // First get the admin's company_id
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (!adminProfile?.company_id) {
          toast({
            title: "Error",
            description: "Could not fetch company information",
            variant: "destructive",
          });
          return;
        }

        // Get all agents from the same company, specifically selecting tickets where they are the assignee
        const { data: agentsData, error: agentsError } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            full_name,
            tickets!tickets_assignee_id_fkey (
              id,
              title,
              status,
              priority
            )
          `)
          .eq('role', 'agent')
          .eq('company_id', adminProfile.company_id);

        if (agentsError) {
          console.error('Error fetching agents:', agentsError);
          toast({
            title: "Error",
            description: "Could not fetch agents",
            variant: "destructive",
          });
          return;
        }

        setAgents(agentsData as Agent[]);
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "An error occurred while fetching agents",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [toast]);

  return (
    <div className="flex h-screen bg-zendesk-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <h1 className="text-2xl font-bold text-zendesk-secondary mb-6">
            Agents
          </h1>
          {loading ? (
            <p>Loading agents...</p>
          ) : (
            <div className="grid gap-6">
              {agents.map((agent) => (
                <Card key={agent.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {agent.full_name || agent.email}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2">Assigned Tickets</h3>
                        {agent.tickets && agent.tickets.length > 0 ? (
                          <div className="space-y-2">
                            {agent.tickets.map((ticket) => (
                              <div
                                key={ticket.id}
                                className="flex items-center justify-between p-3 bg-white rounded-lg border border-zendesk-border"
                              >
                                <span className="text-sm">{ticket.title}</span>
                                <div className="flex gap-2">
                                  <Badge className={cn(getStatusColor(ticket.status))}>
                                    {ticket.status.replace('_', ' ')}
                                  </Badge>
                                  <Badge className={cn(getPriorityColor(ticket.priority))}>
                                    {ticket.priority}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-zendesk-muted">No tickets assigned</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {agents.length === 0 && (
                <p className="text-center text-zendesk-muted">No agents found</p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Agents;