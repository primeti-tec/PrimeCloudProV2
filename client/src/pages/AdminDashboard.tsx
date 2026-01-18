import { Sidebar } from "@/components/Sidebar";
import { useAdminAccounts, useApproveAccount } from "@/hooks/use-admin";
import { Button, Card, CardContent, Badge } from "@/components/ui-custom";
import { Loader2, CheckCircle, Clock } from "lucide-react";

export default function AdminDashboard() {
  const { data: accounts, isLoading } = useAdminAccounts();
  const { mutate: approve, isPending } = useApproveAccount();

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 ml-72 p-8">
        <header className="mb-8">
          <Badge variant="destructive" className="mb-2">Super Admin Area</Badge>
          <h1 className="text-3xl font-display font-bold text-slate-900">Account Approvals</h1>
          <p className="text-muted-foreground">Review and approve new client accounts.</p>
        </header>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-4 pl-6 text-sm font-medium text-muted-foreground">Account Name</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Created At</th>
                    <th className="text-right p-4 pr-6 text-sm font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {accounts?.map((account) => (
                    <tr key={account.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6 font-medium">{account.name}</td>
                      <td className="p-4">
                        {account.status === 'active' ? (
                          <Badge variant="success" className="bg-green-100 text-green-700">Active</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Pending</Badge>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{new Date(account.createdAt!).toLocaleDateString()}</td>
                      <td className="p-4 pr-6 text-right">
                        {account.status !== 'active' && (
                          <Button size="sm" onClick={() => approve(account.id)} disabled={isPending}>
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
