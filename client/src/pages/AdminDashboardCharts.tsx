import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-custom";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type AdminStats = {
  mrrHistory?: { name: string; mrr: number }[];
  signupsHistory?: { name: string; signups: number }[];
};

export default function AdminDashboardCharts({ stats }: { stats?: AdminStats }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <Card className="shadow-md border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">MRR ao Longo do Tempo</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.mrrHistory || []}>
              <defs>
                <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value.toLocaleString("pt-BR")}`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "MRR"]}
              />
              <Area type="monotone" dataKey="mrr" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-md border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Novos Cadastros por Mês</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.signupsHistory || []}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                formatter={(value: number) => [value, "Cadastros"]}
              />
              <Bar dataKey="signups" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
