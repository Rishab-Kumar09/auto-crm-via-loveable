import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRole } from "@/types/ticket";
import { BarChart as BarChartIcon, TicketIcon, Users, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

const STATUS_COLORS = {
  open: "#ea384c",      // Red for Open
  in_progress: "#FFD700", // Darker Yellow for In Progress
  closed: "#22c55e"     // Lighter Green for Closed (using Tailwind's green-500)
};

const Dashboard = () => {
  const [userRole, setUserRole] = useState<UserRole>("customer");
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    closedTickets: 0,
    averageResponseTime: "N/A",
  });

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, company_id')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role as UserRole);
          fetchStats(profile.role as UserRole, user.id, profile.company_id);
        }
      }
    };

    fetchUserRole();
  }, []);

  const fetchStats = async (role: UserRole, userId: string, companyId: string | null) => {
    try {
      let query = supabase.from('tickets').select('status, created_at, updated_at');

      switch (role) {
        case 'customer':
          query = query.eq('customer_id', userId);
          break;
        case 'agent':
          query = query.eq('assignee_id', userId);
          break;
        case 'admin':
          if (companyId) {
            query = query.eq('company_id', companyId);
          }
          break;
      }

      const { data: tickets, error } = await query;
      
      if (error) {
        console.error('Error fetching tickets:', error);
        return;
      }

      // Count tickets by status
      const counts = (tickets || []).reduce((acc, ticket) => {
        const status = ticket.status || 'open';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate average response time (time between created_at and first update)
      const responseTimes = tickets?.filter(t => t.updated_at && t.created_at)
        .map(t => new Date(t.updated_at).getTime() - new Date(t.created_at).getTime());
      
      const avgResponseTime = responseTimes?.length 
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / (1000 * 60 * 60)) // Convert to hours
        : null;

      setStats({
        totalTickets: tickets?.length || 0,
        openTickets: counts['open'] || 0,
        inProgressTickets: counts['in_progress'] || 0,
        closedTickets: counts['closed'] || 0,
        averageResponseTime: avgResponseTime ? `${avgResponseTime} hours` : "N/A",
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Set up real-time subscription for ticket changes
  useEffect(() => {
    const channel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        async (payload) => {
          console.log('Ticket change detected:', payload);
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role, company_id')
              .eq('id', user.id)
              .single();
            
            if (profile) {
              fetchStats(profile.role as UserRole, user.id, profile.company_id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex h-screen bg-zendesk-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <h1 className="text-2xl font-bold text-zendesk-secondary mb-6">
            Dashboard Overview
          </h1>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Tickets
                </CardTitle>
                <TicketIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTickets}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Open Tickets
                </CardTitle>
                <BarChartIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.openTickets}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Agents
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.inProgressTickets}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Response Time
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageResponseTime}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Ticket Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ChartContainer
                config={{
                  bar1: { theme: { light: STATUS_COLORS.open, dark: STATUS_COLORS.open } },
                  bar2: { theme: { light: STATUS_COLORS.in_progress, dark: STATUS_COLORS.in_progress } },
                  bar3: { theme: { light: STATUS_COLORS.closed, dark: STATUS_COLORS.closed } },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Open', value: stats.openTickets },
                    { name: 'In Progress', value: stats.inProgressTickets },
                    { name: 'Closed', value: stats.closedTickets },
                  ]}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload) return null;
                        const value = payload[0]?.value;
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Status
                                </span>
                                <span className="font-bold text-muted-foreground">
                                  {payload[0].payload.name}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Count
                                </span>
                                <span className="font-bold">
                                  {typeof value === 'number' ? value : 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;