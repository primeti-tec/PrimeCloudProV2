import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
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
        toast({ title: "Chave criada com sucesso!", description: "Salve sua Secret Key agora. Ela não será exibida novamente." });
      },
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado para a área de transferência" });
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
        toast({ title: "Chave rotacionada!", description: "Salve sua nova Secret Key agora. Ela não será exibida novamente." });
      },
      onError: () => {
        toast({ title: "Falha ao rotacionar chave", variant: "destructive" });
        setRotateDialogOpen(false);
      },
    });
  };

  const handleToggleActive = (keyId: number, currentlyActive: boolean) => {
    toggleActive(keyId, {
      onSuccess: () => {
        toast({
          title: currentlyActive ? "Chave desativada" : "Chave ativada",
          description: currentlyActive
            ? "Esta chave não pode mais ser usada para acesso à API."
            : "Esta chave está ativa e pode ser usada para acesso à API."
        });
      },
      onError: () => {
        toast({ title: "Falha ao alterar status da chave", variant: "destructive" });
      },
    });
  };

  const downloadEnvFormat = (accessKeyId: string, keyName: string) => {
    const content = `AWS_ACCESS_KEY_ID=${accessKeyId}\nAWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY_HERE`;
    downloadFile(content, `${keyName.replace(/\s+/g, '_')}_credentials.env`, 'text/plain');
    toast({ title: "Download .env", description: "Nota: A Secret Key não está armazenada. Você precisará adicioná-la manualmente." });
  };

  const downloadJsonFormat = (accessKeyId: string, keyName: string) => {
    const content = JSON.stringify({
      accessKeyId: accessKeyId,
      secretAccessKey: "YOUR_SECRET_KEY_HERE"
    }, null, 2);
    downloadFile(content, `${keyName.replace(/\s+/g, '_')}_credentials.json`, 'application/json');
    toast({ title: "Download JSON", description: "Nota: A Secret Key não está armazenada. Você precisará adicioná-la manualmente." });
  };

  const downloadAwsCliFormat = (accessKeyId: string, keyName: string) => {
    const profileName = keyName.replace(/\s+/g, '-').toLowerCase();
    const content = `[${profileName}]\naws_access_key_id=${accessKeyId}\naws_secret_access_key=YOUR_SECRET_KEY_HERE`;
    downloadFile(content, `${keyName.replace(/\s+/g, '_')}_aws_credentials`, 'text/plain');
    toast({ title: "Download AWS CLI", description: "Nota: A Secret Key não está armazenada. Você precisará adicioná-la manualmente." });
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
    toast({ title: "Download .env realizado" });
  };

  const downloadNewKeyJson = () => {
    if (!newKeyData) return;
    const content = JSON.stringify({
      accessKeyId: newKeyData.accessKeyId,
      secretAccessKey: newKeyData.rawSecret
    }, null, 2);
    downloadFile(content, 'credentials.json', 'application/json');
    toast({ title: "Download JSON realizado" });
  };

  const downloadNewKeyAwsCli = () => {
    if (!newKeyData) return;
    const content = `[default]\naws_access_key_id=${newKeyData.accessKeyId}\naws_secret_access_key=${newKeyData.rawSecret}`;
    downloadFile(content, 'aws_credentials', 'text/plain');
    toast({ title: "Download AWS CLI realizado" });
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 w-full">
        <header className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground" data-testid="text-page-title">Chaves de API</h1>
            <p className="text-muted-foreground">Gerencie suas credenciais de acesso S3.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-key"><Plus className="mr-2 h-4 w-4" /> Criar Access Key</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Access Key</DialogTitle>
              </DialogHeader>
              {newKeyData ? (
                <div className="space-y-4 mt-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <strong>Salve sua Secret Key!</strong> Esta é a única vez que ela será exibida.
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
                    Concluído
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Nome da Chave</label>
                    <Input
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      placeholder="Ex: Servidor de Produção"
                      className="mt-1"
                      data-testid="input-key-name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Permissões</label>
                    <select
                      value={permissions}
                      onChange={(e) => setPermissions(e.target.value)}
                      className="mt-1 w-full h-11 rounded-lg border border-input bg-background px-3 text-sm"
                      data-testid="select-permissions"
                    >
                      <option value="read">Somente Leitura</option>
                      <option value="write">Somente Escrita</option>
                      <option value="read-write">Leitura e Escrita</option>
                    </select>
                  </div>
                  <Button onClick={handleCreate} disabled={!keyName || isCreating} className="w-full" data-testid="button-confirm-create">
                    {isCreating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                    Criar Chave
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Suas Access Keys</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : keys?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Nenhuma Access Key ainda. Crie uma para começar.</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="md:hidden divide-y">
                  {keys?.map((key) => (
                    <div key={key.id} className="p-4 flex flex-col gap-4" data-testid={`card-key-${key.id}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Key className={`h-8 w-8 p-1.5 rounded-full bg-muted ${key.isActive ? 'text-primary' : 'text-slate-400'}`} />
                          <div>
                            <div className={`font-medium ${!key.isActive ? 'text-slate-400' : ''}`}>{key.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className={`capitalize text-[10px] h-5 px-1.5 ${!key.isActive ? 'opacity-50' : ''}`}>
                                {key.permissions}
                              </Badge>
                              {key.isActive ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] h-5 px-1.5">Ativo</Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-slate-200 text-slate-600 text-[10px] h-5 px-1.5">Inativo</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 -mr-2" data-testid={`button-actions-mobile-${key.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => downloadEnvFormat(key.accessKeyId, key.name)}>
                              <FileText className="h-4 w-4 mr-2" /> Download .env
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadJsonFormat(key.accessKeyId, key.name)}>
                              <FileJson className="h-4 w-4 mr-2" /> Download JSON
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadAwsCliFormat(key.accessKeyId, key.name)}>
                              <Terminal className="h-4 w-4 mr-2" /> Download AWS CLI
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {key.isActive && (
                              <DropdownMenuItem onClick={() => handleRotateKey(key.id)}>
                                <RefreshCw className="h-4 w-4 mr-2" /> Rotacionar Chave
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => revokeKey(key.id)}
                              disabled={isRevoking}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Revogar Chave
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-3 pl-1">
                        <div>
                          <span className="text-xs text-muted-foreground block mb-1">Access Key ID</span>
                          <div className={`font-mono text-xs break-all bg-muted/50 p-2 rounded border ${key.isActive ? 'text-slate-600' : 'text-slate-400'}`}>
                            {key.accessKeyId}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-muted-foreground">
                            Criado em: {key.createdAt ? new Date(key.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">Status:</span>
                            <Switch
                              checked={key.isActive ?? false}
                              onCheckedChange={() => handleToggleActive(key.id, key.isActive ?? false)}
                              disabled={isToggling}
                              className="scale-75 origin-right"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="text-left p-4 pl-6 text-sm font-medium text-muted-foreground">Nome</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Access Key ID</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Permissões</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Criado em</th>
                        <th className="text-right p-4 pr-6 text-sm font-medium text-muted-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {keys?.map((key) => (
                        <tr key={key.id} className="hover:bg-muted/50 transition-colors" data-testid={`row-key-${key.id}`}>
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
                              <Badge variant="secondary" className="bg-green-100 text-green-700">Ativo</Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-slate-200 text-slate-600">Inativo</Badge>
                            )}
                          </td>
                          <td className={`p-4 text-sm ${key.isActive ? 'text-muted-foreground' : 'text-slate-400'}`}>
                            {key.createdAt ? new Date(key.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
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
                                      <RefreshCw className="h-4 w-4 mr-2" /> Rotacionar Chave
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => revokeKey(key.id)}
                                    disabled={isRevoking}
                                    className="text-destructive focus:text-destructive"
                                    data-testid={`menu-revoke-${key.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" /> Revogar Chave
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
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
              <DialogTitle>{rotatedKeyData ? 'Nova Secret Key Gerada' : 'Rotacionar Access Key'}</DialogTitle>
              {!rotatedKeyData && (
                <DialogDescription>
                  Isso irá gerar uma nova Secret Key mantendo o mesmo Access Key ID. A Secret Key antiga deixará de funcionar.
                </DialogDescription>
              )}
            </DialogHeader>
            {rotatedKeyData ? (
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <strong>Salve sua nova Secret Key!</strong> Esta é a única vez que ela será exibida.
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
                  <label className="text-sm font-medium text-slate-700">Nova Secret Access Key</label>
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
                  Concluído
                </Button>
              </div>
            ) : (
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setRotateDialogOpen(false)} data-testid="button-rotate-cancel">
                  Cancelar
                </Button>
                <Button onClick={confirmRotateKey} disabled={isRotating} data-testid="button-rotate-confirm">
                  {isRotating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Rotacionar Chave
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>

      </div >
    </DashboardLayout >
  );
}
