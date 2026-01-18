import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useAccount, useMyAccounts } from "@/hooks/use-accounts";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui-custom";
import { useLocation } from "wouter";
import { Loader2, HardDrive, ArrowUpRight, Activity, Users } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { NotificationsBell } from "@/components/NotificationsBell";

// Mock Data for Charts
const data = [
  { name: 'Jan', storage: 10, transfer: 24 },
  { name: 'Feb', storage: 15, transfer: 35 },
  { name: 'Mar', storage: 25, transfer: 45 },
  { name: 'Apr', storage: 35, transfer: 60 },
  { name: 'May', storage: 45, transfer: 55 },
  { name: 'Jun', storage: 60, transfer: 80 },
  { name: 'Jul', storage: 75, transfer: 95 },
];

export default function Dashboard() {
  const { data: accounts, isLoading: accountsLoading } = useMyAccounts();
  const [, setLocation] = useLocation();
  const currentAccount = accounts?.[0];
  const { data: accountDetails, isLoading: detailsLoading } = useAccount(currentAccount?.id);

  // Redirect to setup if no accounts
  useEffect(() => {
    if (!accountsLoading && accounts && accounts.length === 0) {
      setLocation("/create-account");
    }
  }, [accountsLoading, accounts, setLocation]);

  if (accountsLoading || detailsLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  if (!currentAccount) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 ml-72 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900">Dashboard</h1>
            <p className="text-muted-foreground">Overview for <span className="font-semibold text-slate-900">{currentAccount?.name}</span></p>
          </div>
          <div className="flex items-center gap-4">
             {currentAccount && <NotificationsBell accountId={currentAccount.id} />}
             <Button variant="outline">View Documentation</Button>
             <Button>Create Bucket</Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Storage Used"
            value="75 GB"
            subtitle="of 1 TB Plan"
            icon={HardDrive}
            trend="+12%"
            color="text-blue-500"
            bgColor="bg-blue-500/10"
          />
          <StatCard
            title="Bandwidth"
            value="124 GB"
            subtitle="this month"
            icon={Activity}
            trend="+5%"
            color="text-green-500"
            bgColor="bg-green-500/10"
          />
          <StatCard
            title="Active Buckets"
            value="12"
            subtitle="across 3 regions"
            icon={ArrowUpRight}
            color="text-orange-500"
            bgColor="bg-orange-500/10"
          />
          <StatCard
            title="Team Members"
            value="8"
            subtitle="active users"
            icon={Users}
            color="text-purple-500"
            bgColor="bg-purple-500/10"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="shadow-md border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">Storage Growth</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorStorage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6300FF" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6300FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="storage" stroke="#6300FF" strokeWidth={3} fillOpacity={1} fill="url(#colorStorage)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="shadow-md border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">Transfer Usage</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Line type="monotone" dataKey="transfer" stroke="#10b981" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Info */}
        <Card>
          <CardHeader>
             <CardTitle className="text-lg">Current Plan</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
             <div>
                <h4 className="text-xl font-bold mb-1">{accountDetails?.subscription?.product?.name || "Free Plan"}</h4>
                <p className="text-muted-foreground">{accountDetails?.subscription?.product?.description || "Basic storage capabilities"}</p>
             </div>
             <Badge variant="default" className="text-sm px-4 py-1">Active</Badge>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, trend, color, bgColor }: any) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${bgColor}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          {trend && (
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
              {trend}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
