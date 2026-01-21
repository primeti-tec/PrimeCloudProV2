import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useAccount, useMyAccounts } from "@/hooks/use-accounts";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui-custom";
import { useLocation } from "wouter";
import { Loader2, HardDrive, ArrowUpRight, Activity, Users, DollarSign, Plus, Key, UserPlus, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { NotificationsBell } from "@/components/NotificationsBell";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useBuckets } from "@/hooks/use-buckets";
import { useMembers } from "@/hooks/use-members";
import { useUsageSummary } from "@/hooks/use-billing";

const data = [
  { name: 'Jan', storage: 10, transfer: 24 },
  { name: 'Fev', storage: 15, transfer: 35 },
  { name: 'Mar', storage: 25, transfer: 45 },
  { name: 'Abr', storage: 35, transfer: 60 },
  { name: 'Mai', storage: 45, transfer: 55 },
  { name: 'Jun', storage: 60, transfer: 80 },
  { name: 'Jul', storage: 75, transfer: 95 },
];

export default function Dashboard() {
  const { data: accounts, isLoading: accountsLoading } = useMyAccounts();
  const [, setLocation] = useLocation();
  const currentAccount = accounts?.[0];
  const { data: accountDetails, isLoading: detailsLoading } = useAccount(currentAccount?.id);

  // Real Data Hooks
  const { data: usage, isLoading: usageLoading } = useUsageSummary(currentAccount?.id);
  const { data: buckets } = useBuckets(currentAccount?.id);
  const { data: members } = useMembers(currentAccount?.id);

  useEffect(() => {
    if (!accountsLoading && accounts && accounts.length === 0) {
      setLocation("/create-account");
    }
  }, [accountsLoading, accounts, setLocation]);

  if (accountsLoading || detailsLoading || usageLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  if (!currentAccount) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  const storageQuota = accountDetails?.subscription?.product?.storageLimit || 100;
  const transferQuota = accountDetails?.subscription?.product?.transferLimit || 500;

  const storagePercentage = ((usage?.storageUsedGB || 0) / storageQuota) * 100;
  // Bandwidth calculation might be missing in UsageSummary if not fully implemented in backend yet, defaulting to 0 for safety
  const bandwidthPercentage = ((usage?.bandwidthUsedGB || 0) / transferQuota) * 100;

  const totalEstimatedCost = usage?.projectedCost || 0;

  const showCriticalBanner = storagePercentage > 95;
  const showWarningBanner = storagePercentage > 80 && storagePercentage <= 95;

  const storageCostPerGB = 0.15; // R$ per GB
  const bandwidthCostPerGB = 0.40; // R$ per GB

  const storageCost = (usage?.storageUsedGB || 0) * storageCostPerGB;
  const bandwidthCost = (usage?.bandwidthUsedGB || 0) * bandwidthCostPerGB;
  // Use projectedCost from backend if available, otherwise sum manually
  const displayTotalCost = usage?.projectedCost || (storageCost + bandwidthCost);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-72 p-8 overflow-y-auto">
        <header className="flex justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral de <span className="font-semibold text-foreground">{currentAccount?.name}</span></p>
          </div>
          <div className="flex items-center gap-4">
            {currentAccount && <NotificationsBell accountId={currentAccount.id} />}
            <Button variant="outline" data-testid="button-view-docs">Documentação</Button>
            <Button data-testid="button-create-bucket-header">Criar Bucket</Button>
          </div>
        </header>

        {showCriticalBanner && (
          <Alert className="mb-6 border-red-500 bg-red-50 dark:bg-red-950/30" data-testid="alert-storage-critical">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800 dark:text-red-400">Crítico: Limite de Armazenamento Quase Atingido</AlertTitle>
            <AlertDescription className="flex justify-between items-center gap-4">
              <span className="text-red-700 dark:text-red-300">Você usou {storagePercentage.toFixed(0)}% da sua quota de armazenamento. Faça upgrade agora para evitar interrupções.</span>
              <Button size="sm" className="bg-red-600 hover-elevate" onClick={() => setLocation("/dashboard/billing")} data-testid="button-upgrade-critical">
                Fazer Upgrade
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {showWarningBanner && (
          <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30" data-testid="alert-storage-warning">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-400">Aviso: Uso de Armazenamento Alto</AlertTitle>
            <AlertDescription className="flex justify-between items-center gap-4">
              <span className="text-yellow-700 dark:text-yellow-300">Você usou {storagePercentage.toFixed(0)}% da sua quota de armazenamento. Considere fazer upgrade do seu plano.</span>
              <Button size="sm" variant="outline" className="border-yellow-600 text-yellow-700" onClick={() => setLocation("/dashboard/billing")} data-testid="button-upgrade-warning">
                Fazer Upgrade
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCardWithProgress
            title="Armazenamento"
            usedValue={usage?.storageUsedGB || 0}
            totalValue={storageQuota}
            unit="GB"
            icon={HardDrive}
            trend={null} // Removed hardcoded trend
            color="text-blue-500"
            bgColor="bg-blue-500/10"
            progressColor="bg-blue-500"
          />
          <StatCardWithProgress
            title="Bandwidth"
            usedValue={usage?.bandwidthUsedGB || 0}
            totalValue={transferQuota}
            unit="GB"
            icon={Activity}
            trend={null}
            color="text-green-500"
            bgColor="bg-green-500/10"
            progressColor="bg-green-500"
          />
          <StatCard
            title="Buckets Ativos"
            value={buckets?.length || 0}
            subtitle={`em ${usage?.apiRequestsCount ? 'uso ativo' : 'repouso'}`}
            icon={ArrowUpRight}
            color="text-orange-500"
            bgColor="bg-orange-500/10"
          />
          <StatCard
            title="Membros da Equipe"
            value={members?.length || 0}
            subtitle="usuários ativos"
            icon={Users}
            color="text-purple-500"
            bgColor="bg-purple-500/10"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-md border-border/60" data-testid="card-estimated-cost">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-lg">Custo Estimado</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="text-3xl font-bold text-foreground">R$ {displayTotalCost.toFixed(2)}</h3>
                <p className="text-sm text-muted-foreground">Estimativa do mês atual</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Armazenamento ({usage?.storageUsedGB || 0} GB x R$ {storageCostPerGB})</span>
                  <span className="font-medium">R$ {storageCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Bandwidth ({usage?.bandwidthUsedGB || 0} GB x R$ {bandwidthCostPerGB})</span>
                  <span className="font-medium">R$ {bandwidthCost.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 shadow-md border-border/60" data-testid="card-quick-actions">
            <CardHeader>
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button className="flex items-center gap-2" onClick={() => setLocation("/dashboard/storage")} data-testid="button-create-bucket">
                  <Plus className="h-4 w-4" />
                  Criar Bucket
                </Button>
                <Button variant="outline" className="flex items-center gap-2" onClick={() => setLocation("/dashboard/api-keys")} data-testid="button-generate-api-key">
                  <Key className="h-4 w-4" />
                  Gerar Chave de API
                </Button>
                <Button variant="outline" className="flex items-center gap-2" onClick={() => setLocation("/dashboard/team")} data-testid="button-invite-team">
                  <UserPlus className="h-4 w-4" />
                  Convidar Membro
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="shadow-md border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">Crescimento de Armazenamento</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorStorage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6300FF" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6300FF" stopOpacity={0} />
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
              <CardTitle className="text-lg">Uso de Transferência</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plano Atual</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center gap-4">
            <div>
              <h4 className="text-xl font-bold mb-1">{accountDetails?.subscription?.product?.name || "Plano Gratuito"}</h4>
              <p className="text-muted-foreground">{accountDetails?.subscription?.product?.description || "Recursos básicos de armazenamento"}</p>
            </div>
            <Badge variant="default" className="text-sm px-4 py-1">Ativo</Badge>
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
          <h3 className="text-2xl font-bold text-foreground">{value}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardWithProgress({ title, usedValue, totalValue, unit, icon: Icon, trend, color, bgColor, progressColor }: any) {
  const percentage = (usedValue / totalValue) * 100;

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow" data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
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
          <h3 className="text-2xl font-bold text-foreground">{usedValue} {unit}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            de {totalValue} {unit} ({percentage.toFixed(0)}%)
          </p>
          <div className="mt-3">
            <Progress
              value={percentage}
              className="h-2 bg-slate-200"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
