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
INVOICE
========================================

Invoice Number: ${invoice.invoiceNumber}
Issue Date: ${new Date(invoice.createdAt).toLocaleDateString()}
Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
Status: ${invoice.status.toUpperCase()}
${invoice.paidAt ? `Paid Date: ${new Date(invoice.paidAt).toLocaleDateString()}` : ''}

----------------------------------------
BILLING SUMMARY
----------------------------------------

Cloud Storage Services
  - Base Plan Fee:              $29.00
  - Additional Storage:         $${((invoice.totalAmount - 2900) / 100).toFixed(2)}
----------------------------------------
Subtotal:                       $${(invoice.totalAmount / 100).toFixed(2)}
Tax (0%):                       $0.00
----------------------------------------
TOTAL:                          $${(invoice.totalAmount / 100).toFixed(2)}

========================================
Thank you for your business!
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
      alert("Plan updated successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to update plan");
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
      toast({ title: "Error", description: "Requested quota must be greater than current quota.", variant: "destructive" });
      return;
    }
    createQuotaRequest({ 
      accountId: currentAccount.id, 
      requestedQuotaGB: quotaValue, 
      reason: quotaReason || undefined 
    }, {
      onSuccess: () => {
        toast({ title: "Request Submitted", description: "Your quota increase request has been submitted for review." });
        setQuotaDialogOpen(false);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to submit quota request.", variant: "destructive" });
      },
    });
  };

  const getQuotaStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getQuotaStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
      <Sidebar />
      <main className="flex-1 ml-72 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100" data-testid="text-page-title">Billing & Plans</h1>
          <p className="text-muted-foreground">Manage your subscription, invoices, and payment methods.</p>
        </header>

        {/* Payment Method Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-16 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-400">VISA</div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">Visa ending in 4242</div>
                <div className="text-sm text-muted-foreground">Expires 12/28</div>
              </div>
            </div>
            <Button variant="outline" data-testid="button-update-payment">Update</Button>
          </CardContent>
        </Card>

        {/* Storage Quota Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" /> Storage Quota
              </CardTitle>
              <Button onClick={openQuotaDialog} data-testid="button-request-quota">
                <FileUp className="h-4 w-4 mr-2" />
                Request Quota Increase
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100" data-testid="text-current-quota">
                {currentAccount?.storageQuotaGB || 100} GB
              </div>
              <span className="text-muted-foreground">Current Quota</span>
            </div>
            
            {quotaRequests && quotaRequests.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Previous Requests</h3>
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
                          {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                      {request.reviewNote && (
                        <div className="w-full text-xs text-muted-foreground italic pl-7">
                          Note: {request.reviewNote}
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
          <Activity className="h-5 w-5" /> Usage Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <HardDrive className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm text-muted-foreground">Storage Used</span>
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
                <span className="text-sm text-muted-foreground">Bandwidth Used</span>
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
                <span className="text-sm text-muted-foreground">API Requests</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100" data-testid="text-api-requests">{usageData.apiRequestsCount.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm text-muted-foreground">Projected Cost</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100" data-testid="text-projected-cost">${(usageData.projectedCost / 100).toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Plan Management Section */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold font-display">Current Plan</h2>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => openPlanDialog('downgrade')} data-testid="button-downgrade-plan">
              <ArrowDown className="h-4 w-4 mr-2" />
              Downgrade Plan
            </Button>
            <Button variant="primary" onClick={() => openPlanDialog('upgrade')} data-testid="button-upgrade-plan">
              <ArrowUp className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {productsLoading ? <Loader2 className="animate-spin" /> : products?.map((product) => (
            <Card key={product.id} className={`relative flex flex-col ${product.price > 0 && product.price < 5000 ? "border-primary shadow-lg ring-1 ring-primary/20" : ""}`} data-testid={`card-plan-${product.id}`}>
              {product.price > 0 && product.price < 5000 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Recommended
                </div>
              )}
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">${product.price / 100}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{product.description}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    {product.storageLimit} GB Storage
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    {product.transferLimit || "Unlimited"} Transfer
                  </li>
                </ul>
                <Button 
                  className="w-full" 
                  variant={product.price > 0 && product.price < 5000 ? "primary" : "outline"}
                  disabled={isSubscribing || loadingId !== null}
                  onClick={() => handleSubscribe(product.id)}
                  data-testid={`button-select-plan-${product.id}`}
                >
                  {loadingId === product.id ? <Loader2 className="animate-spin" /> : "Select Plan"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Invoices Section */}
        <h2 className="text-xl font-bold font-display mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" /> Invoices
        </h2>
        <Card className="mb-8">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                    <TableCell className="font-medium" data-testid={`text-invoice-number-${invoice.id}`}>{invoice.invoiceNumber}</TableCell>
                    <TableCell data-testid={`text-invoice-date-${invoice.id}`}>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell data-testid={`text-invoice-amount-${invoice.id}`}>${(invoice.totalAmount / 100).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(invoice.status)} data-testid={`badge-invoice-status-${invoice.id}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
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
                        Download
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
              <DialogTitle>{dialogMode === 'upgrade' ? 'Upgrade Your Plan' : 'Downgrade Your Plan'}</DialogTitle>
              <DialogDescription>
                {dialogMode === 'upgrade' 
                  ? 'Choose a plan with more features and resources to grow your business.'
                  : 'Select a smaller plan if you need fewer resources. Changes take effect at the next billing cycle.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
              {products?.map((product) => (
                <Card key={product.id} className="flex flex-col" data-testid={`dialog-card-plan-${product.id}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <div className="mt-1">
                      <span className="text-2xl font-bold">${product.price / 100}</span>
                      <span className="text-sm text-muted-foreground">/mo</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col pt-2">
                    <ul className="space-y-2 mb-4 flex-1 text-sm">
                      <li className="flex items-center">
                        <Check className="h-3 w-3 text-green-500 mr-2" />
                        {product.storageLimit} GB Storage
                      </li>
                      <li className="flex items-center">
                        <Check className="h-3 w-3 text-green-500 mr-2" />
                        {product.transferLimit || "Unlimited"} Transfer
                      </li>
                      <li className="flex items-center">
                        <Check className="h-3 w-3 text-green-500 mr-2" />
                        24/7 Support
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
                      {loadingId === product.id ? <Loader2 className="animate-spin h-4 w-4" /> : "Select"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <DialogFooter>
              <Button variant="ghost" onClick={() => setPlanDialogOpen(false)} data-testid="button-cancel-plan-change">
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quota Request Dialog */}
        <Dialog open={quotaDialogOpen} onOpenChange={setQuotaDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Quota Increase</DialogTitle>
              <DialogDescription>
                Submit a request to increase your storage quota. Current quota: {currentAccount?.storageQuotaGB || 100} GB
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <HardDrive className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Current Storage Used</p>
                    <p className="text-xl font-bold">{usage.storageUsedGB} GB / {currentAccount?.storageQuotaGB || 100} GB</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="requested-quota">Requested Quota (GB)</Label>
                <Input
                  id="requested-quota"
                  type="number"
                  min={(currentAccount?.storageQuotaGB || 100) + 1}
                  value={requestedQuota}
                  onChange={(e) => setRequestedQuota(e.target.value)}
                  placeholder={`Enter quota greater than ${currentAccount?.storageQuotaGB || 100} GB`}
                  data-testid="input-requested-quota"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quota-reason">Reason for increase (optional)</Label>
                <Textarea
                  id="quota-reason"
                  value={quotaReason}
                  onChange={(e) => setQuotaReason(e.target.value)}
                  placeholder="Explain why you need additional storage..."
                  className="resize-none"
                  data-testid="input-quota-reason"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setQuotaDialogOpen(false)} data-testid="button-quota-cancel">
                Cancel
              </Button>
              <Button onClick={handleCreateQuotaRequest} disabled={isCreatingQuotaRequest} data-testid="button-quota-submit">
                {isCreatingQuotaRequest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
