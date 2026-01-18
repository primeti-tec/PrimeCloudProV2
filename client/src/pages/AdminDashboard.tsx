import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useAdminAccounts, useApproveAccount, useRejectAccount, useSuspendAccount, useReactivateAccount, useAdjustQuota } from "@/hooks/use-admin";
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

const mrrHistoryData = [
  { name: 'Aug', mrr: 4200 },
  { name: 'Sep', mrr: 5100 },
  { name: 'Oct', mrr: 6300 },
  { name: 'Nov', mrr: 7500 },
  { name: 'Dec', mrr: 8900 },
  { name: 'Jan', mrr: 9800 },
];

const signupsData = [
  { name: 'Aug', signups: 12 },
  { name: 'Sep', signups: 18 },
  { name: 'Oct', signups: 24 },
  { name: 'Nov', signups: 31 },
  { name: 'Dec', signups: 28 },
  { name: 'Jan', signups: 35 },
];

export default function AdminDashboard() {
  const { data: accounts, isLoading } = useAdminAccounts();
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
        toast({ title: "Account Approved", description: `${accountName} is now active.` });
      },
    });
  };

  const handleReject = (accountId: number, accountName: string) => {
    if (confirm(`Are you sure you want to reject "${accountName}"?`)) {
      reject({ id: accountId }, {
        onSuccess: () => {
          toast({ title: "Account Rejected", description: `${accountName} has been rejected.`, variant: "destructive" });
        },
      });
    }
  };

  const handleSuspend = (accountId: number, accountName: string) => {
    if (confirm(`Are you sure you want to suspend "${accountName}"?`)) {
      suspend({ id: accountId }, {
        onSuccess: () => {
          toast({ title: "Account Suspended", description: `${accountName} has been suspended.`, variant: "destructive" });
        },
      });
    }
  };

  const handleReactivate = (accountId: number, accountName: string) => {
    reactivate(accountId, {
      onSuccess: () => {
        toast({ title: "Account Reactivated", description: `${accountName} is now active again.` });
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
      toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    const quotaValue = parseInt(newQuotaGB);
    if (isNaN(quotaValue) || quotaValue < 1) {
      toast({ title: "Error", description: "Quota must be a positive number.", variant: "destructive" });
      return;
    }
    adjustQuota({ id: selectedAccount.id, quotaGB: quotaValue, reason: quotaReason.trim() }, {
      onSuccess: () => {
        toast({ title: "Quota Adjusted", description: `${selectedAccount.name}'s quota updated to ${quotaValue} GB.` });
        setQuotaDialogOpen(false);
        setSelectedAccount(null);
      },
    });
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return "0 GB";
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  const openProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description || "",
        price: product.price,
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
        storageLimit: 100,
        transferLimit: 0,
        isPublic: true,
      });
    }
    setProductDialogOpen(true);
  };

  const handleSaveProduct = () => {
    if (!productForm.name.trim()) {
      toast({ title: "Error", description: "Product name is required.", variant: "destructive" });
      return;
    }
    if (productForm.storageLimit < 1) {
      toast({ title: "Error", description: "Storage limit must be at least 1 GB.", variant: "destructive" });
      return;
    }

    const productData = {
      name: productForm.name.trim(),
      description: productForm.description.trim() || undefined,
      price: productForm.price,
      storageLimit: productForm.storageLimit,
      transferLimit: productForm.transferLimit || undefined,
      isPublic: productForm.isPublic,
    };

    if (editingProduct) {
      updateProduct({ id: editingProduct.id, data: productData }, {
        onSuccess: () => {
          toast({ title: "Product Updated", description: `${productForm.name} has been updated.` });
          setProductDialogOpen(false);
        },
      });
    } else {
      createProduct(productData, {
        onSuccess: () => {
          toast({ title: "Product Created", description: `${productForm.name} has been created.` });
          setProductDialogOpen(false);
        },
      });
    }
  };

  const handleDeleteProduct = (product: Product) => {
    if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      deleteProduct(product.id, {
        onSuccess: () => {
          toast({ title: "Product Deleted", description: `${product.name} has been deleted.`, variant: "destructive" });
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
          toast({ title: "Quota Request Approved", description: `${selectedQuotaRequest.account.name}'s quota increased to ${selectedQuotaRequest.requestedQuotaGB} GB.` });
          setQuotaReviewDialogOpen(false);
        },
      });
    } else {
      rejectQuotaRequest({ id: selectedQuotaRequest.id, note: quotaReviewNote || undefined }, {
        onSuccess: () => {
          toast({ title: "Quota Request Rejected", description: `${selectedQuotaRequest.account.name}'s request has been rejected.`, variant: "destructive" });
          setQuotaReviewDialogOpen(false);
        },
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-background">
      <Sidebar />
      <main className="flex-1 ml-72 p-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="destructive" data-testid="badge-admin">Super Admin</Badge>
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-foreground" data-testid="text-page-title">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage accounts and view platform metrics.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Accounts</p>
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
              <p className="text-sm font-medium text-muted-foreground mb-1">Active Accounts</p>
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
              <p className="text-sm font-medium text-muted-foreground mb-1">Pending Approval</p>
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
              <p className="text-sm font-medium text-muted-foreground mb-1">MRR</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-foreground" data-testid="text-mrr">
                ${((activeAccounts.length * 99)).toLocaleString()}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Monthly Recurring Revenue</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-red-500/10">
                  <TrendingDown className="h-6 w-6 text-red-500" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Churn Rate</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-foreground" data-testid="text-churn-rate">
                {totalAccounts > 0 ? ((suspendedAccounts.length / totalAccounts) * 100).toFixed(1) : 0}%
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
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
              <h3 className="text-2xl font-bold text-slate-900 dark:text-foreground" data-testid="text-cac">$45</h3>
              <p className="text-xs text-muted-foreground mt-1">Acquisition Cost</p>
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
              <h3 className="text-2xl font-bold text-slate-900 dark:text-foreground" data-testid="text-ltv">$1,188</h3>
              <p className="text-xs text-muted-foreground mt-1">Lifetime Value</p>
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
                ${activeAccounts.length > 0 ? Math.round((activeAccounts.length * 99) / activeAccounts.length) : 0}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Avg Revenue Per User</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-indigo-500/10">
                  <UserPlus className="h-6 w-6 text-indigo-500" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">New Signups</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-foreground" data-testid="text-new-signups">35</h3>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="shadow-md border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">MRR Over Time</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mrrHistoryData}>
                  <defs>
                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6300FF" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6300FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value.toLocaleString()}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'MRR']}
                  />
                  <Area type="monotone" dataKey="mrr" stroke="#6300FF" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-md border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">New Signups per Month</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={signupsData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [value, 'Signups']}
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
                Quota Requests ({pendingQuotaRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-purple-100/50 dark:bg-purple-900/30 border-b border-purple-200 dark:border-purple-800">
                  <tr>
                    <th className="text-left p-4 pl-6 text-sm font-medium text-purple-800 dark:text-purple-200">Account</th>
                    <th className="text-left p-4 text-sm font-medium text-purple-800 dark:text-purple-200">Current</th>
                    <th className="text-left p-4 text-sm font-medium text-purple-800 dark:text-purple-200">Requested</th>
                    <th className="text-left p-4 text-sm font-medium text-purple-800 dark:text-purple-200">Reason</th>
                    <th className="text-left p-4 text-sm font-medium text-purple-800 dark:text-purple-200">Requested</th>
                    <th className="text-right p-4 pr-6 text-sm font-medium text-purple-800 dark:text-purple-200">Actions</th>
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
                        {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => openQuotaReviewDialog(request, 'approve')}
                            disabled={isApprovingQuota || isRejectingQuota}
                            data-testid={`button-approve-quota-${request.id}`}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" /> Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-destructive border-destructive/30"
                            onClick={() => openQuotaReviewDialog(request, 'reject')}
                            disabled={isApprovingQuota || isRejectingQuota}
                            data-testid={`button-reject-quota-${request.id}`}
                          >
                            <XCircle className="mr-1 h-4 w-4" /> Reject
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
                Pending Approvals ({pendingAccounts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-yellow-100/50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800">
                  <tr>
                    <th className="text-left p-4 pl-6 text-sm font-medium text-yellow-800 dark:text-yellow-200">Account Name</th>
                    <th className="text-left p-4 text-sm font-medium text-yellow-800 dark:text-yellow-200">Document</th>
                    <th className="text-left p-4 text-sm font-medium text-yellow-800 dark:text-yellow-200">Requested</th>
                    <th className="text-right p-4 pr-6 text-sm font-medium text-yellow-800 dark:text-yellow-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-100 dark:divide-yellow-800">
                  {pendingAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-yellow-50/50 dark:hover:bg-yellow-900/20 transition-colors" data-testid={`row-pending-${account.id}`}>
                      <td className="p-4 pl-6">
                        <span className="font-medium text-slate-900 dark:text-foreground">{account.name}</span>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-muted-foreground">
                        {account.document ? `${account.documentType?.toUpperCase()}: ${account.document}` : 'Not provided'}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {account.createdAt ? new Date(account.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleApprove(account.id, account.name)} 
                            disabled={isApproving}
                            data-testid={`button-approve-${account.id}`}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" /> Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-destructive border-destructive/30"
                            onClick={() => handleReject(account.id, account.name)}
                            disabled={isRejecting}
                            data-testid={`button-reject-${account.id}`}
                          >
                            <XCircle className="mr-1 h-4 w-4" /> Reject
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
              Active Accounts ({activeAccounts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : activeAccounts.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No active accounts yet.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-4 pl-6 text-sm font-medium text-muted-foreground">Account</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Document</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Storage Usage</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Quota</th>
                    <th className="text-right p-4 pr-6 text-sm font-medium text-muted-foreground">Actions</th>
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
                              <Badge variant="destructive" className="text-xs">High</Badge>
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
                              <Pause className="mr-1 h-4 w-4" /> Suspend
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
                Suspended Accounts ({suspendedAccounts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-red-100/50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800">
                  <tr>
                    <th className="text-left p-4 pl-6 text-sm font-medium text-red-800 dark:text-red-200">Account Name</th>
                    <th className="text-left p-4 text-sm font-medium text-red-800 dark:text-red-200">Document</th>
                    <th className="text-left p-4 text-sm font-medium text-red-800 dark:text-red-200">Quota</th>
                    <th className="text-right p-4 pr-6 text-sm font-medium text-red-800 dark:text-red-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100 dark:divide-red-800">
                  {suspendedAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-colors" data-testid={`row-suspended-${account.id}`}>
                      <td className="p-4 pl-6">
                        <span className="font-medium text-slate-900 dark:text-foreground">{account.name}</span>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-muted-foreground">
                        {account.document ? `${account.documentType?.toUpperCase()}: ${account.document}` : 'Not provided'}
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
                          <Play className="mr-1 h-4 w-4" /> Reactivate
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
              Products/Plans
            </CardTitle>
            <Button onClick={() => openProductDialog()} data-testid="button-create-product">
              <Plus className="mr-1 h-4 w-4" /> Create Product
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {productsLoading ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : !products || products.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No products yet. Create your first product to get started.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-4 pl-6 text-sm font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Price</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Storage Limit</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Transfer Limit</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-4 pr-6 text-sm font-medium text-muted-foreground">Actions</th>
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
                      <td className="p-4 text-sm font-medium">{formatCurrency(product.price)}/mo</td>
                      <td className="p-4 text-sm">{product.storageLimit} GB</td>
                      <td className="p-4 text-sm">{product.transferLimit ? `${product.transferLimit} GB` : 'Unlimited'}</td>
                      <td className="p-4">
                        {product.isPublic ? (
                          <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">Public</Badge>
                        ) : (
                          <Badge variant="secondary">Private</Badge>
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
                            <Pencil className="mr-1 h-4 w-4" /> Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-destructive border-destructive/30"
                            onClick={() => handleDeleteProduct(product)}
                            disabled={isDeletingProduct}
                            data-testid={`button-delete-product-${product.id}`}
                          >
                            <Trash2 className="mr-1 h-4 w-4" /> Delete
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Accounts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : accounts?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No accounts yet.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-4 pl-6 text-sm font-medium text-muted-foreground">Account</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Document</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Phone</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Quota</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Created</th>
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
                          <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">Active</Badge>
                        ) : account.status === 'suspended' ? (
                          <Badge variant="destructive">Suspended</Badge>
                        ) : account.status === 'rejected' ? (
                          <Badge variant="destructive">Rejected</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300">Pending</Badge>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        <span className="font-medium">{account.storageQuotaGB || 100} GB</span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {account.createdAt ? new Date(account.createdAt).toLocaleDateString() : 'N/A'}
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
            <DialogTitle>Adjust Storage Quota</DialogTitle>
            <DialogDescription>
              Adjust the storage quota for {selectedAccount?.name}. Current quota: {selectedAccount?.storageQuotaGB || 100} GB
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quota">New Quota (GB)</Label>
              <Input
                id="quota"
                type="number"
                min="1"
                value={newQuotaGB}
                onChange={(e) => setNewQuotaGB(e.target.value)}
                placeholder="Enter quota in GB"
                data-testid="input-quota"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for adjustment</Label>
              <Textarea
                id="reason"
                value={quotaReason}
                onChange={(e) => setQuotaReason(e.target.value)}
                placeholder="Provide a reason for this quota change (required for audit log)"
                className="resize-none"
                data-testid="input-quota-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuotaDialogOpen(false)} data-testid="button-quota-cancel">
              Cancel
            </Button>
            <Button onClick={handleAdjustQuota} disabled={isAdjustingQuota} data-testid="button-quota-save">
              {isAdjustingQuota ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quota Review Dialog */}
      <Dialog open={quotaReviewDialogOpen} onOpenChange={setQuotaReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {quotaReviewAction === 'approve' ? 'Approve Quota Request' : 'Reject Quota Request'}
            </DialogTitle>
            <DialogDescription>
              {quotaReviewAction === 'approve' 
                ? `Approve ${selectedQuotaRequest?.account.name}'s request to increase quota from ${selectedQuotaRequest?.currentQuotaGB} GB to ${selectedQuotaRequest?.requestedQuotaGB} GB.`
                : `Reject ${selectedQuotaRequest?.account.name}'s quota increase request.`
              }
            </DialogDescription>
          </DialogHeader>
          {selectedQuotaRequest?.reason && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Reason provided:</p>
              <p className="text-sm text-muted-foreground">{selectedQuotaRequest.reason}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="review-note">Note (optional)</Label>
            <Textarea
              id="review-note"
              value={quotaReviewNote}
              onChange={(e) => setQuotaReviewNote(e.target.value)}
              placeholder={quotaReviewAction === 'approve' ? 'Add a note for this approval...' : 'Reason for rejection...'}
              className="resize-none"
              data-testid="input-quota-review-note"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuotaReviewDialogOpen(false)} data-testid="button-quota-review-cancel">
              Cancel
            </Button>
            <Button 
              onClick={handleQuotaReview} 
              disabled={isApprovingQuota || isRejectingQuota}
              variant={quotaReviewAction === 'approve' ? 'primary' : 'destructive'}
              data-testid="button-quota-review-confirm"
            >
              {(isApprovingQuota || isRejectingQuota) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {quotaReviewAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Create/Edit Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Create Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? `Update the details for ${editingProduct.name}.` : 'Create a new product/plan for your customers.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Name *</Label>
              <Input
                id="product-name"
                value={productForm.name}
                onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Pro Plan"
                data-testid="input-product-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                value={productForm.description}
                onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this product..."
                className="resize-none"
                data-testid="input-product-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-price">Price (cents) - ${(productForm.price / 100).toFixed(2)}/mo</Label>
              <Input
                id="product-price"
                type="number"
                min="0"
                value={productForm.price}
                onChange={(e) => setProductForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                placeholder="e.g. 999 for $9.99"
                data-testid="input-product-price"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-storage">Storage Limit (GB) *</Label>
                <Input
                  id="product-storage"
                  type="number"
                  min="1"
                  value={productForm.storageLimit}
                  onChange={(e) => setProductForm(prev => ({ ...prev, storageLimit: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g. 100"
                  data-testid="input-product-storage"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-transfer">Transfer Limit (GB)</Label>
                <Input
                  id="product-transfer"
                  type="number"
                  min="0"
                  value={productForm.transferLimit}
                  onChange={(e) => setProductForm(prev => ({ ...prev, transferLimit: parseInt(e.target.value) || 0 }))}
                  placeholder="0 = Unlimited"
                  data-testid="input-product-transfer"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="product-public">Public</Label>
                <p className="text-sm text-muted-foreground">Make this product visible to customers</p>
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
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProduct} 
              disabled={isCreatingProduct || isUpdatingProduct}
              data-testid="button-product-save"
            >
              {(isCreatingProduct || isUpdatingProduct) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
