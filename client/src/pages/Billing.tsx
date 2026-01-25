import { Sidebar } from "@/components/Sidebar";
import { useProducts } from "@/hooks/use-products";
import { useMyAccounts, useAccount } from "@/hooks/use-accounts";
import { useSubscribe } from "@/hooks/use-subscriptions";
import { useQuotaRequests, useCreateQuotaRequest } from "@/hooks/use-quota-requests";
import { useInvoices, useUsageSummary } from "@/hooks/use-billing";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui-custom";
import { Check, Loader2, CreditCard, Download, FileText, HardDrive, Wifi, Activity, DollarSign, ArrowUp, FileUp, Clock, CheckCircle, XCircle, AlertTriangle, ShoppingCart, Package, RefreshCw, X, Building2 } from "lucide-react";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useOrders, useUpdateOrder, useCancelOrder } from "@/hooks/use-orders";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Invoice {
  id: number;
  invoiceNumber: string;
  createdAt: string;
  dueDate: string;
  totalAmount: number;
  status: string;
  paidAt: string | null;
}

function downloadInvoicePdf(invoice: Invoice) {
  const content = `
FATURA
========================================

Número da Fatura: ${invoice.invoiceNumber}
Data de Emissão: ${new Date(invoice.createdAt).toLocaleDateString('pt-BR')}
Data de Vencimento: ${new Date(invoice.dueDate).toLocaleDateString('pt-BR')}
Status: ${invoice.status.toUpperCase()}
${invoice.paidAt ? `Data de Pagamento: ${new Date(invoice.paidAt).toLocaleDateString('pt-BR')}` : ''}

----------------------------------------
RESUMO DE COBRANÇA
----------------------------------------

Serviços de Cloud Storage
  - Taxa do Plano Base:            R$ 99,00
  - Armazenamento Adicional:       R$ ${((invoice.totalAmount - 9900) / 100).toFixed(2).replace('.', ',')}
----------------------------------------
Subtotal:                          R$ ${(invoice.totalAmount / 100).toFixed(2).replace('.', ',')}
Impostos (0%):                     R$ 0,00
----------------------------------------
TOTAL:                             R$ ${(invoice.totalAmount / 100).toFixed(2).replace('.', ',')}

========================================
Obrigado pela preferência!
  `.trim();

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${invoice.invoiceNumber}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "outline" | "destructive" | "success" {
  switch (status) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'secondary';
    case 'overdue':
      return 'destructive';
    default:
      return 'default';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'paid':
      return 'Pago';
    case 'pending':
      return 'Pendente';
    case 'overdue':
      return 'Vencido';
    case 'canceled':
      return 'Cancelado';
    default:
      return status;
  }
}

