import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useMyAccounts } from "@/hooks/use-accounts";
import { useAccessKeys, useCreateAccessKey, useRevokeAccessKey } from "@/hooks/use-access-keys";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui-custom";
import { Loader2, Key, Plus, Copy, Eye, EyeOff, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ApiKeys() {
  const { data: accounts } = useMyAccounts();
  const currentAccount = accounts?.[0];
  const { data: keys, isLoading } = useAccessKeys(currentAccount?.id);
  const { mutate: createKey, isPending: isCreating } = useCreateAccessKey(currentAccount?.id);
  const { mutate: revokeKey, isPending: isRevoking } = useRevokeAccessKey(currentAccount?.id);
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [permissions, setPermissions] = useState("read-write");
  const [newKeyData, setNewKeyData] = useState<{ accessKeyId: string; rawSecret: string } | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const handleCreate = () => {
    createKey({ name: keyName, permissions }, {
      onSuccess: (data: any) => {
        setNewKeyData({ accessKeyId: data.accessKeyId, rawSecret: data.rawSecret });
        setKeyName("");
        toast({ title: "Access key created!", description: "Save your secret key now. It won't be shown again." });
      },
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 ml-72 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900" data-testid="text-page-title">API Keys</h1>
            <p className="text-muted-foreground">Manage S3-compatible access credentials.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-key"><Plus className="mr-2 h-4 w-4" /> Create Access Key</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Access Key</DialogTitle>
              </DialogHeader>
              {newKeyData ? (
                <div className="space-y-4 mt-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <strong>Save your secret key!</strong> This is the only time it will be displayed.
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Access Key ID</label>
                    <div className="flex mt-1 gap-2">
                      <Input value={newKeyData.accessKeyId} readOnly className="font-mono text-sm" data-testid="input-access-key-id" />
                      <Button size="icon" variant="outline" onClick={() => copyToClipboard(newKeyData.accessKeyId)} data-testid="button-copy-key-id">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Secret Access Key</label>
                    <div className="flex mt-1 gap-2">
                      <Input
                        value={showSecret ? newKeyData.rawSecret : "••••••••••••••••••••••••"}
                        readOnly
                        className="font-mono text-sm"
                        data-testid="input-secret-key"
                      />
                      <Button size="icon" variant="outline" onClick={() => setShowSecret(!showSecret)} data-testid="button-toggle-secret">
                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" variant="outline" onClick={() => copyToClipboard(newKeyData.rawSecret)} data-testid="button-copy-secret">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button onClick={() => { setNewKeyData(null); setDialogOpen(false); }} className="w-full mt-4" data-testid="button-done">
                    Done
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Key Name</label>
                    <Input
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      placeholder="e.g., Production Server"
                      className="mt-1"
                      data-testid="input-key-name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Permissions</label>
                    <select
                      value={permissions}
                      onChange={(e) => setPermissions(e.target.value)}
                      className="mt-1 w-full h-11 rounded-lg border border-input bg-background px-3 text-sm"
                      data-testid="select-permissions"
                    >
                      <option value="read">Read Only</option>
                      <option value="write">Write Only</option>
                      <option value="read-write">Read & Write</option>
                    </select>
                  </div>
                  <Button onClick={handleCreate} disabled={!keyName || isCreating} className="w-full" data-testid="button-confirm-create">
                    {isCreating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                    Create Key
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Access Keys</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : keys?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No access keys yet. Create one to get started.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-4 pl-6 text-sm font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Access Key ID</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Permissions</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Created</th>
                    <th className="text-right p-4 pr-6 text-sm font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {keys?.map((key) => (
                    <tr key={key.id} className="hover:bg-slate-50/50 transition-colors" data-testid={`row-key-${key.id}`}>
                      <td className="p-4 pl-6 flex items-center gap-3">
                        <Key className="h-5 w-5 text-primary" />
                        <span className="font-medium">{key.name}</span>
                      </td>
                      <td className="p-4 font-mono text-sm text-slate-600">{key.accessKeyId}</td>
                      <td className="p-4">
                        <Badge variant="secondary" className="capitalize">{key.permissions}</Badge>
                      </td>
                      <td className="p-4">
                        {key.isActive ? (
                          <Badge variant="success" className="bg-green-100 text-green-700">Active</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-slate-200 text-slate-600">Revoked</Badge>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {key.createdAt ? new Date(key.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        {key.isActive && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => revokeKey(key.id)}
                            disabled={isRevoking}
                            data-testid={`button-revoke-${key.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Revoke
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
