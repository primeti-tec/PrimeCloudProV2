import { Sidebar } from "@/components/Sidebar";
import { useProducts } from "@/hooks/use-products";
import { useMyAccounts } from "@/hooks/use-accounts";
import { useSubscribe } from "@/hooks/use-subscriptions";
import { useQuotaRequests, useCreateQuotaRequest } from "@/hooks/use-quota-requests";
import { useInvoices, useUsageSummary } from "@/hooks/use-billing";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui-custom";
import { Check, Loader2, CreditCard, Download, FileText, HardDrive, Wifi, Activity, DollarSign, ArrowUp, ArrowDown, FileUp, Clock, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

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
  const { mutateAsync: subscribe, isPending: isSubscribing } = useSubscribe();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'upgrade' | 'downgrade'>('upgrade');
  const { toast } = useToast();

  const currentAccount = accounts?.[0];

  // Quota request state
  const { data: quotaRequests, isLoading: quotaRequestsLoading } = useQuotaRequests(currentAccount?.id);
  const { mutate: createQuotaRequest, isPending: isCreatingQuotaRequest } = useCreateQuotaRequest();
  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
  const [requestedQuota, setRequestedQuota] = useState("");
  const [quotaReason, setQuotaReason] = useState("");

  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices(currentAccount?.id);
  const { data: usage, isLoading: usageLoading } = useUsageSummary(currentAccount?.id);

  const usageData = usage || {
    storageUsedGB: 0,
    bandwidthUsedGB: 0,
    apiRequestsCount: 0,
    projectedCost: 0,
  };

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

  const openPlanDialog = (mode: 'upgrade' | 'downgrade') => {
    setDialogMode(mode);
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
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
      <Sidebar />
      <main className="flex-1 ml-72 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100" data-testid="text-page-title">Faturamento e Planos</h1>
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
            <div className="flex items-center gap-4 mb-6">
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100" data-testid="text-current-quota">
                {currentAccount?.storageQuotaGB || 100} GB
              </div>
              <span className="text-muted-foreground">Quota Atual</span>
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
            <Button variant="outline" onClick={() => openPlanDialog('downgrade')} data-testid="button-downgrade-plan">
              <ArrowDown className="h-4 w-4 mr-2" />
              Fazer Downgrade
            </Button>
            <Button variant="primary" onClick={() => openPlanDialog('upgrade')} data-testid="button-upgrade-plan">
              <ArrowUp className="h-4 w-4 mr-2" />
              Fazer Upgrade
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {productsLoading ? <Loader2 className="animate-spin" /> : products?.map((product) => (
            <Card key={product.id} className={`relative flex flex-col ${product.price > 0 && product.price < 15000 ? "border-primary shadow-lg ring-1 ring-primary/20" : ""}`} data-testid={`card-plan-${product.id}`}>
              {product.price > 0 && product.price < 15000 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Recomendado
                </div>
              )}
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">R$ {(product.price / 100).toFixed(0)}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{product.description}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    {product.storageLimit} GB de Armazenamento
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    {product.transferLimit || "Ilimitado"} GB Transferência
                  </li>
                </ul>
                <Button
                  className="w-full"
                  variant={product.price > 0 && product.price < 15000 ? "primary" : "outline"}
                  disabled={isSubscribing || loadingId !== null}
                  onClick={() => handleSubscribe(product.id)}
                  data-testid={`button-select-plan-${product.id}`}
                >
                  {loadingId === product.id ? <Loader2 className="animate-spin" /> : "Selecionar Plano"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Invoices Section */}
        <h2 className="text-xl font-bold font-display mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" /> Faturas
        </h2>
        <Card className="mb-8">
          <CardContent className="p-0">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadInvoicePdf(invoice)}
                        data-testid={`button-download-invoice-${invoice.id}`}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Baixar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Plan Change Dialog */}
        <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{dialogMode === 'upgrade' ? 'Fazer Upgrade do Plano' : 'Fazer Downgrade do Plano'}</DialogTitle>
              <DialogDescription>
                {dialogMode === 'upgrade'
                  ? 'Escolha um plano com mais recursos para expandir seu negócio.'
                  : 'Selecione um plano menor se precisar de menos recursos. As alterações entram em vigor no próximo ciclo de cobrança.'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
              {products?.map((product) => (
                <Card key={product.id} className="flex flex-col" data-testid={`dialog-card-plan-${product.id}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <div className="mt-1">
                      <span className="text-2xl font-bold">R$ {(product.price / 100).toFixed(0)}</span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col pt-2">
                    <ul className="space-y-2 mb-4 flex-1 text-sm">
                      <li className="flex items-center">
                        <Check className="h-3 w-3 text-green-500 mr-2" />
                        {product.storageLimit} GB Armazenamento
                      </li>
                      <li className="flex items-center">
                        <Check className="h-3 w-3 text-green-500 mr-2" />
                        {product.transferLimit || "Ilimitado"} Transferência
                      </li>
                      <li className="flex items-center">
                        <Check className="h-3 w-3 text-green-500 mr-2" />
                        Suporte 24/7
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
      </main>
    </div>
  );
}
