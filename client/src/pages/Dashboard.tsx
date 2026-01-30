import { Suspense, lazy, useEffect, useState, type ComponentType } from "react";
// import { Sidebar } from "@/components/Sidebar"; // Removed as it's now in Layout
// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // Removed
import DashboardLayout from "@/components/layout/DashboardLayout";
import { TopNavigation } from "@/components/TopNavigation";
import { useAccount, useMyAccounts } from "@/hooks/use-accounts";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui-custom";
import { useLocation } from "wouter";
import { Loader2, HardDrive, ArrowUpRight, Activity, Users, DollarSign, Plus, Key, UserPlus, AlertTriangle, Menu, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useBuckets } from "@/hooks/use-buckets";
import { useMembers } from "@/hooks/use-members";
import { useUsageSummary } from "@/hooks/use-billing";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const DashboardCharts = lazy(() => import("@/pages/DashboardCharts"));

export default function Dashboard() {
  const { data: accounts, isLoading: accountsLoading } = useMyAccounts();
  const [, setLocation] = useLocation();
  const currentAccount = accounts?.[0];
  const { data: accountDetails, isLoading: detailsLoading } = useAccount(currentAccount?.id);
  const [showAlerts, setShowAlerts] = useState(false);

  // Real Data Hooks
  const { data: usage, isLoading: usageLoading } = useUsageSummary(currentAccount?.id);
  const { data: buckets } = useBuckets(currentAccount?.id);
  const { data: members } = useMembers(currentAccount?.id);

  useEffect(() => {
    if (!accountsLoading && accounts && accounts.length === 0) {
      // Check for pending invite token before redirecting to create account
      const pendingToken = sessionStorage.getItem('pending_invite_token');
      if (pendingToken) {
        setLocation(`/invite/${pendingToken}`);
      } else {
        setLocation("/create-account");
      }
    }
  }, [accountsLoading, accounts, setLocation]);

  useEffect(() => {
    const id = window.setTimeout(() => setShowAlerts(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  if (accountsLoading || detailsLoading || usageLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  if (!currentAccount) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  const storageQuota = accountDetails?.subscription?.product?.storageLimit || 100;
  const transferQuota = accountDetails?.subscription?.product?.transferLimit || 500;

  const storagePercentage = storageQuota > 0 ? ((usage?.storageUsedGB || 0) / storageQuota) * 100 : 0;
  // Bandwidth calculation might be missing in UsageSummary if not fully implemented in backend yet, defaulting to 0 for safety
  const bandwidthPercentage = transferQuota > 0 ? ((usage?.bandwidthUsedGB || 0) / transferQuota) * 100 : 0;

  const totalEstimatedCost = usage?.projectedCost || 0;

  const showCriticalBanner = storagePercentage > 95;
  const showWarningBanner = storagePercentage > 80 && storagePercentage <= 95;

  // Calculate dynamic costs based on product settings or defaults
  // Convert cents to R$ (divide by 100)
  const storageCostPerGB = (usage?.pricePerStorageGB ?? 15) / 100;
  const bandwidthCostPerGB = (usage?.pricePerTransferGB ?? 40) / 100;

  // Calculate costs on EXCESS usage only (Overage)
  const includedStorage = usage?.contractedStorageGB || storageQuota;
  const includedTransfer = transferQuota; // Backend defaults to 500 if null, matches here

  const excessStorage = Math.max(0, (usage?.storageUsedGB || 0) - includedStorage);
  const excessBandwidth = Math.max(0, (usage?.bandwidthUsedGB || 0) - includedTransfer);

  const storageCost = excessStorage * storageCostPerGB;
  const bandwidthCost = excessBandwidth * bandwidthCostPerGB;
  const backupLicenseCost = (usage?.backupLicenseCostCents || 0) / 100;

  // Convert projectedCost from cents to R$
  const displayTotalCost = (usage?.projectedCost || 0) / 100;

  // Calculate base plan cost as the difference between total and usage costs
  // This ensures the sum displayed below matches the big number
  const basePlanCost = Math.max(0, displayTotalCost - (storageCost + bandwidthCost + backupLicenseCost));

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 w-full">
        <header className="flex justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground hidden sm:block">Visão geral de <span className="font-semibold text-foreground">{currentAccount?.name}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <TopNavigation />
            <Button onClick={() => setLocation("/dashboard/storage")} data-testid="button-create-bucket-header" size="sm" className="w-9 h-9 sm:w-auto sm:h-10 px-0 sm:px-4">
              <Plus className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">Criar Bucket</span>
            </Button>
          </div>
        </header>

        {showAlerts && showCriticalBanner && (
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

        {showAlerts && showWarningBanner && (
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
            totalValue={usage?.contractedStorageGB || storageQuota}
            unit="GB"
            icon={HardDrive}
            trend={null} // Removed hardcoded trend
            color="text-blue-500"
            bgColor="bg-blue-500/10"
            progressColor="bg-blue-500"
            footerText={usage?.contractedStorageGB ? `de ${usage.contractedStorageGB} GB Contratados` : undefined}
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
          <Card className="shadow-lg border-primary/20 bg-gradient-to-br from-card to-card/50 relative overflow-hidden group" data-testid="card-estimated-cost">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign className="h-24 w-24 -mr-4 -mt-4 text-primary" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custo Estimado</CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <DollarSign className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">
                {formatCurrency(displayTotalCost)}
              </div>
              <p className="text-xs text-muted-foreground mb-4">Estimativa do mês atual</p>

              <div className="space-y-2 pt-4 border-t border-border/50">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Plano: {usage?.productName || "Standard"}</span>
                  <span className="font-medium">{formatCurrency(basePlanCost)}</span>
                </div>
                {backupLicenseCost > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Licença Imperius ({usage?.imperiusLicenseCount || 0})</span>
                    <span className="font-medium text-primary">{formatCurrency(backupLicenseCost)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Armazenamento ({usage?.storageUsedGB || 0} GB)</span>
                  <span className={cn("font-medium", storageCost > 0 ? "text-primary" : "")}>
                    {formatCurrency(storageCost)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Bandwidth ({usage?.bandwidthUsedGB || 0} GB)</span>
                  <span className={cn("font-medium", bandwidthCost > 0 ? "text-primary" : "")}>
                    {formatCurrency(bandwidthCost)}
                  </span>
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
                <Button variant="outline" className="flex items-center gap-2" onClick={() => setLocation("/dashboard/billing")} data-testid="button-view-invoices">
                  <FileText className="h-4 w-4" />
                  Faturas
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Suspense
          fallback={
            <div className="h-80 w-full flex items-center justify-center">
              <Loader2 className="animate-spin h-6 w-6 text-primary" />
            </div>
          }
        >
          <DashboardCharts />
        </Suspense>

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
      </div>
    </DashboardLayout>
  );
}

type StatCardProps = {
  title: string;
  value: number;
  subtitle?: string;
  icon: ComponentType<{ className?: string }>;
  trend?: string | null;
  color: string;
  bgColor: string;
};

type StatCardWithProgressProps = {
  title: string;
  usedValue: number;
  totalValue: number;
  unit: string;
  icon: ComponentType<{ className?: string }>;
  trend?: string | null;
  color: string;
  bgColor: string;
  progressColor: string;
  footerText?: string;
};

function StatCard({ title, value, subtitle, icon: Icon, trend, color, bgColor }: StatCardProps) {
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

function StatCardWithProgress({ title, usedValue, totalValue, unit, icon: Icon, trend, color, bgColor, progressColor }: StatCardWithProgressProps) {
  const safeUsed = Math.max(0, usedValue);
  const safeTotal = totalValue > 0 ? totalValue : 0;
  const percentage = safeTotal ? (safeUsed / safeTotal) * 100 : 0;
  const totalLabel = safeTotal ? `${safeTotal} ${unit}` : "—";
  const percentageLabel = safeTotal ? `${percentage.toFixed(0)}%` : "—";

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
            de {totalLabel} ({percentageLabel})
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
