import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useMyAccounts } from "@/hooks/use-accounts";
import { useAccessKeys, useCreateAccessKey, useRevokeAccessKey, useRotateAccessKey, useToggleAccessKeyActive } from "@/hooks/use-access-keys";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui-custom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Loader2, Key, Plus, Copy, Eye, EyeOff, Trash2, AlertCircle, Download, RefreshCw, Power, MoreHorizontal, FileJson, FileText, Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

export default function ApiKeys() {
  const { data: accounts } = useMyAccounts();
  const currentAccount = accounts?.[0];
  const { data: keys, isLoading } = useAccessKeys(currentAccount?.id);
  const { mutate: createKey, isPending: isCreating } = useCreateAccessKey(currentAccount?.id);
  const { mutate: revokeKey, isPending: isRevoking } = useRevokeAccessKey(currentAccount?.id);
  const { mutate: rotateKey, isPending: isRotating } = useRotateAccessKey(currentAccount?.id);
  const { mutate: toggleActive, isPending: isToggling } = useToggleAccessKeyActive(currentAccount?.id);
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [permissions, setPermissions] = useState("read-write");
  const [newKeyData, setNewKeyData] = useState<{ accessKeyId: string; rawSecret: string } | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const [rotateDialogOpen, setRotateDialogOpen] = useState(false);
  const [rotatingKeyId, setRotatingKeyId] = useState<number | null>(null);
  const [rotatedKeyData, setRotatedKeyData] = useState<{ accessKeyId: string; rawSecret: string } | null>(null);
  const [showRotatedSecret, setShowRotatedSecret] = useState(false);

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

  const handleRotateKey = (keyId: number) => {
    setRotatingKeyId(keyId);
    setRotateDialogOpen(true);
    setRotatedKeyData(null);
    setShowRotatedSecret(false);
  };

  const confirmRotateKey = () => {
    if (!rotatingKeyId) return;
    rotateKey(rotatingKeyId, {
      onSuccess: (data: any) => {
        setRotatedKeyData({ accessKeyId: data.accessKeyId, rawSecret: data.rawSecret });
        toast({ title: "Key rotated!", description: "Save your new secret key now. It won't be shown again." });
      },
      onError: () => {
        toast({ title: "Failed to rotate key", variant: "destructive" });
        setRotateDialogOpen(false);
      },
    });
  };

  const handleToggleActive = (keyId: number, currentlyActive: boolean) => {
    toggleActive(keyId, {
      onSuccess: () => {
        toast({ 
          title: currentlyActive ? "Key deactivated" : "Key activated",
          description: currentlyActive 
            ? "This key can no longer be used for API access." 
            : "This key is now active and can be used for API access."
        });
      },
      onError: () => {
        toast({ title: "Failed to toggle key status", variant: "destructive" });
      },
    });
  };

  const downloadEnvFormat = (accessKeyId: string, keyName: string) => {
    const content = `AWS_ACCESS_KEY_ID=${accessKeyId}\nAWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY_HERE`;
    downloadFile(content, `${keyName.replace(/\s+/g, '_')}_credentials.env`, 'text/plain');
    toast({ title: "Downloaded .env format", description: "Note: Secret key is not stored. You'll need to add it manually." });
  };

  const downloadJsonFormat = (accessKeyId: string, keyName: string) => {
    const content = JSON.stringify({
      accessKeyId: accessKeyId,
      secretAccessKey: "YOUR_SECRET_KEY_HERE"
    }, null, 2);
    downloadFile(content, `${keyName.replace(/\s+/g, '_')}_credentials.json`, 'application/json');
    toast({ title: "Downloaded JSON format", description: "Note: Secret key is not stored. You'll need to add it manually." });
  };

  const downloadAwsCliFormat = (accessKeyId: string, keyName: string) => {
    const profileName = keyName.replace(/\s+/g, '-').toLowerCase();
    const content = `[${profileName}]\naws_access_key_id=${accessKeyId}\naws_secret_access_key=YOUR_SECRET_KEY_HERE`;
    downloadFile(content, `${keyName.replace(/\s+/g, '_')}_aws_credentials`, 'text/plain');
    toast({ title: "Downloaded AWS CLI format", description: "Note: Secret key is not stored. You'll need to add it manually." });
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadNewKeyEnv = () => {
    if (!newKeyData) return;
    const content = `AWS_ACCESS_KEY_ID=${newKeyData.accessKeyId}\nAWS_SECRET_ACCESS_KEY=${newKeyData.rawSecret}`;
    downloadFile(content, 'credentials.env', 'text/plain');
    toast({ title: "Downloaded .env format" });
  };

  const downloadNewKeyJson = () => {
    if (!newKeyData) return;
    const content = JSON.stringify({
      accessKeyId: newKeyData.accessKeyId,
      secretAccessKey: newKeyData.rawSecret
    }, null, 2);
    downloadFile(content, 'credentials.json', 'application/json');
    toast({ title: "Downloaded JSON format" });
  };

  const downloadNewKeyAwsCli = () => {
    if (!newKeyData) return;
    const content = `[default]\naws_access_key_id=${newKeyData.accessKeyId}\naws_secret_access_key=${newKeyData.rawSecret}`;
    downloadFile(content, 'aws_credentials', 'text/plain');
    toast({ title: "Downloaded AWS CLI format" });
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
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={downloadNewKeyEnv} data-testid="button-download-env">
                      <FileText className="h-4 w-4 mr-1" /> .env
                    </Button>
                    <Button size="sm" variant="outline" onClick={downloadNewKeyJson} data-testid="button-download-json">
                      <FileJson className="h-4 w-4 mr-1" /> JSON
                    </Button>
                    <Button size="sm" variant="outline" onClick={downloadNewKeyAwsCli} data-testid="button-download-awscli">
                      <Terminal className="h-4 w-4 mr-1" /> AWS CLI
                    </Button>
                  </div>
                  <Button onClick={() => { setNewKeyData(null); setDialogOpen(false); setShowSecret(false); }} className="w-full mt-4" data-testid="button-done">
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
                    <th className="text-right p-4 pr-6 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {keys?.map((key) => (
                    <tr key={key.id} className="hover:bg-slate-50/50 transition-colors" data-testid={`row-key-${key.id}`}>
                      <td className="p-4 pl-6 flex items-center gap-3">
                        <Key className={`h-5 w-5 ${key.isActive ? 'text-primary' : 'text-slate-400'}`} />
                        <span className={`font-medium ${!key.isActive ? 'text-slate-400' : ''}`}>{key.name}</span>
                      </td>
                      <td className={`p-4 font-mono text-sm ${key.isActive ? 'text-slate-600' : 'text-slate-400'}`}>{key.accessKeyId}</td>
                      <td className="p-4">
                        <Badge variant="secondary" className={`capitalize ${!key.isActive ? 'opacity-50' : ''}`}>{key.permissions}</Badge>
                      </td>
                      <td className="p-4">
                        {key.isActive ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-slate-200 text-slate-600">Inactive</Badge>
                        )}
                      </td>
                      <td className={`p-4 text-sm ${key.isActive ? 'text-muted-foreground' : 'text-slate-400'}`}>
                        {key.createdAt ? new Date(key.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex items-center gap-2 mr-2">
                            <Switch
                              checked={key.isActive ?? false}
                              onCheckedChange={() => handleToggleActive(key.id, key.isActive ?? false)}
                              disabled={isToggling}
                              data-testid={`switch-active-${key.id}`}
                            />
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" data-testid={`button-actions-${key.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => downloadEnvFormat(key.accessKeyId, key.name)} data-testid={`menu-download-env-${key.id}`}>
                                <FileText className="h-4 w-4 mr-2" /> Download .env
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => downloadJsonFormat(key.accessKeyId, key.name)} data-testid={`menu-download-json-${key.id}`}>
                                <FileJson className="h-4 w-4 mr-2" /> Download JSON
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => downloadAwsCliFormat(key.accessKeyId, key.name)} data-testid={`menu-download-awscli-${key.id}`}>
                                <Terminal className="h-4 w-4 mr-2" /> Download AWS CLI
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {key.isActive && (
                                <DropdownMenuItem onClick={() => handleRotateKey(key.id)} data-testid={`menu-rotate-${key.id}`}>
                                  <RefreshCw className="h-4 w-4 mr-2" /> Rotate Key
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => revokeKey(key.id)}
                                disabled={isRevoking}
                                className="text-destructive focus:text-destructive"
                                data-testid={`menu-revoke-${key.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Revoke Key
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Dialog open={rotateDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setRotateDialogOpen(false);
            setRotatedKeyData(null);
            setRotatingKeyId(null);
            setShowRotatedSecret(false);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{rotatedKeyData ? 'New Secret Key Generated' : 'Rotate Access Key'}</DialogTitle>
              {!rotatedKeyData && (
                <DialogDescription>
                  This will generate a new secret key while keeping the same access key ID. The old secret key will no longer work.
                </DialogDescription>
              )}
            </DialogHeader>
            {rotatedKeyData ? (
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <strong>Save your new secret key!</strong> This is the only time it will be displayed.
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Access Key ID</label>
                  <div className="flex mt-1 gap-2">
                    <Input value={rotatedKeyData.accessKeyId} readOnly className="font-mono text-sm" data-testid="input-rotated-access-key-id" />
                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(rotatedKeyData.accessKeyId)} data-testid="button-copy-rotated-key-id">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">New Secret Access Key</label>
                  <div className="flex mt-1 gap-2">
                    <Input
                      value={showRotatedSecret ? rotatedKeyData.rawSecret : "••••••••••••••••••••••••"}
                      readOnly
                      className="font-mono text-sm"
                      data-testid="input-rotated-secret-key"
                    />
                    <Button size="icon" variant="outline" onClick={() => setShowRotatedSecret(!showRotatedSecret)} data-testid="button-toggle-rotated-secret">
                      {showRotatedSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(rotatedKeyData.rawSecret)} data-testid="button-copy-rotated-secret">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button onClick={() => {
                  setRotateDialogOpen(false);
                  setRotatedKeyData(null);
                  setRotatingKeyId(null);
                  setShowRotatedSecret(false);
                }} className="w-full mt-4" data-testid="button-rotate-done">
                  Done
                </Button>
              </div>
            ) : (
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setRotateDialogOpen(false)} data-testid="button-rotate-cancel">
                  Cancel
                </Button>
                <Button onClick={confirmRotateKey} disabled={isRotating} data-testid="button-rotate-confirm">
                  {isRotating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Rotate Key
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
