import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

const STATUS_COLORS = {
  open: "#ea384c",
  in_progress: "#FFD700",
  closed: "#22c55e"
};

interface TicketChartProps {
  data: {
    openTickets: number;
    inProgressTickets: number;
    closedTickets: number;
  };
}

const TicketChart = ({ data }: TicketChartProps) => {
  const chartData = [
    { name: 'Open', value: data.openTickets, status: 'open' },
    { name: 'In Progress', value: data.inProgressTickets, status: 'in_progress' },
    { name: 'Closed', value: data.closedTickets, status: 'closed' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Status Distribution</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] p-4">
        <ChartContainer 
          className="w-full h-full"
          config={{
            open: { color: STATUS_COLORS.open },
            in_progress: { color: STATUS_COLORS.in_progress },
            closed: { color: STATUS_COLORS.closed }
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280' }}
                domain={[0, 'auto']}
              />
              <ChartTooltip />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                fill={STATUS_COLORS.open}
                fillOpacity={0.9}
                stroke="none"
                name={(entry) => {
                  const status = entry.status as keyof typeof STATUS_COLORS;
                  return status;
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default TicketChart;