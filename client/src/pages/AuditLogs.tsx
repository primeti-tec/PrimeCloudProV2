import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuditLogs, type AuditLog, type AuditLogFilters } from "@/hooks/use-audit-logs";
import { useMyAccounts } from "@/hooks/use-accounts";
import { Card, CardContent, Button } from "@/components/ui-custom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Database,
  Key,
  UserPlus,
  UserMinus,
  Shield,
  Trash2,
  Plus,
  Settings,
  FileText,
  History,
  Eye,
  AlertTriangle,
  AlertCircle,
  Info,
  XCircle,
  Search,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const ACTION_TYPES = [
  { value: "all", label: "Todas as Ações" },
  { value: "bucket.created", label: "Bucket Criado" },
  { value: "bucket.deleted", label: "Bucket Excluído" },
  { value: "access_key.created", label: "Chave Criada" },
  { value: "access_key.revoked", label: "Chave Revogada" },
  { value: "member.added", label: "Membro Adicionado" },
  { value: "member.removed", label: "Membro Removido" },
  { value: "member.role_changed", label: "Função Alterada" },
  { value: "settings.updated", label: "Configurações Atualizadas" },
  { value: "invoice.generated", label: "Fatura Gerada" },
  { value: "payment.received", label: "Pagamento Recebido" },
  { value: "quota.exceeded", label: "Quota Excedida" },
];

const SEVERITY_TYPES = [
  { value: "all", label: "Todas" },
  { value: "info", label: "Informação", icon: Info, color: "text-blue-500" },
  { value: "warning", label: "Aviso", icon: AlertTriangle, color: "text-yellow-500" },
  { value: "error", label: "Erro", icon: AlertCircle, color: "text-orange-500" },
  { value: "critical", label: "Crítico", icon: XCircle, color: "text-red-500" },
];

function getActionIcon(action: string) {
  if (action.includes("bucket.created") || action.includes("bucket_created")) return <Plus className="h-4 w-4 text-green-600" />;
  if (action.includes("bucket.deleted") || action.includes("bucket_deleted")) return <Trash2 className="h-4 w-4 text-red-600" />;
  if (action.includes("access_key.created") || action.includes("key_created")) return <Key className="h-4 w-4 text-blue-600" />;
  if (action.includes("access_key.revoked") || action.includes("key_revoked")) return <Key className="h-4 w-4 text-orange-600" />;
  if (action.includes("member.added") || action.includes("member_added")) return <UserPlus className="h-4 w-4 text-green-600" />;
  if (action.includes("member.removed") || action.includes("member_removed")) return <UserMinus className="h-4 w-4 text-red-600" />;
  if (action.includes("role_changed")) return <Shield className="h-4 w-4 text-purple-600" />;
  if (action.includes("settings")) return <Settings className="h-4 w-4 text-slate-600" />;
  if (action.includes("invoice")) return <FileText className="h-4 w-4 text-blue-600" />;
  if (action.includes("payment")) return <FileText className="h-4 w-4 text-green-600" />;
  if (action.includes("quota")) return <AlertTriangle className="h-4 w-4 text-red-600" />;
  return <FileText className="h-4 w-4 text-slate-500" />;
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case "info":
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">Info</Badge>;
    case "warning":
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">Aviso</Badge>;
    case "error":
      return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">Erro</Badge>;
    case "critical":
      return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">Crítico</Badge>;
    default:
      return <Badge variant="outline">-</Badge>;
  }
}

