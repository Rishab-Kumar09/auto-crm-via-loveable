import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { UserRole } from "@/types/ticket";
import StatsCards from "@/components/dashboard/StatsCards";
import TicketChart from "@/components/dashboard/TicketChart";
import AgentPerformance from "@/components/dashboard/AgentPerformance";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const [userRole, setUserRole] = useState<UserRole>("customer");

  const { data: ticketMetrics } = useQuery({
    queryKey: ['ticketMetrics'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'agent') {
        // Changed from .single() to .maybeSingle() to handle case where no metrics exist
        const { data } = await supabase
          .from('ticket_metrics')
          .select('*')
          .eq('assignee_id', user.id)
          .maybeSingle();

        // Return default values if no metrics exist
        return data || {
          total_tickets: 0,
          resolved_tickets: 0,
          open_tickets: 0,
          in_progress_tickets: 0
        };
      }

      // For admins and customers, get overall stats
      const { data, error } = await supabase
        .from('tickets')
        .select('status');

      if (error) throw error;

      const stats = data.reduce((acc, ticket) => {
        acc.total_tickets++;
        if (ticket.status === 'open') acc.open_tickets++;
        if (ticket.status === 'in_progress') acc.in_progress_tickets++;
        if (ticket.status === 'closed') acc.resolved_tickets++;
        return acc;
      }, { total_tickets: 0, open_tickets: 0, in_progress_tickets: 0, resolved_tickets: 0 });

      return stats;
    },
  });

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role as UserRole);
        }
      }
    };

    fetchUserRole();
  }, []);

  const stats = {
    totalTickets: ticketMetrics?.total_tickets || 0,
    openTickets: ticketMetrics?.open_tickets || 0,
    inProgressTickets: ticketMetrics?.in_progress_tickets || 0,
    closedTickets: ticketMetrics?.resolved_tickets || 0,
  };

  const chartData = {
    openTickets: ticketMetrics?.open_tickets || 0,
    inProgressTickets: ticketMetrics?.in_progress_tickets || 0,
    closedTickets: ticketMetrics?.resolved_tickets || 0,
  };

  return (
    <div className="flex h-screen bg-zendesk-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <h1 className="text-2xl font-bold text-zendesk-secondary mb-6">
            Dashboard Overview
          </h1>
          
          <StatsCards stats={stats} />
          
          <div className="mt-6">
            <TicketChart data={chartData} />
          </div>

          {userRole === 'agent' && <AgentPerformance />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;