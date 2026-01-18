import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useAuditLogs, type AuditLog } from "@/hooks/use-audit-logs";
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
  History
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const ACTION_TYPES = [
  { value: "all", label: "All Actions" },
  { value: "bucket_created", label: "Bucket Created" },
  { value: "bucket_deleted", label: "Bucket Deleted" },
  { value: "key_created", label: "Key Created" },
  { value: "key_revoked", label: "Key Revoked" },
  { value: "member_added", label: "Member Added" },
  { value: "member_removed", label: "Member Removed" },
  { value: "role_changed", label: "Role Changed" },
  { value: "settings_updated", label: "Settings Updated" },
];

function getActionIcon(action: string) {
  switch (action) {
    case "bucket_created":
      return <Plus className="h-4 w-4 text-green-600" />;
    case "bucket_deleted":
      return <Trash2 className="h-4 w-4 text-red-600" />;
    case "key_created":
      return <Key className="h-4 w-4 text-blue-600" />;
    case "key_revoked":
      return <Key className="h-4 w-4 text-orange-600" />;
    case "member_added":
      return <UserPlus className="h-4 w-4 text-green-600" />;
    case "member_removed":
      return <UserMinus className="h-4 w-4 text-red-600" />;
    case "role_changed":
      return <Shield className="h-4 w-4 text-purple-600" />;
    case "settings_updated":
      return <Settings className="h-4 w-4 text-slate-600" />;
    default:
      return <FileText className="h-4 w-4 text-slate-500" />;
  }
}

function formatActionLabel(action: string): string {
  return action
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getResourceIcon(resourceType: string) {
  switch (resourceType) {
    case "bucket":
      return <Database className="h-4 w-4 text-muted-foreground" />;
    case "key":
      return <Key className="h-4 w-4 text-muted-foreground" />;
    case "member":
      return <UserPlus className="h-4 w-4 text-muted-foreground" />;
    default:
      return <FileText className="h-4 w-4 text-muted-foreground" />;
  }
}

export default function AuditLogs() {
  const { data: accounts } = useMyAccounts();
  const currentAccount = accounts?.[0];
  const [actionFilter, setActionFilter] = useState<string>("all");
  
  const { data: auditLogs, isLoading } = useAuditLogs(
    currentAccount?.id,
    actionFilter === "all" ? undefined : actionFilter
  );

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 ml-72 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900">Audit Logs</h1>
            <p className="text-muted-foreground">Track all activity in your organization.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-action-filter">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} data-testid={`filter-option-${type.value}`}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="animate-spin" />
              </div>
            ) : !auditLogs || auditLogs.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <History className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">No audit logs yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Activity in your account will be recorded here. Actions like creating buckets, 
                  managing keys, and team changes will appear in this log.
                </p>
              </div>
            ) : (
              <table className="w-full" data-testid="audit-logs-table">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground pl-6">Date</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Action</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Resource</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground pr-6">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="group hover:bg-slate-50/50 transition-colors" data-testid={`audit-log-row-${log.id}`}>
                      <td className="p-4 pl-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900">
                            {format(new Date(log.timestamp), "MMM d, yyyy")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.timestamp), "h:mm a")} ({formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })})
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {log.userName?.[0] || log.userEmail?.[0] || "U"}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 text-sm">{log.userName || "Unknown User"}</div>
                            <div className="text-xs text-muted-foreground">{log.userEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-slate-100">
                            {getActionIcon(log.action)}
                          </div>
                          <span className="text-sm font-medium text-slate-700">
                            {formatActionLabel(log.action)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getResourceIcon(log.resourceType)}
                          <div>
                            <span className="text-sm text-slate-900">{log.resourceName}</span>
                            <span className="text-xs text-muted-foreground ml-1">({log.resourceType})</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 pr-6">
                        <code className="text-sm bg-slate-100 px-2 py-1 rounded font-mono text-slate-600">
                          {log.ipAddress}
                        </code>
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