function formatActionLabel(action: string): string {
  const actionLabels: Record<string, string> = {
    "bucket.created": "Bucket Criado",
    "bucket.deleted": "Bucket Excluído",
    "bucket_created": "Bucket Criado",
    "bucket_deleted": "Bucket Excluído",
    "access_key.created": "Chave Criada",
    "access_key.revoked": "Chave Revogada",
    "key_created": "Chave Criada",
    "key_revoked": "Chave Revogada",
    "member.added": "Membro Adicionado",
    "member.removed": "Membro Removido",
    "member_added": "Membro Adicionado",
    "member_removed": "Membro Removido",
    "member.role_changed": "Função Alterada",
    "role_changed": "Função Alterada",
    "settings.updated": "Configurações Atualizadas",
    "settings_updated": "Configurações Atualizadas",
    "account.updated": "Conta Atualizada",
    "account.branding_updated": "Branding Atualizado",
    "invoice.generated": "Fatura Gerada",
    "payment.received": "Pagamento Recebido",
    "quota.exceeded": "Quota Excedida",
    "auth.login_failed": "Falha de Login",
    "system.error": "Erro do Sistema",
  };
  return actionLabels[action] || action
    .split(/[._]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getResourceIcon(resourceType: string) {
  switch (resourceType) {
    case "bucket":
      return <Database className="h-4 w-4 text-muted-foreground" />;
    case "access_key":
    case "key":
      return <Key className="h-4 w-4 text-muted-foreground" />;
    case "member":
      return <UserPlus className="h-4 w-4 text-muted-foreground" />;
    default:
      return <FileText className="h-4 w-4 text-muted-foreground" />;
  }
}

function getResourceTypeLabel(resourceType: string): string {
  const labels: Record<string, string> = {
    bucket: "bucket",
    access_key: "chave",
    key: "chave",
    member: "membro",
    settings: "configurações",
    account: "conta",
    invoice: "fatura",
    payment: "pagamento",
    quota: "quota",
    auth: "autenticação",
    system: "sistema",
  };
  return labels[resourceType] || resourceType;
}

export default function AuditLogs() {
  const { data: accounts } = useMyAccounts();
  const currentAccount = accounts?.[0];
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Debounce search to avoid excessive API calls
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filters: AuditLogFilters = {};
  if (actionFilter !== "all") filters.action = actionFilter;
  if (severityFilter !== "all") filters.severity = severityFilter;
  if (debouncedSearch.trim()) filters.search = debouncedSearch.trim();

  const { data: auditLogs, isLoading } = useAuditLogs(
    currentAccount?.id,
    Object.keys(filters).length > 0 ? filters : undefined
  );

  const handleClearFilters = () => {
    setActionFilter("all");
    setSeverityFilter("all");
    setSearchQuery("");
  };

  const hasActiveFilters = actionFilter !== "all" || severityFilter !== "all" || searchQuery.trim() !== "";

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Logs de Auditoria</h1>
            <p className="text-muted-foreground">Acompanhe todas as atividades na sua organização.</p>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Campo de Busca */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por ação, recurso ou IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              data-testid="search-input"
            />
          </div>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[150px]" data-testid="select-severity-filter">
              <SelectValue placeholder="Severidade" />
            </SelectTrigger>
            <SelectContent>
              {SEVERITY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[200px]" data-testid="select-action-filter">
              <SelectValue placeholder="Filtrar por ação" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value} data-testid={`filter-option-${type.value}`}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-muted-foreground">
              <XCircle className="h-4 w-4 mr-1" />
              Limpar Filtros
            </Button>
          )}
        </div>

        {/* Contador de resultados */}
        {auditLogs && auditLogs.length > 0 && (
          <p className="text-sm text-muted-foreground mb-4">
            Exibindo {auditLogs.length} registro{auditLogs.length !== 1 ? "s" : ""}
            {hasActiveFilters && " (filtrado)"}
          </p>
        )}

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="animate-spin" />
              </div>
            ) : !auditLogs || auditLogs.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <History className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum log de auditoria ainda</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Atividades na sua conta serão registradas aqui. Ações como criar buckets,
                  gerenciar chaves e alterações na equipe aparecerão neste log.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]" data-testid="audit-logs-table">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground pl-6">Data</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Usuário</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Ação</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Recurso</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Severidade</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">IP</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground pr-6">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="group hover:bg-muted/50 transition-colors" data-testid={`audit-log-row-${log.id}`}>
                        <td className="p-4 pl-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">
                              {(() => {
                                const date = new Date(log.timestamp);
                                if (isNaN(date.getTime())) return "Data Inválida";
                                return format(date, "d 'de' MMM, yyyy", { locale: ptBR });
                              })()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {(() => {
                                const date = new Date(log.timestamp);
                                if (isNaN(date.getTime())) return "-";
                                return (
                                  <>
                                    {format(date, "HH:mm", { locale: ptBR })} ({formatDistanceToNow(date, { addSuffix: true, locale: ptBR })})
                                  </>
                                );
                              })()}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                              {log.userName?.[0] || log.userEmail?.[0] || "S"}
                            </div>
                            <div>
                              <div className="font-medium text-foreground text-sm">{log.userName || "Sistema"}</div>
                              <div className="text-xs text-muted-foreground">{log.userEmail || log.context}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-muted">
                              {getActionIcon(log.action)}
                            </div>
                            <span className="text-sm font-medium text-foreground">
                              {formatActionLabel(log.action)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {getResourceIcon(log.resourceType)}
                            <div>
                              <span className="text-sm text-foreground">{log.resourceName || "-"}</span>
                              <span className="text-xs text-muted-foreground ml-1">({getResourceTypeLabel(log.resourceType)})</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {getSeverityBadge(log.severity)}
                        </td>
                        <td className="p-4">
                          <code className="text-sm bg-muted px-2 py-1 rounded font-mono text-muted-foreground">
                            {log.ipAddress}
                          </code>
                        </td>
                        <td className="p-4 pr-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                            data-testid={`view-details-${log.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Detalhes
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalhes Melhorado */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-xl">Detalhes da Atividade</DialogTitle>
              <DialogDescription>
                Registro completo da ação executada no sistema.
              </DialogDescription>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-6 pt-4">
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  {/* Linha 1 */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Ação</h4>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-muted/50 border">
                        {getActionIcon(selectedLog.action)}
                      </div>
                      <span className="font-semibold text-lg">{formatActionLabel(selectedLog.action)}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Severidade</h4>
                    <div>{getSeverityBadge(selectedLog.severity)}</div>
                  </div>

                  {/* Linha 2 */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Usuário Responsável</h4>
                    <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-lg border">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {selectedLog.userName?.[0] || selectedLog.userEmail?.[0] || "S"}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{selectedLog.userName || "Sistema"}</div>
                        <div className="text-xs text-muted-foreground">{selectedLog.userEmail || "Automático"}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Data e Hora</h4>
                    <div className="font-medium">
                      {format(new Date(selectedLog.timestamp), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(selectedLog.timestamp), "HH:mm:ss", { locale: ptBR })}
                    </div>
                  </div>

                  {/* Linha 3 */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Recurso Afetado</h4>
                    <div className="flex items-center gap-2">
                      {getResourceIcon(selectedLog.resourceType)}
                      <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded border">
                        {selectedLog.resourceName || selectedLog.resource}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Vetor (IP/Contexto)</h4>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-sm">{selectedLog.ipAddress}</span>
                      <span className="text-xs text-muted-foreground capitalize">{selectedLog.context || "contexto desconhecido"}</span>
                    </div>
                  </div>
                </div>

                {/* Detalhes Técnicos JSON */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Dados Técnicos (JSON)</h4>
                  <div className="relative">
                    <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-50 border border-zinc-800 text-xs overflow-auto max-h-60 font-mono shadow-inner">
                      {JSON.stringify(selectedLog.details || {}, null, 2)}
                    </pre>
                  </div>
                </div>

                {selectedLog.userAgent && (
                  <div className="pt-2 border-t mt-4">
                    <p className="text-[10px] text-muted-foreground truncate" title={selectedLog.userAgent}>
                      User Agent: {selectedLog.userAgent}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
