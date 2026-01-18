import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useMyAccounts } from "@/hooks/use-accounts";
import { useBuckets } from "@/hooks/use-buckets";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input } from "@/components/ui-custom";
import { Loader2, HardDrive, Copy, Eye, EyeOff, RefreshCw, Key, Server, Lock, Database, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SftpCredential, Bucket } from "@shared/schema";

export default function SftpAccess() {
  const { data: accounts } = useMyAccounts();
  const currentAccount = accounts?.[0];
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);

  const { data: sftpCredential, isLoading: isLoadingCredential } = useQuery<SftpCredential | null>({
    queryKey: ['/api/accounts', currentAccount?.id, 'sftp'],
    enabled: !!currentAccount?.id,
  });

  const { data: buckets, isLoading: isLoadingBuckets } = useBuckets(currentAccount?.id);

  const createCredentialsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/accounts/${currentAccount?.id}/sftp`);
      return res.json();
    },
    onSuccess: (data: SftpCredential & { rawPassword: string }) => {
      setNewPassword(data.rawPassword);
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', currentAccount?.id, 'sftp'] });
      toast({ title: "SFTP credentials created!", description: "Save your password now. It won't be shown again." });
    },
    onError: () => {
      toast({ title: "Failed to create credentials", variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/accounts/${currentAccount?.id}/sftp/reset-password`);
      return res.json();
    },
    onSuccess: (data: SftpCredential & { rawPassword: string }) => {
      setNewPassword(data.rawPassword);
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', currentAccount?.id, 'sftp'] });
      toast({ title: "Password reset successfully!", description: "Save your new password now. It won't be shown again." });
    },
    onError: () => {
      toast({ title: "Failed to reset password", variant: "destructive" });
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied to clipboard` });
  };

  const sftpHost = "sftp.cloudstorage.example.com";
  const sftpPort = "22";

  const connectionString = sftpCredential 
    ? `sftp://${sftpCredential.username}@${sftpHost}:${sftpPort}`
    : "";

  const isLoading = isLoadingCredential || isLoadingBuckets;

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 ml-72 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">SFTP Access</h1>
            <p className="text-muted-foreground">
              Connect to your storage via SFTP for file transfers and integrations.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : !sftpCredential ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <HardDrive className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No SFTP Credentials</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Generate SFTP credentials to access your buckets via SFTP protocol for file uploads and downloads.
                </p>
                <Button
                  onClick={() => createCredentialsMutation.mutate()}
                  disabled={createCredentialsMutation.isPending}
                  data-testid="button-generate-credentials"
                >
                  {createCredentialsMutation.isPending && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                  <Key className="mr-2 h-4 w-4" />
                  Generate Credentials
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Connection Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Host</label>
                      <div className="flex items-center gap-2">
                        <Input 
                          value={sftpHost} 
                          readOnly 
                          className="font-mono bg-muted" 
                          data-testid="input-sftp-host"
                        />
                        <Button 
                          size="icon" 
                          variant="outline" 
                          onClick={() => copyToClipboard(sftpHost, "Host")}
                          data-testid="button-copy-host"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Port</label>
                      <div className="flex items-center gap-2">
                        <Input 
                          value={sftpPort} 
                          readOnly 
                          className="font-mono bg-muted w-24" 
                          data-testid="input-sftp-port"
                        />
                        <Button 
                          size="icon" 
                          variant="outline" 
                          onClick={() => copyToClipboard(sftpPort, "Port")}
                          data-testid="button-copy-port"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Username</label>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={sftpCredential.username} 
                        readOnly 
                        className="font-mono bg-muted" 
                        data-testid="input-sftp-username"
                      />
                      <Button 
                        size="icon" 
                        variant="outline" 
                        onClick={() => copyToClipboard(sftpCredential.username, "Username")}
                        data-testid="button-copy-username"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {newPassword && (
                    <div className="space-y-2 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Save this password - it won't be shown again!</span>
                      </div>
                      <label className="text-sm font-medium text-muted-foreground">Password</label>
                      <div className="flex items-center gap-2">
                        <Input 
                          value={showPassword ? newPassword : "••••••••••••••••••••"}
                          readOnly 
                          className="font-mono bg-white dark:bg-background" 
                          data-testid="input-sftp-password"
                        />
                        <Button 
                          size="icon" 
                          variant="outline" 
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          onClick={() => copyToClipboard(newPassword, "Password")}
                          data-testid="button-copy-password"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Connection String</label>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={connectionString} 
                        readOnly 
                        className="font-mono bg-muted text-sm" 
                        data-testid="input-connection-string"
                      />
                      <Button 
                        size="icon" 
                        variant="outline" 
                        onClick={() => copyToClipboard(connectionString, "Connection string")}
                        data-testid="button-copy-connection-string"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => resetPasswordMutation.mutate()}
                      disabled={resetPasswordMutation.isPending}
                      data-testid="button-reset-password"
                    >
                      {resetPasswordMutation.isPending && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset Password
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Generate a new password. Current password will be invalidated.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Accessible Buckets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {buckets && buckets.length > 0 ? (
                    <div className="space-y-3">
                      {buckets.map((bucket: Bucket) => (
                        <div 
                          key={bucket.id} 
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          data-testid={`bucket-row-${bucket.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <Database className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium" data-testid={`text-bucket-name-${bucket.id}`}>{bucket.name}</p>
                              <p className="text-xs text-muted-foreground">Region: {bucket.region}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={bucket.isPublic ? "secondary" : "outline"}>
                              {bucket.isPublic ? "Public" : "Private"}
                            </Badge>
                            <Badge variant="outline">
                              <Lock className="h-3 w-3 mr-1" />
                              /{bucket.name}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Database className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No buckets created yet.</p>
                      <p className="text-sm text-muted-foreground">Create buckets in the Storage section to access them via SFTP.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Start Guide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Using Command Line</h4>
                    <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                      sftp {sftpCredential.username}@{sftpHost}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Using FileZilla or similar clients</h4>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                      <li>Open your SFTP client</li>
                      <li>Enter Host: <code className="bg-muted px-1 rounded">{sftpHost}</code></li>
                      <li>Enter Port: <code className="bg-muted px-1 rounded">{sftpPort}</code></li>
                      <li>Enter Username: <code className="bg-muted px-1 rounded">{sftpCredential.username}</code></li>
                      <li>Enter your password and connect</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
