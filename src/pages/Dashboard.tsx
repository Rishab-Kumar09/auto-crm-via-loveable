import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRole } from "@/types/ticket";
import { BarChart as BarChartIcon, PieChart as PieChartIcon, TicketIcon, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

// Define consistent colors for ticket statuses
const STATUS_COLORS = {
  open: "#FEC6A1",      // Soft Orange for Open
  in_progress: "#F2FCE2", // Soft Green for In Progress
  closed: "#D3E4FD"     // Soft Blue for Closed
};

const COLORS = [STATUS_COLORS.open, STATUS_COLORS.in_progress, STATUS_COLORS.closed];

const Dashboard = () => {
  const [userRole, setUserRole] = useState<UserRole>("customer");
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    closedTickets: 0,
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
      let query = supabase.from('tickets').select('status');

      // Apply filters based on user role
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
        acc[status] = Math.round((acc[status] || 0) + 1); // Ensure whole numbers
        return acc;
      }, {} as Record<string, number>);

      setStats({
        totalTickets: Math.round(tickets?.length || 0),
        openTickets: Math.round(counts['open'] || 0),
        inProgressTickets: Math.round(counts['in_progress'] || 0),
        closedTickets: Math.round(counts['closed'] || 0),
      });

      console.log('Stats updated:', {
        total: tickets?.length || 0,
        counts,
        role,
        userId,
        companyId
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
            Dashboard
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
                  In Progress
                </CardTitle>
                <PieChartIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.inProgressTickets}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Closed Tickets
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.closedTickets}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
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
                      { name: 'Open', value: Math.round(stats.openTickets) },
                      { name: 'In Progress', value: Math.round(stats.inProgressTickets) },
                      { name: 'Closed', value: Math.round(stats.closedTickets) },
                    ]}>
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} /> {/* Force whole numbers on Y axis */}
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload) return null;
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
                                    {Math.round(payload[0].value)}
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
                      >
                        {[
                          { name: 'Open', value: stats.openTickets },
                          { name: 'In Progress', value: stats.inProgressTickets },
                          { name: 'Closed', value: stats.closedTickets },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ticket Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Open', value: Math.round(stats.openTickets) },
                        { name: 'In Progress', value: Math.round(stats.inProgressTickets) },
                        { name: 'Closed', value: Math.round(stats.closedTickets) },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Open', value: stats.openTickets },
                        { name: 'In Progress', value: stats.inProgressTickets },
                        { name: 'Closed', value: stats.closedTickets },
                      ].map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload) return null;
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Status
                                </span>
                                <span className="font-bold text-muted-foreground">
                                  {payload[0].name}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Count
                                </span>
                                <span className="font-bold">
                                  {Math.round(payload[0].value)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;