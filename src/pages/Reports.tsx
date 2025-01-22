import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

const Reports = () => {
  const [ticketStats, setTicketStats] = useState<any>({
    byStatus: [],
    byPriority: [],
    responseTime: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch tickets data
        const { data: tickets } = await supabase
          .from('tickets')
          .select('status, priority, created_at, updated_at');

        if (tickets) {
          // Process status stats
          const statusCounts = tickets.reduce((acc: any, ticket) => {
            const status = ticket.status || 'unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {});

          // Process priority stats
          const priorityCounts = tickets.reduce((acc: any, ticket) => {
            const priority = ticket.priority || 'unknown';
            acc[priority] = (acc[priority] || 0) + 1;
            return acc;
          }, {});

          // Calculate average response time
          const responseTimes = tickets
            .filter((t: any) => t.updated_at && t.created_at)
            .map((t: any) => new Date(t.updated_at).getTime() - new Date(t.created_at).getTime());

          const avgResponseTime = responseTimes.length
            ? Math.round(responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length / (1000 * 60 * 60))
            : 0;

          setTicketStats({
            byStatus: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
            byPriority: Object.entries(priorityCounts).map(([name, value]) => ({ name, value })),
            responseTime: `${avgResponseTime} hours`
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="flex h-screen bg-zendesk-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <h1 className="text-2xl font-bold text-zendesk-secondary mb-6">
            Reports
          </h1>
          
          {loading ? (
            <div>Loading reports...</div>
          ) : (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tickets by Status</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ChartContainer className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ticketStats.byStatus}>
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <ChartTooltip />
                        <Bar dataKey="value" fill="#4f46e5" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tickets by Priority</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ChartContainer className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ticketStats.byPriority}>
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <ChartTooltip />
                        <Bar dataKey="value" fill="#22c55e" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Average Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{ticketStats.responseTime}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Reports;