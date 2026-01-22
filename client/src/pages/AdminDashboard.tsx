import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useAdminAccounts, useApproveAccount, useRejectAccount, useSuspendAccount, useReactivateAccount, useAdjustQuota, useAdminStats } from "@/hooks/use-admin";
import { usePendingQuotaRequests, useApproveQuotaRequest, useRejectQuotaRequest } from "@/hooks/use-quota-requests";
import { useAdminProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/use-products";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui-custom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, CheckCircle, Clock, Users, DollarSign, Building2, AlertCircle, XCircle, Pause, Play, Settings2, HardDrive, TrendingDown, Target, UserPlus, Wallet, FileUp, Package, Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { Account, QuotaRequest, Product } from "@shared/schema";
import { PricingManager } from "@/components/admin/PricingManager";



export default function AdminDashboard() {
  const { data: accounts, isLoading } = useAdminAccounts();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: products, isLoading: productsLoading } = useAdminProducts();
  const { mutate: approve, isPending: isApproving } = useApproveAccount();
  const { mutate: reject, isPending: isRejecting } = useRejectAccount();
  const { mutate: suspend, isPending: isSuspending } = useSuspendAccount();
  const { mutate: reactivate, isPending: isReactivating } = useReactivateAccount();
  const { mutate: adjustQuota, isPending: isAdjustingQuota } = useAdjustQuota();
  const { mutate: createProduct, isPending: isCreatingProduct } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdatingProduct } = useUpdateProduct();
  const { mutate: deleteProduct, isPending: isDeletingProduct } = useDeleteProduct();
  const { toast } = useToast();

  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [newQuotaGB, setNewQuotaGB] = useState("");
  const [quotaReason, setQuotaReason] = useState("");

  // Quota requests
  const { data: pendingQuotaRequests, isLoading: quotaRequestsLoading } = usePendingQuotaRequests();
  const { mutate: approveQuotaRequest, isPending: isApprovingQuota } = useApproveQuotaRequest();
  const { mutate: rejectQuotaRequest, isPending: isRejectingQuota } = useRejectQuotaRequest();
  const [quotaReviewDialogOpen, setQuotaReviewDialogOpen] = useState(false);
  const [selectedQuotaRequest, setSelectedQuotaRequest] = useState<(QuotaRequest & { account: Account }) | null>(null);
  const [quotaReviewNote, setQuotaReviewNote] = useState("");
  const [quotaReviewAction, setQuotaReviewAction] = useState<'approve' | 'reject'>('approve');

  // Products management
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: 0,
    pricePerStorageGB: 15,
    pricePerTransferGB: 40,
    storageLimit: 100,
    transferLimit: 0,
    isPublic: true,
  });

  const pendingAccounts = accounts?.filter(a => a.status === 'pending') || [];
  const activeAccounts = accounts?.filter(a => a.status === 'active') || [];
  const suspendedAccounts = accounts?.filter(a => a.status === 'suspended') || [];
  const totalAccounts = accounts?.length || 0;

  const handleApprove = (accountId: number, accountName: string) => {
    approve(accountId, {
      onSuccess: () => {
        toast({ title: "Conta Aprovada", description: `${accountName} agora está ativa.` });
      },
    });
  };

  const handleReject = (accountId: number, accountName: string) => {
    if (confirm(`Tem certeza que deseja rejeitar "${accountName}"?`)) {
      reject({ id: accountId }, {
        onSuccess: () => {
          toast({ title: "Conta Rejeitada", description: `${accountName} foi rejeitada.`, variant: "destructive" });
        },
      });
    }
  };

  const handleSuspend = (accountId: number, accountName: string) => {
    if (confirm(`Tem certeza que deseja suspender "${accountName}"?`)) {
      suspend({ id: accountId }, {
        onSuccess: () => {
          toast({ title: "Conta Suspensa", description: `${accountName} foi suspensa.`, variant: "destructive" });
        },
      });
    }
  };

  const handleReactivate = (accountId: number, accountName: string) => {
    reactivate(accountId, {
      onSuccess: () => {
        toast({ title: "Conta Reativada", description: `${accountName} está ativa novamente.` });
      },
    });
  };

  const openQuotaDialog = (account: Account) => {
    setSelectedAccount(account);
    setNewQuotaGB(String(account.storageQuotaGB || 100));
    setQuotaReason("");
    setQuotaDialogOpen(true);
  };

  const handleAdjustQuota = () => {
    if (!selectedAccount || !newQuotaGB || !quotaReason.trim()) {
      toast({ title: "Erro", description: "Por favor, preencha todos os campos.", variant: "destructive" });
      return;
    }
    const quotaValue = parseInt(newQuotaGB);
    if (isNaN(quotaValue) || quotaValue < 1) {
      toast({ title: "Erro", description: "A quota deve ser um número positivo.", variant: "destructive" });
      return;
    }
    adjustQuota({ id: selectedAccount.id, quotaGB: quotaValue, reason: quotaReason.trim() }, {
      onSuccess: () => {
        toast({ title: "Quota Ajustada", description: `Quota de ${selectedAccount.name} atualizada para ${quotaValue} GB.` });
        setQuotaDialogOpen(false);
        setSelectedAccount(null);
      },
    });
  };

  const formatBytes = (bytes: number | null | undefined) => {
    if (!bytes || bytes === 0) return "0 GB";
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb < 0.01 && bytes > 0) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${gb.toFixed(2)} GB`;
  };

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const openProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description || "",
        price: product.price,
        pricePerStorageGB: product.pricePerStorageGB || 15,
        pricePerTransferGB: product.pricePerTransferGB || 40,
        storageLimit: product.storageLimit,
        transferLimit: product.transferLimit || 0,
        isPublic: product.isPublic ?? true,
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: "",
        description: "",
        price: 0,
        pricePerStorageGB: 15,
        pricePerTransferGB: 40,
        storageLimit: 100,
        transferLimit: 0,
        isPublic: true,
      });
    }
    setProductDialogOpen(true);
  };

  const handleSaveProduct = () => {
    if (!productForm.name.trim()) {
      toast({ title: "Erro", description: "O nome do produto é obrigatório.", variant: "destructive" });
      return;
    }
    if (productForm.storageLimit < 1) {
      toast({ title: "Erro", description: "O limite de armazenamento deve ser de pelo menos 1 GB.", variant: "destructive" });
      return;
    }

    const productData = {
      name: productForm.name.trim(),
      description: productForm.description.trim() || undefined,
      price: productForm.price,
      pricePerStorageGB: productForm.pricePerStorageGB,
      pricePerTransferGB: productForm.pricePerTransferGB,
      storageLimit: productForm.storageLimit,
      transferLimit: productForm.transferLimit || undefined,
      isPublic: productForm.isPublic,
    };

    if (editingProduct) {
      updateProduct({ id: editingProduct.id, data: productData }, {
        onSuccess: () => {
          toast({ title: "Produto Atualizado", description: `${productForm.name} foi atualizado.` });
          setProductDialogOpen(false);
        },
      });
    } else {
      createProduct(productData, {
        onSuccess: () => {
          toast({ title: "Produto Criado", description: `${productForm.name} foi criado.` });
          setProductDialogOpen(false);
        },
      });
    }
  };

  const handleDeleteProduct = (product: Product) => {
    if (confirm(`Tem certeza que deseja excluir "${product.name}"? Esta ação não pode ser desfeita.`)) {
      deleteProduct(product.id, {
        onSuccess: () => {
          toast({ title: "Produto Excluído", description: `${product.name} foi excluído.`, variant: "destructive" });
        },
      });
    }
  };

  const openQuotaReviewDialog = (request: (QuotaRequest & { account: Account }), action: 'approve' | 'reject') => {
    setSelectedQuotaRequest(request);
    setQuotaReviewAction(action);
    setQuotaReviewNote("");
    setQuotaReviewDialogOpen(true);
  };

  const handleQuotaReview = () => {
    if (!selectedQuotaRequest) return;

    if (quotaReviewAction === 'approve') {
      approveQuotaRequest({ id: selectedQuotaRequest.id, note: quotaReviewNote || undefined }, {
        onSuccess: () => {
          toast({ title: "Solicitação de Quota Aprovada", description: `Quota de ${selectedQuotaRequest.account.name} aumentada para ${selectedQuotaRequest.requestedQuotaGB} GB.` });
          setQuotaReviewDialogOpen(false);
        },
      });
    } else {
      rejectQuotaRequest({ id: selectedQuotaRequest.id, note: quotaReviewNote || undefined }, {
        onSuccess: () => {
          toast({ title: "Solicitação de Quota Rejeitada", description: `Solicitação de ${selectedQuotaRequest.account.name} foi rejeitada.`, variant: "destructive" });
          setQuotaReviewDialogOpen(false);
        },
      });
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Ativo',
      suspended: 'Suspenso',
      rejected: 'Rejeitado',
      pending: 'Pendente',
    };
    return labels[status] || status;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-72 p-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="destructive" data-testid="badge-admin">Super Admin</Badge>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground" data-testid="text-page-title">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerencie contas e visualize métricas da plataforma.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total de Contas</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-foreground" data-testid="text-total-accounts">{totalAccounts}</h3>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <Building2 className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Contas Ativas</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-foreground" data-testid="text-active-accounts">{activeAccounts.length}</h3>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-yellow-500/10">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Aguardando Aprovação</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-foreground" data-testid="text-pending-accounts">{pendingAccounts.length}</h3>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">MRR Atual</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-foreground" data-testid="text-mrr">
                {formatCurrency(stats?.totalMrr || 0)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Soma dos planos base</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-teal-500/10">
                  <TrendingDown className="h-6 w-6 text-teal-500" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Receita Projetada</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-foreground" data-testid="text-projected-revenue">
                {formatCurrency(stats?.projectedRevenue || 0)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Base + Uso excedente</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-red-500/10">
                  <TrendingDown className="h-6 w-6 text-red-500" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Taxa de Churn</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-foreground" data-testid="text-churn-rate">
                {stats && stats.totalAccounts > 0 ? ((stats.suspendedAccounts / stats.totalAccounts) * 100).toFixed(1) : 0}%
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Últimos 30 dias</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-orange-500/10">
                  <Target className="h-6 w-6 text-orange-500" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">CAC</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-foreground" data-testid="text-cac">R$ 225</h3>
              <p className="text-xs text-muted-foreground mt-1">Custo de Aquisição</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <Wallet className="h-6 w-6 text-purple-500" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">LTV</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-foreground" data-testid="text-ltv">R$ 5.940</h3>
              <p className="text-xs text-muted-foreground mt-1">Valor Vitalício</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-teal-500/10">
                  <DollarSign className="h-6 w-6 text-teal-500" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">ARPU</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-foreground" data-testid="text-arpu">
                {formatCurrency(stats && stats.activeAccounts > 0 ? Math.round(stats.totalMrr / stats.activeAccounts) : 0)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Receita Média por Usuário</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-indigo-500/10">
                  <UserPlus className="h-6 w-6 text-indigo-500" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Novos Cadastros</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-foreground" data-testid="text-new-signups">
                {stats?.newSignupsThisMonth || 0}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Este mês</p>
            </CardContent>
          </Card>
        </div>

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
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'MRR']}
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
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [value, 'Cadastros']}
                  />
                  <Bar dataKey="signups" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Pending Quota Requests Section */}
        {(pendingQuotaRequests && pendingQuotaRequests.length > 0) && (
          <Card className="mb-8 border-purple-200 dark:border-purple-900 bg-purple-50/30 dark:bg-purple-950/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileUp className="h-5 w-5 text-purple-600 dark:text-purple-500" />
                Solicitações de Quota ({pendingQuotaRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-purple-100/50 dark:bg-purple-900/30 border-b border-purple-200 dark:border-purple-800">
                  <tr>
                    <th className="text-left p-4 pl-6 text-sm font-medium text-purple-800 dark:text-purple-200">Conta</th>
                    <th className="text-left p-4 text-sm font-medium text-purple-800 dark:text-purple-200">Atual</th>
                    <th className="text-left p-4 text-sm font-medium text-purple-800 dark:text-purple-200">Solicitado</th>
                    <th className="text-left p-4 text-sm font-medium text-purple-800 dark:text-purple-200">Motivo</th>
                    <th className="text-left p-4 text-sm font-medium text-purple-800 dark:text-purple-200">Data</th>
                    <th className="text-right p-4 pr-6 text-sm font-medium text-purple-800 dark:text-purple-200">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100 dark:divide-purple-800">
                  {pendingQuotaRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-colors" data-testid={`row-quota-request-${request.id}`}>
                      <td className="p-4 pl-6">
                        <span className="font-medium text-slate-900 dark:text-foreground">{request.account.name}</span>
                      </td>
                      <td className="p-4 text-sm">{request.currentQuotaGB} GB</td>
                      <td className="p-4 text-sm font-medium text-purple-600">{request.requestedQuotaGB} GB</td>
                      <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">{request.reason || '-'}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {request.createdAt ? new Date(request.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => openQuotaReviewDialog(request, 'approve')}
                            disabled={isApprovingQuota || isRejectingQuota}
                            data-testid={`button-approve-quota-${request.id}`}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" /> Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/30"
                            onClick={() => openQuotaReviewDialog(request, 'reject')}
                            disabled={isApprovingQuota || isRejectingQuota}
                            data-testid={`button-reject-quota-${request.id}`}
                          >
                            <XCircle className="mr-1 h-4 w-4" /> Rejeitar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {pendingAccounts.length > 0 && (
          <Card className="mb-8 border-yellow-200 dark:border-yellow-900 bg-yellow-50/30 dark:bg-yellow-950/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                Aguardando Aprovação ({pendingAccounts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-yellow-100/50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800">
                  <tr>
                    <th className="text-left p-4 pl-6 text-sm font-medium text-yellow-800 dark:text-yellow-200">Nome da Conta</th>
                    <th className="text-left p-4 text-sm font-medium text-yellow-800 dark:text-yellow-200">Documento</th>
                    <th className="text-left p-4 text-sm font-medium text-yellow-800 dark:text-yellow-200">Solicitado em</th>
                    <th className="text-right p-4 pr-6 text-sm font-medium text-yellow-800 dark:text-yellow-200">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-100 dark:divide-yellow-800">
                  {pendingAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-yellow-50/50 dark:hover:bg-yellow-900/20 transition-colors" data-testid={`row-pending-${account.id}`}>
                      <td className="p-4 pl-6">
                        <span className="font-medium text-slate-900 dark:text-foreground">{account.name}</span>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-muted-foreground">
                        {account.document ? `${account.documentType?.toUpperCase()}: ${account.document}` : 'Não informado'}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {account.createdAt ? new Date(account.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(account.id, account.name)}
                            disabled={isApproving}
                            data-testid={`button-approve-${account.id}`}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" /> Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/30"
                            onClick={() => handleReject(account.id, account.name)}
                            disabled={isRejecting}
                            data-testid={`button-reject-${account.id}`}
                          >
                            <XCircle className="mr-1 h-4 w-4" /> Rejeitar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-green-600" />
              Contas Ativas ({activeAccounts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : activeAccounts.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Nenhuma conta ativa ainda.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-4 pl-6 text-sm font-medium text-muted-foreground">Conta</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Documento</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Uso de Armazenamento</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Quota</th>
                    <th className="text-right p-4 pr-6 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {activeAccounts.map((account) => {
                    const usagePercent = account.storageQuotaGB ? ((account.storageUsed || 0) / (account.storageQuotaGB * 1024 * 1024 * 1024)) * 100 : 0;
                    return (
                      <tr key={account.id} className="hover:bg-slate-50/50 dark:hover:bg-muted/30 transition-colors" data-testid={`row-active-${account.id}`}>
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                              {account.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{account.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-muted-foreground">
                          {account.document ? (
                            <span className="font-mono text-xs">{account.documentType?.toUpperCase()}: {account.document}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{formatBytes(account.storageUsed)}</span>
                            {usagePercent > 80 && (
                              <Badge variant="destructive" className="text-xs">Alto</Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-sm">
                          <span className="font-medium">{account.storageQuotaGB || 100} GB</span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openQuotaDialog(account)}
                              data-testid={`button-quota-${account.id}`}
                            >
                              <Settings2 className="mr-1 h-4 w-4" /> Quota
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/30"
                              onClick={() => handleSuspend(account.id, account.name)}
                              disabled={isSuspending}
                              data-testid={`button-suspend-${account.id}`}
                            >
                              <Pause className="mr-1 h-4 w-4" /> Suspender
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {suspendedAccounts.length > 0 && (
          <Card className="mb-8 border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-950/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Pause className="h-5 w-5 text-red-600 dark:text-red-500" />
                Contas Suspensas ({suspendedAccounts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-red-100/50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800">
                  <tr>
                    <th className="text-left p-4 pl-6 text-sm font-medium text-red-800 dark:text-red-200">Nome da Conta</th>
                    <th className="text-left p-4 text-sm font-medium text-red-800 dark:text-red-200">Documento</th>
                    <th className="text-left p-4 text-sm font-medium text-red-800 dark:text-red-200">Quota</th>
                    <th className="text-right p-4 pr-6 text-sm font-medium text-red-800 dark:text-red-200">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100 dark:divide-red-800">
                  {suspendedAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-colors" data-testid={`row-suspended-${account.id}`}>
                      <td className="p-4 pl-6">
                        <span className="font-medium text-slate-900 dark:text-foreground">{account.name}</span>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-muted-foreground">
                        {account.document ? `${account.documentType?.toUpperCase()}: ${account.document}` : 'Não informado'}
                      </td>
                      <td className="p-4 text-sm">
                        <span className="font-medium">{account.storageQuotaGB || 100} GB</span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <Button
                          size="sm"
                          onClick={() => handleReactivate(account.id, account.name)}
                          disabled={isReactivating}
                          data-testid={`button-reactivate-${account.id}`}
                        >
                          <Play className="mr-1 h-4 w-4" /> Reativar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Produtos/Planos
            </CardTitle>
            <Button onClick={() => openProductDialog()} data-testid="button-create-product">
              <Plus className="mr-1 h-4 w-4" /> Criar Produto
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {productsLoading ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : !products || products.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Nenhum produto ainda. Crie seu primeiro produto para começar.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-4 pl-6 text-sm font-medium text-muted-foreground">Nome</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Preço</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Limite de Armazenamento</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Limite de Transferência</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-4 pr-6 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-muted/30 transition-colors" data-testid={`row-product-${product.id}`}>
                      <td className="p-4 pl-6">
                        <div>
                          <span className="font-medium text-slate-900 dark:text-foreground">{product.name}</span>
                          {product.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">{product.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium">{formatCurrency(product.price)}/mês</td>
                      <td className="p-4 text-sm">{product.storageLimit} GB</td>
                      <td className="p-4 text-sm">{product.transferLimit ? `${product.transferLimit} GB` : 'Ilimitado'}</td>
                      <td className="p-4">
                        {product.isPublic ? (
                          <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">Público</Badge>
                        ) : (
                          <Badge variant="secondary">Privado</Badge>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openProductDialog(product)}
                            data-testid={`button-edit-product-${product.id}`}
                          >
                            <Pencil className="mr-1 h-4 w-4" /> Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/30"
                            onClick={() => handleDeleteProduct(product)}
                            disabled={isDeletingProduct}
                            data-testid={`button-delete-product-${product.id}`}
                          >
                            <Trash2 className="mr-1 h-4 w-4" /> Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Pricing Management Section */}
        <div className="mb-8">
          <PricingManager />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Todas as Contas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : accounts?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Nenhuma conta ainda.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-4 pl-6 text-sm font-medium text-muted-foreground">Conta</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Documento</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Telefone</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Uso / Quota</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Criado em</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {accounts?.map((account) => (
                    <tr key={account.id} className="hover:bg-slate-50/50 dark:hover:bg-muted/30 transition-colors" data-testid={`row-account-${account.id}`}>
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {account.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{account.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-muted-foreground">
                        {account.document ? (
                          <span className="font-mono text-xs">{account.documentType?.toUpperCase()}: {account.document}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-muted-foreground">
                        {account.phone || <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="p-4">
                        {account.status === 'active' ? (
                          <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">Ativo</Badge>
                        ) : account.status === 'suspended' ? (
                          <Badge variant="destructive">Suspenso</Badge>
                        ) : account.status === 'rejected' ? (
                          <Badge variant="destructive">Rejeitado</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300">Pendente</Badge>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {(() => {
                          const usedGB = ((account.storageUsed || 0) / (1024 * 1024 * 1024));
                          const quotaGB = account.storageQuotaGB || 100;
                          const percentage = Math.min(100, (usedGB / quotaGB) * 100);
                          const isWarning = percentage >= 80;
                          const isCritical = percentage >= 95;
                          return (
                            <div className="flex flex-col gap-1">
                              <span className={`font-medium ${isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : ''}`}>
                                {usedGB.toFixed(2)} / {quotaGB} GB
                              </span>
                              <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'}`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {account.createdAt ? new Date(account.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={quotaDialogOpen} onOpenChange={setQuotaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Quota de Armazenamento</DialogTitle>
            <DialogDescription>
              Ajuste a quota de armazenamento para {selectedAccount?.name}. Quota atual: {selectedAccount?.storageQuotaGB || 100} GB
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quota">Nova Quota (GB)</Label>
              <Input
                id="quota"
                type="number"
                min="1"
                value={newQuotaGB}
                onChange={(e) => setNewQuotaGB(e.target.value)}
                placeholder="Digite a quota em GB"
                data-testid="input-quota"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo do ajuste</Label>
              <Textarea
                id="reason"
                value={quotaReason}
                onChange={(e) => setQuotaReason(e.target.value)}
                placeholder="Forneça um motivo para esta alteração de quota (obrigatório para log de auditoria)"
                className="resize-none"
                data-testid="input-quota-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuotaDialogOpen(false)} data-testid="button-quota-cancel">
              Cancelar
            </Button>
            <Button onClick={handleAdjustQuota} disabled={isAdjustingQuota} data-testid="button-quota-save">
              {isAdjustingQuota ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quota Review Dialog */}
      <Dialog open={quotaReviewDialogOpen} onOpenChange={setQuotaReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {quotaReviewAction === 'approve' ? 'Aprovar Solicitação de Quota' : 'Rejeitar Solicitação de Quota'}
            </DialogTitle>
            <DialogDescription>
              {quotaReviewAction === 'approve'
                ? `Aprovar solicitação de ${selectedQuotaRequest?.account.name} para aumentar quota de ${selectedQuotaRequest?.currentQuotaGB} GB para ${selectedQuotaRequest?.requestedQuotaGB} GB.`
                : `Rejeitar solicitação de aumento de quota de ${selectedQuotaRequest?.account.name}.`
              }
            </DialogDescription>
          </DialogHeader>
          {selectedQuotaRequest?.reason && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Motivo informado:</p>
              <p className="text-sm text-muted-foreground">{selectedQuotaRequest.reason}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="review-note">Observação (opcional)</Label>
            <Textarea
              id="review-note"
              value={quotaReviewNote}
              onChange={(e) => setQuotaReviewNote(e.target.value)}
              placeholder={quotaReviewAction === 'approve' ? 'Adicionar uma observação para esta aprovação...' : 'Motivo da rejeição...'}
              className="resize-none"
              data-testid="input-quota-review-note"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuotaReviewDialogOpen(false)} data-testid="button-quota-review-cancel">
              Cancelar
            </Button>
            <Button
              onClick={handleQuotaReview}
              disabled={isApprovingQuota || isRejectingQuota}
              variant={quotaReviewAction === 'approve' ? 'primary' : 'destructive'}
              data-testid="button-quota-review-confirm"
            >
              {(isApprovingQuota || isRejectingQuota) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {quotaReviewAction === 'approve' ? 'Aprovar' : 'Rejeitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Create/Edit Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Criar Produto'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? `Atualize os detalhes de ${editingProduct.name}.` : 'Crie um novo produto/plano para seus clientes.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Nome *</Label>
              <Input
                id="product-name"
                value={productForm.name}
                onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Plano Pro"
                data-testid="input-product-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description">Descrição</Label>
              <Textarea
                id="product-description"
                value={productForm.description}
                onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Breve descrição deste produto..."
                className="resize-none"
                data-testid="input-product-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-price">Preço (centavos) - R$ {(productForm.price / 100).toFixed(2)}/mês</Label>
              <Input
                id="product-price"
                type="number"
                min="0"
                value={productForm.price}
                onChange={(e) => setProductForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                placeholder="Ex: 9900 para R$ 99,00"
                data-testid="input-product-price"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-storage-price">Preço Extra Armazenamento (centavos)</Label>
                <Input
                  id="product-storage-price"
                  type="number"
                  min="0"
                  value={productForm.pricePerStorageGB}
                  onChange={(e) => setProductForm(prev => ({ ...prev, pricePerStorageGB: parseInt(e.target.value) || 0 }))}
                  placeholder="Ex: 15 para R$ 0,15"
                  data-testid="input-product-storage-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-transfer-price">Preço Extra Transferência (centavos)</Label>
                <Input
                  id="product-transfer-price"
                  type="number"
                  min="0"
                  value={productForm.pricePerTransferGB}
                  onChange={(e) => setProductForm(prev => ({ ...prev, pricePerTransferGB: parseInt(e.target.value) || 0 }))}
                  placeholder="Ex: 40 para R$ 0,40"
                  data-testid="input-product-transfer-price"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-storage">Limite de Armazenamento (GB) *</Label>
                <Input
                  id="product-storage"
                  type="number"
                  min="1"
                  value={productForm.storageLimit}
                  onChange={(e) => setProductForm(prev => ({ ...prev, storageLimit: parseInt(e.target.value) || 0 }))}
                  placeholder="Ex: 100"
                  data-testid="input-product-storage"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-transfer">Limite de Transferência (GB)</Label>
                <Input
                  id="product-transfer"
                  type="number"
                  min="0"
                  value={productForm.transferLimit}
                  onChange={(e) => setProductForm(prev => ({ ...prev, transferLimit: parseInt(e.target.value) || 0 }))}
                  placeholder="0 = Ilimitado"
                  data-testid="input-product-transfer"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="product-public">Público</Label>
                <p className="text-sm text-muted-foreground">Tornar este produto visível para clientes</p>
              </div>
              <Switch
                id="product-public"
                checked={productForm.isPublic}
                onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, isPublic: checked }))}
                data-testid="switch-product-public"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialogOpen(false)} data-testid="button-product-cancel">
              Cancelar
            </Button>
            <Button
              onClick={handleSaveProduct}
              disabled={isCreatingProduct || isUpdatingProduct}
              data-testid="button-product-save"
            >
              {(isCreatingProduct || isUpdatingProduct) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
