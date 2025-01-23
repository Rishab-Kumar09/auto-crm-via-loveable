import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

const STATUS_COLORS = {
  "Open": "#ea384c",
  "In Progress": "#FFD700",
  "Closed": "#22c55e"
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
    { name: 'Open', value: data.openTickets },
    { name: 'In Progress', value: data.inProgressTickets },
    { name: 'Closed', value: data.closedTickets },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Status Distribution</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <ChartTooltip />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TicketChart;