export default function Billing() {
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: accounts } = useMyAccounts();

  const currentAccountId = accounts?.[0]?.id;
  const { data: fullAccount } = useAccount(currentAccountId);

  // FIX: Removed fallback to products[0] to prevent showing incorrect plan
  const currentProduct = products?.find(p => p.id === fullAccount?.subscription?.productId) || null;

  const { mutateAsync: subscribe, isPending: isSubscribing } = useSubscribe();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const { toast } = useToast();

  const currentAccount = accounts?.[0];

  // Quota request state
  const { data: quotaRequests, isLoading: quotaRequestsLoading } = useQuotaRequests(currentAccount?.id);
  const { mutate: createQuotaRequest, isPending: isCreatingQuotaRequest } = useCreateQuotaRequest();
  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
  const [requestedQuota, setRequestedQuota] = useState("");
  const [quotaReason, setQuotaReason] = useState("");
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);

  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices(currentAccount?.id);
  const { data: usage, isLoading: usageLoading } = useUsageSummary(currentAccount?.id);

  // Orders
  const { data: orders = [], isLoading: ordersLoading } = useOrders(currentAccount?.id || 0);
  const updateOrder = useUpdateOrder(currentAccount?.id || 0);
  const cancelOrder = useCancelOrder(currentAccount?.id || 0);

  const usageData = usage || {
    storageUsedGB: 0,
    bandwidthUsedGB: 0,
    apiRequestsCount: 0,
    projectedCost: 0,
    buckets: [],
  };

  const currentQuota = currentProduct?.storageLimit || currentAccount?.storageQuotaGB || 100;
  const usagePercent = Math.min((usageData.storageUsedGB / currentQuota) * 100, 100);
  const isOverLimit = usageData.storageUsedGB > currentQuota;
  const isCritical = usageData.storageUsedGB >= currentQuota * 0.95;
  const isWarning = usageData.storageUsedGB >= currentQuota * 0.80;

  let progressColor = "bg-primary";
  let textColor = "text-slate-900 dark:text-slate-100";
  let statusBadge = null;

  if (isOverLimit) {
    progressColor = "[&>div]:bg-destructive";
    textColor = "text-destructive";
    statusBadge = <Badge variant="destructive" className="animate-pulse">Quota Excedida</Badge>;
  } else if (isCritical) {
    progressColor = "[&>div]:bg-destructive";
    textColor = "text-destructive";
    statusBadge = <Badge variant="destructive">Crítico</Badge>;
  } else if (isWarning) {
    progressColor = "[&>div]:bg-amber-500";
    textColor = "text-amber-600 dark:text-amber-500";
    statusBadge = <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">Atenção</Badge>;
  }

  const handleSubscribe = async (productId: number) => {
    if (!currentAccount) return;
    setLoadingId(productId);
    try {
      await subscribe({ accountId: currentAccount.id, productId });
      setPlanDialogOpen(false);
      toast({ title: "Plano atualizado!", description: "Seu plano foi alterado com sucesso." });
    } catch (e) {
      console.error(e);
      toast({ title: "Erro", description: "Falha ao atualizar plano.", variant: "destructive" });
    } finally {
      setLoadingId(null);
    }
  };

  const openPlanDialog = () => {
    setPlanDialogOpen(true);
  };

  const openQuotaDialog = () => {
    setRequestedQuota("");
    setQuotaReason("");
    setQuotaDialogOpen(true);
  };

  const handleCreateQuotaRequest = () => {
    if (!currentAccount) return;
    const quotaValue = parseInt(requestedQuota);
    if (isNaN(quotaValue) || quotaValue <= (currentAccount.storageQuotaGB || 100)) {
      toast({ title: "Erro", description: "A quota solicitada deve ser maior que a quota atual.", variant: "destructive" });
      return;
    }
    createQuotaRequest({
      accountId: currentAccount.id,
      requestedQuotaGB: quotaValue,
      reason: quotaReason || undefined
    }, {
      onSuccess: () => {
        toast({ title: "Solicitação Enviada", description: "Sua solicitação de aumento de quota foi enviada para análise." });
        setQuotaDialogOpen(false);
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao enviar solicitação de quota.", variant: "destructive" });
      },
    });
  };

  const getQuotaStatusIcon = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getQuotaStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-72 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground" data-testid="text-page-title">Faturamento e Planos</h1>
          <p className="text-muted-foreground">Gerencie sua assinatura, faturas e métodos de pagamento.</p>
        </header>

        {/* Payment Method Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Método de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-16 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-400">PIX</div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">Boleto/PIX</div>
                <div className="text-sm text-muted-foreground">Fatura mensal</div>
              </div>
            </div>
            <Button variant="outline" data-testid="button-update-payment">Atualizar</Button>
          </CardContent>
        </Card>

        {/* Storage Quota Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" /> Quota de Armazenamento
              </CardTitle>
              <Button onClick={openQuotaDialog} data-testid="button-request-quota">
                <FileUp className="h-4 w-4 mr-2" />
                Solicitar Aumento de Quota
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6 mb-6">
              {/* Overall Usage Section */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`text-3xl font-bold ${textColor}`} data-testid="text-current-quota">
                      {usageData.storageUsedGB} GB
                    </div>
                    <span className="text-muted-foreground">de {currentQuota} GB usados</span>
                  </div>
                  {statusBadge}
                </div>

                <Progress value={usagePercent} className={`h-3 ${progressColor}`} />

                {isOverLimit && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Atenção</AlertTitle>
                    <AlertDescription>
                      Você excedeu sua quota de armazenamento. Por favor, faça um upgrade no seu plano ou solicite um aumento de quota para evitar interrupções.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Individual Client Limits Breakdown */}
              {usageData.buckets && usageData.buckets.length > 0 && (
                <div className="mt-4 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-primary" />
                    Detalhamento por Cliente (Bucket)
                  </h3>
                  <div className="space-y-6">
                    {usageData.buckets.map((bucket: any, index: number) => {
                      // Calculate bucket specific metrics
                      const bucketLimit = bucket.storageLimitGB || 50;
                      // Convert sizeBytes to GB for display/calc
                      const bucketSizeGB = Math.round(bucket.sizeBytes / (1024 * 1024 * 1024) * 100) / 100;
                      const bucketPercent = Math.min((bucketSizeGB / bucketLimit) * 100, 100);

                      const isBucketCritical = bucketSizeGB >= bucketLimit * 0.95;
                      const isBucketWarning = bucketSizeGB >= bucketLimit * 0.80;
                      const isBucketOverLimit = bucketSizeGB > bucketLimit;

                      let bucketProgressColor = "bg-primary";
                      let bucketTextColor = "text-slate-700 dark:text-slate-300";

                      if (isBucketOverLimit || isBucketCritical) {
                        bucketProgressColor = "[&>div]:bg-destructive";
                        bucketTextColor = "text-destructive font-bold";
                      } else if (isBucketWarning) {
                        bucketProgressColor = "[&>div]:bg-amber-500";
                        bucketTextColor = "text-amber-600 dark:text-amber-500 font-bold";
                      }

                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-900 dark:text-slate-100">{bucket.name}</span>
                            <div className="flex items-center gap-2">
                              <span className={bucketTextColor}>
                                {bucketSizeGB} GB
                              </span>
                              <span className="text-muted-foreground">
                                / {bucketLimit} GB
                              </span>
                              {isBucketOverLimit && <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Excedido</Badge>}
                              {!isBucketOverLimit && isBucketCritical && <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Crítico</Badge>}
                              {!isBucketOverLimit && !isBucketCritical && isBucketWarning && <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-amber-100 text-amber-800">Atenção</Badge>}
                            </div>
                          </div>
                          <Progress value={bucketPercent} className={`h-2 ${bucketProgressColor}`} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {quotaRequests && quotaRequests.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Solicitações Anteriores</h3>
                <div className="space-y-2">
                  {quotaRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex flex-wrap items-center justify-between gap-4 p-3 bg-muted/50 rounded-lg"
                      data-testid={`row-quota-request-${request.id}`}
                    >
                      <div className="flex items-center gap-3">
                        {getQuotaStatusIcon(request.status)}
                        <div>
                          <span className="text-sm font-medium">
                            {request.currentQuotaGB} GB → {request.requestedQuotaGB} GB
                          </span>
                          {request.reason && (
                            <p className="text-xs text-muted-foreground">{request.reason}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getQuotaStatusBadge(request.status)}
                        <span className="text-xs text-muted-foreground">
                          {request.createdAt ? new Date(request.createdAt).toLocaleDateString('pt-BR') : ''}
                        </span>
                      </div>
                      {request.reviewNote && (
                        <div className="w-full text-xs text-muted-foreground italic pl-7">
                          Observação: {request.reviewNote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Summary Section */}
        <h2 className="text-xl font-bold font-display mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" /> Resumo de Uso
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <HardDrive className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm text-muted-foreground">Armazenamento Usado</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100" data-testid="text-storage-used">{usageData.storageUsedGB} GB</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm text-muted-foreground">Bandwidth Usado</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100" data-testid="text-bandwidth-used">{usageData.bandwidthUsedGB} GB</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm text-muted-foreground">Requisições API</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100" data-testid="text-api-requests">{usageData.apiRequestsCount.toLocaleString('pt-BR')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm text-muted-foreground">Custo Projetado</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100" data-testid="text-projected-cost">R$ {(usageData.projectedCost / 100).toFixed(2).replace('.', ',')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Plan Management Section */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold font-display">Plano Atual</h2>
          <div className="flex gap-3">
            <Button variant="primary" onClick={() => openPlanDialog()} data-testid="button-upgrade-plan">
              <ArrowUp className="h-4 w-4 mr-2" />
              Alterar Plano
            </Button>
          </div>
        </div>

        <div className="mb-10">
          {productsLoading ? (
            <Loader2 className="animate-spin" />
          ) : currentProduct ? (
            <Card className="border-primary shadow-lg ring-1 ring-primary/20 overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="p-6 flex-1 bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="default" className="bg-primary/90 hover:bg-primary">Ativo</Badge>
                        {currentProduct.price > 0 && currentProduct.price < 15000 && (
                          <Badge variant="outline" className="border-primary text-primary">Recomendado</Badge>
                        )}
                      </div>
                      <CardTitle className="text-2xl mb-2">{currentProduct.name}</CardTitle>
                      <p className="text-muted-foreground">{currentProduct.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">R$ {(currentProduct.price / 100).toFixed(0)}</div>
                      <span className="text-xs text-muted-foreground">/mês</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-card border-t md:border-t-0 md:border-l flex flex-col justify-center min-w-[300px]">
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span className="font-medium">{currentProduct.storageLimit} GB</span> &nbsp;de Armazenamento
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span className="font-medium">{currentProduct.transferLimit || "Ilimitado"} GB</span> &nbsp;Transferência
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Suporte Prioritário
                    </li>
                  </ul>

                  <Button
                    className="w-full"
                    onClick={() => openPlanDialog()}
                    data-testid="button-change-plan-wide"
                  >
                    <ArrowUp className="h-4 w-4 mr-2" />
                    Alterar Plano
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="text-center p-8 border rounded-lg border-dashed">
              <p className="text-muted-foreground">Nenhum plano identificado.</p>
              <Button variant="ghost" onClick={() => openPlanDialog()}>Ver Planos Disponíveis</Button>
            </div>
          )}
        </div>

        {/* Invoices Section */}
        <h2 className="text-xl font-bold font-display mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" /> Faturas
        </h2>
        <Card className="mb-8">
          <CardContent className="p-0">
            {invoices.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Nenhuma fatura disponível no momento.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fatura #</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                      <TableCell className="font-medium" data-testid={`text-invoice-number-${invoice.id}`}>{invoice.invoiceNumber}</TableCell>
                      <TableCell data-testid={`text-invoice-date-${invoice.id}`}>{new Date(invoice.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell data-testid={`text-invoice-amount-${invoice.id}`}>R$ {(invoice.totalAmount / 100).toFixed(2).replace('.', ',')}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(invoice.status)} data-testid={`badge-invoice-status-${invoice.id}`}>
                          {getStatusLabel(invoice.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {invoice.status === 'pending' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setPaymentInvoice(invoice)}
                              className="bg-green-600 hover:bg-green-700"
                              data-testid={`button-pay-invoice-${invoice.id}`}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Pagar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadInvoicePdf(invoice)}
                            data-testid={`button-download-invoice-${invoice.id}`}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Baixar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Orders Section */}
        <h2 className="text-xl font-bold font-display mb-4 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" /> Pedidos
        </h2>
        <Card className="mb-8">
          <CardContent className="p-0">
            {ordersLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="animate-spin h-6 w-6" />
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Nenhum pedido encontrado.</p>
                <Button variant="ghost" className="mt-2" onClick={() => window.location.href = '/dashboard/contract'}>
                  Contratar um Serviço
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido #</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.slice(0, 10).map((order) => (
                    <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>
                        {order.createdAt ? format(new Date(order.createdAt), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {order.orderType === 'vps' ? 'VPS' : order.product?.name || 'Produto'}
                        </Badge>
                      </TableCell>
                      <TableCell>R$ {((order.totalAmount || 0) / 100).toFixed(2).replace('.', ',')}</TableCell>
                      <TableCell>
                        <Badge variant={
                          order.status === 'completed' ? 'success' :
                            order.status === 'canceled' ? 'destructive' :
                              order.status === 'pending' ? 'secondary' :
                                'default'
                        }>
                          {order.status === 'pending' ? 'Pendente' :
                            order.status === 'quoting' ? 'Em Orçamento' :
                              order.status === 'approved' ? 'Aprovado' :
                                order.status === 'provisioning' ? 'Provisionando' :
                                  order.status === 'completed' ? 'Concluído' :
                                    order.status === 'canceled' ? 'Cancelado' :
                                      order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {order.status !== 'canceled' && order.status !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelOrder.mutate({ orderId: order.id })}
                            disabled={cancelOrder.isPending}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                        )}
                        {order.status === 'completed' && (
                          <Badge variant="outline" className="bg-green-50">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Concluído
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Plan Change Dialog */}
        <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Alterar Plano</DialogTitle>
              <DialogDescription>
                Escolha o plano ideal para suas necessidades. As alterações podem gerar cobranças proporcionais.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
              {products?.map((product) => (
                <Card key={product.id} className={`flex flex-col relative ${currentProduct?.id === product.id ? 'border-primary shadow-md ring-1 ring-primary/20' : ''}`} data-testid={`dialog-card-plan-${product.id}`}>
                  {currentProduct?.id === product.id && (
                    <div className="absolute top-2 right-2">
                      <Badge>Atual</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl pr-8">{product.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">R$ {(product.price / 100).toFixed(0)}</span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col pt-2">
                    <ul className="space-y-3 mb-6 flex-1 text-sm">
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>{product.storageLimit} GB Armazenamento</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>{product.transferLimit || "Ilimitado"} Transferência</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>Suporte 24/7</span>
                      </li>
                    </ul>
                    <Button
                      className="w-full"
                      variant="outline"
                      size="sm"
                      disabled={isSubscribing || loadingId !== null}
                      onClick={() => handleSubscribe(product.id)}
                      data-testid={`dialog-button-select-plan-${product.id}`}
                    >
                      {loadingId === product.id ? <Loader2 className="animate-spin h-4 w-4" /> : "Selecionar"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setPlanDialogOpen(false)} data-testid="button-cancel-plan-change">
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quota Request Dialog */}
        <Dialog open={quotaDialogOpen} onOpenChange={setQuotaDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar Aumento de Quota</DialogTitle>
              <DialogDescription>
                Envie uma solicitação para aumentar sua quota de armazenamento. Quota atual: {currentAccount?.storageQuotaGB || 100} GB
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <HardDrive className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Armazenamento Atual</p>
                    <p className="text-xl font-bold">{usageData.storageUsedGB} GB / {currentAccount?.storageQuotaGB || 100} GB</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="requested-quota">Quota Solicitada (GB)</Label>
                <Input
                  id="requested-quota"
                  type="number"
                  min={(currentAccount?.storageQuotaGB || 100) + 1}
                  value={requestedQuota}
                  onChange={(e) => setRequestedQuota(e.target.value)}
                  placeholder={`Digite um valor maior que ${currentAccount?.storageQuotaGB || 100} GB`}
                  data-testid="input-requested-quota"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quota-reason">Motivo do aumento (opcional)</Label>
                <Textarea
                  id="quota-reason"
                  value={quotaReason}
                  onChange={(e) => setQuotaReason(e.target.value)}
                  placeholder="Explique por que você precisa de armazenamento adicional..."
                  className="resize-none"
                  data-testid="input-quota-reason"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setQuotaDialogOpen(false)} data-testid="button-quota-cancel">
                Cancelar
              </Button>
              <Button onClick={handleCreateQuotaRequest} disabled={isCreatingQuotaRequest} data-testid="button-quota-submit">
                {isCreatingQuotaRequest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Solicitação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Instructions Dialog */}
        <Dialog open={!!paymentInvoice} onOpenChange={(open) => !open && setPaymentInvoice(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Realizar Pagamento</DialogTitle>
              <DialogDescription>
                Utilize os dados abaixo para pagar a fatura {paymentInvoice?.invoiceNumber}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                <p className="text-sm text-muted-foreground mb-1">Valor a Pagar</p>
                <div className="text-3xl font-bold text-green-600">
                  R$ {((paymentInvoice?.totalAmount || 0) / 100).toFixed(2).replace('.', ',')}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Vencimento: {paymentInvoice?.dueDate ? new Date(paymentInvoice.dueDate).toLocaleDateString() : '-'}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <div className="h-6 w-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">PIX</div>
                    Chave PIX (CNPJ)
                  </div>
                  <div className="relative">
                    <div className="flex bg-muted p-3 rounded-md font-mono text-sm justify-between items-center border">
                      <span>44.444.444/0001-44</span>
                      <Button variant="ghost" size="sm" className="h-6 ml-2" onClick={() => {
                        navigator.clipboard.writeText("44.444.444/0001-44");
                        toast({ title: "Copiado!", description: "Chave PIX copiada para a área de transferência." });
                      }}>
                        Copiar
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Dados Bancários
                  </div>
                  <div className="bg-muted p-3 rounded-md text-sm space-y-1 border">
                    <p><span className="text-muted-foreground">Banco:</span> 000 - Banco do Brasil</p>
                    <p><span className="text-muted-foreground">Agência:</span> 1234-5</p>
                    <p><span className="text-muted-foreground">Conta:</span> 12345-6</p>
                    <p><span className="text-muted-foreground">Favorecido:</span> Prime Cloud Pro LTDA</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded text-xs text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-900">
                <p>Após realizar o pagamento, envie o comprovante para <strong>financeiro@cloudstoragepro.com.br</strong> com o número da fatura no assunto.</p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setPaymentInvoice(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}
