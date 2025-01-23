import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AgentPerformance = () => {
  const { data: performance } = useQuery({
    queryKey: ['agentPerformance'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get agent's performance metrics
      const { data: metrics } = await supabase
        .from('agent_performance')
        .select('*')
        .eq('agent_id', user.id)
        .single();

      if (!metrics) {
        return {
          total_tickets: 0,
          resolved_tickets: 0,
          open_tickets: 0,
          in_progress_tickets: 0,
          avg_resolution_time_hours: 0,
          avg_rating: 0
        };
      }

      return metrics;
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