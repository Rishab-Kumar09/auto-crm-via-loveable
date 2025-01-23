import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AgentPerformance = () => {
  const { data: performance } = useQuery({
    queryKey: ['agentPerformance'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get all tickets assigned to the agent through ticket_assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('ticket_assignments')
        .select(`
          ticket_id,
          tickets (
            status,
            created_at,
            updated_at
          )
        `)
        .eq('agent_id', user.id);

      if (assignmentsError) throw assignmentsError;

      // Get agent's feedback ratings
      const { data: feedback } = await supabase
        .from('feedback')
        .select('rating')
        .in('ticket_id', (assignments || []).map(a => a.ticket_id));

      // Calculate metrics
      const tickets = assignments || [];
      const totalTickets = tickets.length;
      const resolvedTickets = tickets.filter(t => t.tickets?.status === 'closed').length;
      const openTickets = tickets.filter(t => t.tickets?.status === 'open').length;
      const inProgressTickets = tickets.filter(t => t.tickets?.status === 'in_progress').length;

      // Calculate average resolution time for closed tickets
      const resolutionTimes = tickets
        .filter(t => t.tickets?.status === 'closed')
        .map(t => {
          const created = new Date(t.tickets?.created_at);
          const updated = new Date(t.tickets?.updated_at);
          return (updated.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
        });

      const avgResolutionTime = resolutionTimes.length > 0
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
        : 0;

      // Calculate average rating
      const ratings = (feedback || []).map(f => f.rating).filter(r => r !== null);
      const avgRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

      return {
        total_tickets: totalTickets,
        resolved_tickets: resolvedTickets,
        open_tickets: openTickets,
        in_progress_tickets: inProgressTickets,
        avg_resolution_time_hours: avgResolutionTime,
        avg_rating: avgRating
      };
    },
    refetchInterval: 5000,
  });

  if (!performance) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Your Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Resolution Rate</p>
            <p className="text-2xl font-bold">
              {performance.total_tickets > 0
                ? Math.round((performance.resolved_tickets / performance.total_tickets) * 100)
                : 0}%
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Average Resolution Time</p>
            <p className="text-2xl font-bold">
              {Math.round(performance.avg_resolution_time_hours)} hours
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Customer Rating</p>
            <p className="text-2xl font-bold">
              {performance.avg_rating.toFixed(1)}/5
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentPerformance;