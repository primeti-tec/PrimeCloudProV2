import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useMyAccounts } from "@/hooks/use-accounts";
import { useBuckets, useCreateBucket, useDeleteBucket, useUpdateBucketVersioning, useBucketLifecycle, useAddLifecycleRule, useDeleteLifecycleRule } from "@/hooks/use-buckets";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui-custom";
import { DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Database, Plus, Trash2, Globe, Lock, MapPin, Copy, Clock, Settings2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Bucket, LifecycleRule } from "@shared/schema";

const REGIONS = [
  { value: "sa-east-1", label: "Brasil (São Paulo)" },
  { value: "us-east-1", label: "EUA (Virginia)" },
  { value: "us-west-2", label: "EUA (Oregon)" },
  { value: "eu-west-1", label: "Europa (Irlanda)" },
  { value: "ap-southeast-1", label: "Ásia (Singapura)" },
];

const STORAGE_CLASSES = [
  { value: "STANDARD_IA", label: "Standard-IA (Acesso Infrequente)" },
  { value: "GLACIER", label: "Glacier (Arquivo)" },
  { value: "DEEP_ARCHIVE", label: "Glacier Deep Archive" },
];

function LifecyclePolicyDialog({ bucket, accountId }: { bucket: Bucket; accountId: number }) {
  const { data: rules, isLoading } = useBucketLifecycle(accountId, bucket.id);
  const { mutate: addRule, isPending: isAdding } = useAddLifecycleRule(accountId);
  const { mutate: deleteRule, isPending: isDeleting } = useDeleteLifecycleRule(accountId);
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [ruleType, setRuleType] = useState<"expiration" | "transition">("expiration");
  const [days, setDays] = useState(30);
  const [storageClass, setStorageClass] = useState("GLACIER");

  const handleAddRule = () => {
    if (!ruleName.trim()) return;

    const newRule: LifecycleRule = {
      id: crypto.randomUUID(),
      name: ruleName,
      type: ruleType,
      days,
      storageClass: ruleType === "transition" ? storageClass : undefined,
      enabled: true,
    };

    addRule(
      { bucketId: bucket.id, rule: newRule },
      {
        onSuccess: () => {
          toast({ title: "Regra adicionada", description: `A regra de lifecycle "${ruleName}" foi criada.` });
          setRuleName("");
          setDays(30);
        },
        onError: () => {
          toast({ title: "Erro", description: "Falha ao adicionar regra de lifecycle.", variant: "destructive" });
        },
      }
    );
  };

  const handleDeleteRule = (ruleId: string, name: string) => {
    deleteRule(
      { bucketId: bucket.id, ruleId },
      {
        onSuccess: () => {
          toast({ title: "Regra removida", description: `"${name}" foi removida.` });
        },
      }
    );
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" data-testid={`button-lifecycle-${bucket.id}`}>
          <Clock className="h-4 w-4 mr-1" /> Lifecycle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Políticas de Lifecycle - {bucket.name}</DialogTitle>
          <DialogDescription>
            Configure ações automáticas para objetos neste bucket baseadas em tempo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-medium mb-3">Adicionar Nova Regra</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Nome da Regra</label>
                <Input
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="Ex: Arquivar logs antigos"
                  className="mt-1"
                  data-testid="input-rule-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Tipo de Regra</label>
                <Select value={ruleType} onValueChange={(v) => setRuleType(v as "expiration" | "transition")}>
                  <SelectTrigger className="mt-1" data-testid="select-rule-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expiration">Expirar (Excluir)</SelectItem>
                    <SelectItem value="transition">Mover para Cold Storage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Após (dias)</label>
                <Input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                  min={1}
                  className="mt-1"
                  data-testid="input-rule-days"
                />
              </div>
              {ruleType === "transition" && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Classe de Storage</label>
                  <Select value={storageClass} onValueChange={setStorageClass}>
                    <SelectTrigger className="mt-1" data-testid="select-storage-class">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STORAGE_CLASSES.map((sc) => (
                        <SelectItem key={sc.value} value={sc.value}>
                          {sc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <Button
              onClick={handleAddRule}
              disabled={!ruleName.trim() || isAdding}
              className="mt-4"
              data-testid="button-add-rule"
            >
              {isAdding ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              Adicionar Regra
            </Button>
          </div>

          <div>
            <h4 className="font-medium mb-3">Regras Existentes</h4>
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="animate-spin h-6 w-6 text-primary" />
              </div>
            ) : rules?.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma regra de lifecycle configurada.</p>
            ) : (
              <div className="space-y-2">
                {rules?.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-white"
                    data-testid={`row-lifecycle-rule-${rule.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Settings2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{rule.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {rule.type === "expiration"
                            ? `Excluir objetos após ${rule.days} dias`
                            : `Mover para ${rule.storageClass} após ${rule.days} dias`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={rule.enabled ? "bg-green-100 text-green-700" : "bg-slate-100"}>
                        {rule.enabled ? "Ativo" : "Inativo"}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteRule(rule.id, rule.name)}
                        disabled={isDeleting}
                        data-testid={`button-delete-rule-${rule.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirmDialog({
  bucket,
  onConfirm,
  isDeleting,
}: {
  bucket: Bucket;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  const handleConfirm = () => {
    if (confirmName === bucket.name) {
      onConfirm();
      setDialogOpen(false);
      setConfirmName("");
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive" data-testid={`button-delete-${bucket.id}`}>
          <Trash2 className="h-4 w-4 mr-1" /> Excluir
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir Bucket</DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. Todos os objetos neste bucket serão permanentemente excluídos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <p className="text-sm">
            Para confirmar, digite <span className="font-mono font-bold">{bucket.name}</span> abaixo:
          </p>
          <Input
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder="Digite o nome do bucket"
            data-testid="input-confirm-delete"
          />
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={confirmName !== bucket.name || isDeleting}
            data-testid="button-confirm-delete"
          >
            {isDeleting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
            Excluir Bucket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Storage() {
  const { data: accounts } = useMyAccounts();
  const currentAccount = accounts?.[0];
  const { data: buckets, isLoading } = useBuckets(currentAccount?.id);
  const { mutate: createBucket, isPending: isCreating } = useCreateBucket(currentAccount?.id);
  const { mutate: deleteBucket, isPending: isDeleting } = useDeleteBucket(currentAccount?.id);
  const { mutate: updateVersioning } = useUpdateBucketVersioning(currentAccount?.id);
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [bucketName, setBucketName] = useState("");
  const [region, setRegion] = useState("sa-east-1");
  const [isPublic, setIsPublic] = useState(false);

  const handleCreate = () => {
    if (!bucketName.trim()) return;
    createBucket(
      { name: bucketName, region, isPublic },
      {
        onSuccess: () => {
          toast({ title: "Bucket criado!", description: `${bucketName} está disponível.` });
          setBucketName("");
          setDialogOpen(false);
        },
        onError: () => {
          toast({ title: "Erro", description: "Falha ao criar bucket.", variant: "destructive" });
        },
      }
    );
  };

  const handleDelete = (bucketId: number, bucketNameToDelete: string) => {
    deleteBucket(bucketId, {
      onSuccess: () => {
        toast({ title: "Bucket excluído", description: `${bucketNameToDelete} foi removido.` });
      },
    });
  };

  const handleVersioningToggle = (bucketId: number, enabled: boolean) => {
    updateVersioning(
      { bucketId, enabled },
      {
        onSuccess: () => {
          toast({
            title: enabled ? "Versionamento ativado" : "Versionamento desativado",
            description: enabled
              ? "As versões dos objetos serão preservadas."
              : "O versionamento de objetos foi desativado.",
          });
        },
        onError: () => {
          toast({ title: "Erro", description: "Falha ao atualizar versionamento.", variant: "destructive" });
        },
      }
    );
  };

  const copyBucketUrl = (bucket: Bucket) => {
    const url = `s3://${bucket.name}.s3.cloudstoragepro.com.br`;
    navigator.clipboard.writeText(url);
    toast({ title: "Copiado!", description: "URL do endpoint S3 copiada." });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-72 p-8">
        <header className="flex justify-between items-center mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground" data-testid="text-page-title">
              Buckets de Armazenamento
            </h1>
            <p className="text-muted-foreground">Gerencie seus buckets de armazenamento S3-compatible.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-bucket">
                <Plus className="mr-2 h-4 w-4" /> Criar Bucket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Bucket</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Nome do Bucket</label>
                  <Input
                    value={bucketName}
                    onChange={(e) => setBucketName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="meu-bucket"
                    className="mt-1 font-mono"
                    data-testid="input-bucket-name"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Apenas letras minúsculas, números e hífens</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Região</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="mt-1 w-full h-11 rounded-lg border border-input bg-background px-3 text-sm"
                    data-testid="select-region"
                  >
                    {REGIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="public"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    data-testid="checkbox-public"
                  />
                  <label htmlFor="public" className="text-sm text-slate-700">
                    Tornar bucket público
                  </label>
                </div>
                <Button onClick={handleCreate} disabled={!bucketName || isCreating} className="w-full" data-testid="button-confirm-create">
                  {isCreating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                  Criar Bucket
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Seus Buckets</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
              </div>
            ) : buckets?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Nenhum bucket ainda. Crie um para começar.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-4 pl-6 text-sm font-medium text-muted-foreground">Nome</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Região</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Objetos</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Tamanho</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Acesso</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Versionamento</th>
                      <th className="text-right p-4 pr-6 text-sm font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {buckets?.map((bucket) => (
                      <tr key={bucket.id} className="hover:bg-muted/50 transition-colors" data-testid={`row-bucket-${bucket.id}`}>
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <Database className="h-5 w-5 text-blue-500" />
                            <span className="font-medium font-mono">{bucket.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {bucket.region}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-slate-600">{bucket.objectCount ?? 0} objetos</td>
                        <td className="p-4 text-sm text-slate-600">{formatBytes(bucket.sizeBytes ?? 0)}</td>
                        <td className="p-4">
                          {bucket.isPublic ? (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              <Globe className="h-3 w-3 mr-1" /> Público
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                              <Lock className="h-3 w-3 mr-1" /> Privado
                            </Badge>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={bucket.versioningEnabled ?? false}
                              onCheckedChange={(checked) => handleVersioningToggle(bucket.id, checked)}
                              data-testid={`switch-versioning-${bucket.id}`}
                            />
                            <span className="text-xs text-muted-foreground">
                              {bucket.versioningEnabled ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 pr-6">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyBucketUrl(bucket)}
                              data-testid={`button-copy-url-${bucket.id}`}
                            >
                              <Copy className="h-4 w-4 mr-1" /> Copiar URL
                            </Button>
                            {currentAccount && (
                              <LifecyclePolicyDialog bucket={bucket} accountId={currentAccount.id} />
                            )}
                            <DeleteConfirmDialog
                              bucket={bucket}
                              onConfirm={() => handleDelete(bucket.id, bucket.name)}
                              isDeleting={isDeleting}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
