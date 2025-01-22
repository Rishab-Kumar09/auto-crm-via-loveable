import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type Agent = {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  tickets: {
    id: string;
    title: string;
    status: string;
    priority: string;
  }[];
};

const Agents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: userProfile } = await supabase
          .from('profiles')
          .select('role, company_id')
          .eq('id', user.id)
          .single();

        if (!userProfile?.company_id) {
          throw new Error('No company associated with user');
        }

        // Get agents from the same company with their assigned tickets
        const { data: agentsData, error } = await supabase
          .from('profiles')
          .select(`
            *,
            tickets!tickets_assignee_id_fkey (
              id,
              title,
              status,
              priority
            )
          `)
          .eq('role', 'agent')
          .eq('company_id', userProfile.company_id);

        if (error) throw error;

        setAgents(agentsData as Agent[]);
      } catch (error) {
        console.error('Error fetching agents:', error);
        toast({
          title: "Error",
          description: "Could not fetch agents",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [toast]);

  const getStatusColor = (status: string) => {
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex h-screen bg-zendesk-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <h1 className="text-2xl font-bold text-zendesk-secondary mb-6">
            Company Agents
          </h1>
          <div className="grid gap-4">
            {loading ? (
              <Card>
                <CardContent className="p-6">
                  Loading agents...
                </CardContent>
              </Card>
            ) : agents.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  No agents found in your company.
                </CardContent>
              </Card>
            ) : (
              agents.map((agent) => (
                <Card key={agent.id}>
                  <CardHeader>
                    <CardTitle>{agent.full_name || 'Unnamed Agent'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p><strong>Email:</strong> {agent.email}</p>
                        <p><strong>Joined:</strong> {new Date(agent.created_at).toLocaleDateString()}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2">Assigned Tickets</h3>
                        {agent.tickets && agent.tickets.length > 0 ? (
                          <div className="space-y-2">
                            {agent.tickets.map((ticket) => (
                              <div key={ticket.id} className="p-3 bg-gray-50 rounded-lg">
                                <p className="font-medium">{ticket.title}</p>
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="secondary" className={getStatusColor(ticket.status)}>
                                    {ticket.status}
                                  </Badge>
                                  <Badge variant="secondary" className={getPriorityColor(ticket.priority)}>
                                    {ticket.priority}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">No tickets assigned</p>
                        )}
                      </div>
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

export default Agents;