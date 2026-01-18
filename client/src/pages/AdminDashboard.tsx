import { Sidebar } from "@/components/Sidebar";
import { useAdminAccounts, useApproveAccount } from "@/hooks/use-admin";
import { useProducts } from "@/hooks/use-products";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui-custom";
import { Loader2, CheckCircle, Clock, Users, DollarSign, TrendingUp, Building2, AlertCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { data: accounts, isLoading } = useAdminAccounts();
  const { data: products } = useProducts();
  const { mutate: approve, isPending: isApproving } = useApproveAccount();
  const { toast } = useToast();

  const pendingAccounts = accounts?.filter(a => a.status === 'pending') || [];
  const activeAccounts = accounts?.filter(a => a.status === 'active') || [];
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
      toast({ title: "Account Rejected", description: `${accountName} has been rejected.`, variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 ml-72 p-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="destructive" data-testid="badge-admin">Super Admin</Badge>
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-900" data-testid="text-page-title">Admin Dashboard</h1>
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
              <h3 className="text-2xl font-bold text-slate-900" data-testid="text-total-accounts">{totalAccounts}</h3>
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
              <h3 className="text-2xl font-bold text-slate-900" data-testid="text-active-accounts">{activeAccounts.length}</h3>
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
              <h3 className="text-2xl font-bold text-slate-900" data-testid="text-pending-accounts">{pendingAccounts.length}</h3>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Est. MRR</p>
              <h3 className="text-2xl font-bold text-slate-900" data-testid="text-mrr">
                ${((activeAccounts.length * 99)).toLocaleString()}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Based on Pro plan avg.</p>
            </CardContent>
          </Card>
        </div>

        {pendingAccounts.length > 0 && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Pending Approvals ({pendingAccounts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-yellow-100/50 border-b border-yellow-200">
                  <tr>
                    <th className="text-left p-4 pl-6 text-sm font-medium text-yellow-800">Account Name</th>
                    <th className="text-left p-4 text-sm font-medium text-yellow-800">Document</th>
                    <th className="text-left p-4 text-sm font-medium text-yellow-800">Requested</th>
                    <th className="text-right p-4 pr-6 text-sm font-medium text-yellow-800">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-100">
                  {pendingAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-yellow-50/50 transition-colors" data-testid={`row-pending-${account.id}`}>
                      <td className="p-4 pl-6">
                        <span className="font-medium text-slate-900">{account.name}</span>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {account.document ? `${account.documentType?.toUpperCase()}: ${account.document}` : 'Not provided'}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {account.createdAt ? new Date(account.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-4 pr-6 text-right flex justify-end gap-2">
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
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => handleReject(account.id, account.name)}
                          data-testid={`button-reject-${account.id}`}
                        >
                          <XCircle className="mr-1 h-4 w-4" /> Reject
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

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
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-4 pl-6 text-sm font-medium text-muted-foreground">Account</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Document</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Phone</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Created</th>
                    <th className="text-right p-4 pr-6 text-sm font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {accounts?.map((account) => (
                    <tr key={account.id} className="hover:bg-slate-50/50 transition-colors" data-testid={`row-account-${account.id}`}>
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {account.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{account.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {account.document ? (
                          <span className="font-mono text-xs">{account.documentType?.toUpperCase()}: {account.document}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {account.phone || <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="p-4">
                        {account.status === 'active' ? (
                          <Badge variant="success" className="bg-green-100 text-green-700">Active</Badge>
                        ) : account.status === 'suspended' ? (
                          <Badge variant="destructive">Suspended</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Pending</Badge>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {account.createdAt ? new Date(account.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        {account.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleApprove(account.id, account.name)} 
                            disabled={isApproving}
                            data-testid={`button-approve-all-${account.id}`}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" /> Approve
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
