import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-custom";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useUsageHistory } from "@/hooks/use-billing";
import { useMyAccounts } from "@/hooks/use-accounts";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DashboardCharts() {
  const { data: accounts } = useMyAccounts();
  const accountId = accounts?.[0]?.id;
  const { data: history, isLoading } = useUsageHistory(accountId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Transform Data or use default if empty
  const chartData = history?.length
    ? history.map(record => ({
      name: format(new Date(record.recordedAt), "dd/MM", { locale: ptBR }),
      fullDate: format(new Date(record.recordedAt), "dd 'de' MMMM", { locale: ptBR }),
      storage: Number((record.storageBytes / (1024 * 1024 * 1024)).toFixed(2)),
      transfer: Number(((record.bandwidthIngress + record.bandwidthEgress) / (1024 * 1024 * 1024)).toFixed(2)),
    }))
    : Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        name: format(d, "dd/MM", { locale: ptBR }),
        fullDate: format(d, "dd 'de' MMMM", { locale: ptBR }),
        storage: 0,
        transfer: 0
      };
    });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <Card className="shadow-md border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Crescimento de Armazenamento</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorStorage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value} GB`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", border: "1px solid #334155", color: "#f8fafc" }}
                itemStyle={{ color: "#f8fafc" }}
                labelStyle={{ color: "#94a3b8", marginBottom: "0.5rem" }}
                formatter={(value: number) => [`${value} GB`, "Armazenamento"]}
                labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
              />
              <Area type="monotone" dataKey="storage" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorStorage)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-md border-border/60 bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-lg">Uso de Transferência</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value} GB`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", border: "1px solid #334155", color: "#f8fafc" }}
                itemStyle={{ color: "#f8fafc" }}
                labelStyle={{ color: "#94a3b8", marginBottom: "0.5rem" }}
                cursor={{ stroke: '#2dd4bf', strokeWidth: 2, opacity: 0.5 }}
                formatter={(value: number) => [`${value} GB`, "Transferência"]}
                labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
              />
              <Line
                type="monotone"
                dataKey="transfer"
                stroke="#2dd4bf"
                strokeWidth={3}
                dot={{ stroke: '#2dd4bf', strokeWidth: 2, r: 4, fill: '#0f172a' }}
                activeDot={{ r: 7, strokeWidth: 0, fill: '#2dd4bf' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
