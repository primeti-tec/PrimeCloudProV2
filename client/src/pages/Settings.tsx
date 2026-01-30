
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// import { Sidebar } from "@/components/Sidebar"; // Removed
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { useMyAccounts, useUpdateAccount } from "@/hooks/use-accounts";
import { useUpdateBranding } from "@/hooks/use-current-account";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Building, Bell, Shield, Loader2, Palette, Globe, CheckCircle2, XCircle, AlertCircle, Mail, Trash2, RefreshCw, ExternalLink, Save, Key, Info } from "lucide-react";
import { validateDocument } from "@/lib/document-validation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { AppBranding } from "@/components/settings/AppBranding";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const accountUpdateSchema = z.object({
  name: z.string().min(2, "Nome da organização é obrigatório"),
  phone: z.string().optional(),
  document: z.string().optional(),
  documentType: z.enum(["cpf", "cnpj"]).optional(),
  billingEmail: z.string().email("Email inválido").optional().or(z.literal('')),
  financialContact: z.string().optional(),
  billingDay: z.coerce.number().min(1).max(28).optional(),
});

type AccountUpdateForm = z.infer<typeof accountUpdateSchema>;

export default function Settings() {
  const { user } = useAuth();
  const { data: accounts, isLoading: accountsLoading } = useMyAccounts();
  const updateAccount = useUpdateAccount();
  const updateBranding = useUpdateBranding();
  const { toast } = useToast();

  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailDigest, setEmailDigest] = useState("daily");

  // Branding state
  const [brandingName, setBrandingName] = useState("");
  const [brandingLogo, setBrandingLogo] = useState("");
  const [brandingFavicon, setBrandingFavicon] = useState("");
  const [brandingPrimaryColor, setBrandingPrimaryColor] = useState("#2563eb");
  const [brandingSidebarColor, setBrandingSidebarColor] = useState("#1e293b");

  // Custom domain state
  const [customDomain, setCustomDomain] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [domainStatus, setDomainStatus] = useState<"pending" | "active" | "failed">("pending");

  // SMTP Email configuration state
  const [smtpEnabled, setSmtpEnabled] = useState(false);
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFromEmail, setSmtpFromEmail] = useState("");
  const [smtpFromName, setSmtpFromName] = useState("");
  const [smtpEncryption, setSmtpEncryption] = useState<"none" | "ssl" | "tls">("tls");

  const selectedAccount = accounts?.find(a => a.id === selectedAccountId);

  useEffect(() => {
    if (accounts && accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Load branding and custom domain data when account changes
  useEffect(() => {
    if (selectedAccount) {
      setBrandingName(selectedAccount.brandingName || "");
      setBrandingLogo(selectedAccount.brandingLogo || "");
      setBrandingFavicon(selectedAccount.brandingFavicon || "");
      setBrandingPrimaryColor(selectedAccount.brandingPrimaryColor || "#2563eb");
      setBrandingSidebarColor(selectedAccount.brandingSidebarColor || "#1e293b");
      setCustomDomain(selectedAccount.customDomain || "");
      setDomainStatus((selectedAccount.domainStatus as any) || "pending");
      setVerificationToken(selectedAccount.dnsVerificationToken || "");

      // Load SMTP configuration
      setSmtpEnabled((selectedAccount as any).smtpEnabled || false);
      setSmtpHost((selectedAccount as any).smtpHost || "");
      setSmtpPort((selectedAccount as any).smtpPort || 587);
      setSmtpUser((selectedAccount as any).smtpUser || "");
      setSmtpPass((selectedAccount as any).smtpPass || "");
      setSmtpFromEmail((selectedAccount as any).smtpFromEmail || "");
      setSmtpFromName((selectedAccount as any).smtpFromName || "");
      setSmtpEncryption((selectedAccount as any).smtpEncryption || "tls");
    }
  }, [selectedAccount]);

  const form = useForm<AccountUpdateForm>({
    resolver: zodResolver(accountUpdateSchema),
    defaultValues: {
      name: "",
      phone: "",
      document: "",
      documentType: "cnpj",
    },
  });

  useEffect(() => {
    if (selectedAccount) {
      form.reset({
        name: selectedAccount.name || "",
        phone: selectedAccount.phone || "",
        document: selectedAccount.document || "",
        documentType: (selectedAccount.documentType as "cpf" | "cnpj") || "cnpj",
        billingEmail: selectedAccount.billingEmail || "",
        financialContact: selectedAccount.financialContact || "",
        billingDay: selectedAccount.billingDay || 10,
      });
    }
  }, [selectedAccount, form]);

  const documentValue = form.watch("document") || "";
  const documentType = form.watch("documentType") || "cnpj";

  const documentValidation = documentValue
    ? validateDocument(documentValue, documentType)
    : { valid: true };

  const onSubmit = async (data: AccountUpdateForm) => {
    if (!selectedAccountId) return;

    if (data.document && !documentValidation.valid) {
      toast({
        title: "Documento Inválido",
        description: documentValidation.error,
        variant: "destructive",
      });
      return;
    }

    // Clean up document fields: if document is empty, don't send documentType
    const payload: AccountUpdateForm = {
      name: data.name,
      phone: data.phone,
      billingEmail: data.billingEmail,
      financialContact: data.financialContact,
      billingDay: data.billingDay,
    };

    if (data.document && data.document.trim()) {
      payload.document = data.document;
      payload.documentType = data.documentType;
    }

    try {
      await updateAccount.mutateAsync({
        id: selectedAccountId,
        ...payload,
      });
      toast({
        title: "Configurações Salvas",
        description: "As configurações da sua organização foram atualizadas.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao atualizar configurações.",
        variant: "destructive",
      });
    }
  };

  const handleBrandingSave = async () => {
    if (!selectedAccountId) return;

    try {
      await updateBranding.mutateAsync({
        accountId: selectedAccountId,
        branding: {
          brandingName: brandingName || null,
          brandingLogo: brandingLogo || null,
          brandingFavicon: brandingFavicon || null,
          brandingPrimaryColor: brandingPrimaryColor || null,
          brandingSidebarColor: brandingSidebarColor || null,
        },
      });

      toast({
        title: "Branding Atualizado",
        description: "As configurações de marca foram atualizadas. Recarregue a página para ver as mudanças.",
      });

      // Reload the page after 2 seconds to apply branding changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao atualizar branding.",
        variant: "destructive",
      });
    }
  };

  // Custom Domain Mutations
  const queryClient = useQueryClient();

  const configureDomain = useMutation({
    mutationFn: async (domain: string) => {
      const res = await fetch(`/api/accounts/${selectedAccountId}/domain`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customDomain: domain }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to configure domain");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.accounts.listMy.path] });
      setVerificationToken(data.verificationToken);
      setDomainStatus("pending");
      toast({
        title: "Domínio Configurado",
        description: "Agora configure o DNS e clique em 'Verificar DNS'.",
      });
    },
  });

  const verifyDomain = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/accounts/${selectedAccountId}/domain/verify`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to verify domain");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.accounts.listMy.path] });
      setDomainStatus(data.status);
      toast({
        title: data.verified ? "Domínio Verificado!" : "Verificação Falhou",
        description: data.message,
        variant: data.verified ? "default" : "destructive",
      });
    },
  });

  const removeDomain = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/accounts/${selectedAccountId}/domain`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to remove domain");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.accounts.listMy.path] });
      setCustomDomain("");
      setVerificationToken("");
      setDomainStatus("pending");
      toast({
        title: "Domínio Removido",
        description: "O domínio personalizado foi removido.",
      });
    },
  });

  const handleDomainSave = async () => {
    if (!customDomain) {
      toast({
        title: "Erro",
        description: "Por favor, insira um domínio válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      await configureDomain.mutateAsync(customDomain);
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao configurar domínio.",
        variant: "destructive",
      });
    }
  };

  const handleDomainVerify = async () => {
    try {
      await verifyDomain.mutateAsync();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao verificar domínio.",
        variant: "destructive",
      });
    }
  };

  const handleDomainRemove = async () => {
    if (!confirm("Tem certeza que deseja remover o domínio personalizado?")) {
      return;
    }

    try {
      await removeDomain.mutateAsync();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao remover domínio.",
        variant: "destructive",
      });
    }
  };

  // SMTP Email Configuration Mutations
  const saveSmtpConfig = useMutation({
    mutationFn: async (config: any) => {
      const res = await fetch(`/api/accounts/${selectedAccountId}/email-config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to save SMTP configuration");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.accounts.listMy.path] });
      toast({
        title: "Configuração Salva",
        description: "As configurações de e-mail foram salvas com sucesso.",
      });
    },
  });

  const testSmtpConnection = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/accounts/${selectedAccountId}/email-test`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to test SMTP connection");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Teste Enviado!",
        description: data.message || "E-mail de teste enviado com sucesso.",
      });
    },
  });

  const handleSmtpSave = async () => {
    try {
      // Build config object - only include smtpPass if user entered a new password
      // This prevents overwriting existing password when user just wants to update other settings
      const config: any = {
        smtpEnabled,
        smtpHost: smtpHost || null,
        smtpPort: smtpPort || null,
        smtpUser: smtpUser || null,
        smtpFromEmail: smtpFromEmail || null,
        smtpFromName: smtpFromName || null,
        smtpEncryption: smtpEncryption || null,
      };

      // Only include password if user entered a new one
      if (smtpPass && smtpPass.trim()) {
        config.smtpPass = smtpPass;
      }

      await saveSmtpConfig.mutateAsync(config);
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao salvar configuração.",
        variant: "destructive",
      });
    }
  };


  const handleTestConnection = async () => {
    if (!smtpEnabled || !smtpHost) {
      toast({
        title: "Erro",
        description: "Configure e ative o SMTP antes de testar.",
        variant: "destructive",
      });
      return;
    }

    try {
      await testSmtpConnection.mutateAsync();
    } catch (error) {
      toast({
        title: "Erro no Teste",
        description: error instanceof Error ? error.message : "Falha ao testar conexão SMTP.",
        variant: "destructive",
      });
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'suspended': return 'Suspenso';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  if (accountsLoading) {
    return (
      <DashboardLayout>
        <div className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-8 w-full">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as configurações da sua organização e preferências.</p>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <TabsTrigger value="account" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Building className="h-4 w-4" />
              Organização
            </TabsTrigger>
            <TabsTrigger value="branding" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Palette className="h-4 w-4" />
              White Label
            </TabsTrigger>
            <TabsTrigger value="domain" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Globe className="h-4 w-4" />
              Domínio
            </TabsTrigger>
            <TabsTrigger value="email" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Mail className="h-4 w-4" />
              Email (SMTP)
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="h-4 w-4" />
              Segurança
            </TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    <CardTitle>Configurações da Organização</CardTitle>
                  </div>
                  {accounts && accounts.length > 1 && (
                    <Select
                      value={selectedAccountId?.toString()}
                      onValueChange={(v) => setSelectedAccountId(parseInt(v))}
                    >
                      <SelectTrigger className="w-[200px]" data-testid="select-organization">
                        <SelectValue placeholder="Selecionar organização" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id.toString()}>
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <CardDescription>
                  Informações principais da sua conta empresarial.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Organização</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-org-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone / WhatsApp</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="(00) 00000-0000" data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="documentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Documento</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-document-type">
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cnpj">CNPJ</SelectItem>
                                <SelectItem value="cpf">CPF</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="document"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número do Documento</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder={form.watch("documentType") === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"} data-testid="input-document" />
                            </FormControl>
                            <FormMessage />
                            {documentValue && !documentValidation.valid && (
                              <p className="text-sm text-destructive">{documentValidation.error}</p>
                            )}
                          </FormItem>
                        )}
                      />
                    </div>
                    <Separator />
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="billingEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Financeiro</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="financeiro@empresa.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="financialContact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Responsável Financeiro</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="billingDay"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dia de Vencimento</FormLabel>
                            <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o dia" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[1, 5, 10, 15, 20, 25].map((day) => (
                                  <SelectItem key={day} value={String(day)}>
                                    Dia {day}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                      <div>
                        <Label className="text-muted-foreground text-xs">Status da Conta</Label>
                        <Badge
                          className={
                            selectedAccount?.status === "active"
                              ? "bg-green-500/10 text-green-600"
                              : selectedAccount?.status === "suspended"
                                ? "bg-red-500/10 text-red-600"
                                : "bg-yellow-500/10 text-yellow-600"
                          }
                          data-testid="badge-account-status"
                        >
                          {getStatusLabel(selectedAccount?.status || '')}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Slug</Label>
                        <p className="text-sm font-mono" data-testid="text-account-slug">{selectedAccount?.slug}</p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button type="submit" className="min-w-[120px]" disabled={updateAccount.isPending} data-testid="button-save-settings">
                        {updateAccount.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Salvar Alterações
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
            <div className="mt-8">
              <Card className="border-red-200 dark:border-red-900/50">
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400">Zona de Perigo</CardTitle>
                  <CardDescription>Ações irreversíveis para sua conta.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900/30 rounded-lg bg-red-50 dark:bg-red-950/10">
                    <div>
                      <h4 className="font-semibold text-red-700 dark:text-red-300">Encerrar Conta</h4>
                      <p className="text-sm text-red-600/80 dark:text-red-400/80">Excluir permanentemente sua conta e todos os dados.</p>
                    </div>
                    <Button variant="destructive">Excluir Organização</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-8">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle>Perfil Pessoal</CardTitle>
                </div>
                <CardDescription>Informações da sua conta de usuário.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || "Usuário"} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold" data-testid="text-user-name">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid="text-user-email">{user?.email}</p>
                    {user?.email?.endsWith("@admin.com") && (
                      <Badge className="bg-primary/10 text-primary">Super Admin</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* White Label Settings */}
          <TabsContent value="branding">
            {selectedAccount && ['owner', 'admin'].includes(selectedAccount.role || '') ? (
              <AppBranding
                accountId={selectedAccount.id}
                initialData={{
                  brandingAppName: (selectedAccount as any).brandingAppName,
                  brandingIconUrl: (selectedAccount as any).brandingIconUrl,
                  brandingPrimaryColor: (selectedAccount as any).brandingPrimaryColor,
                  brandingThemeColor: (selectedAccount as any).brandingThemeColor,
                  brandingBgColor: (selectedAccount as any).brandingBgColor,
                }}
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p>Você não tem permissão para acessar estas configurações.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Custom Domain Settings */}
          <TabsContent value="domain">
            {selectedAccount && ['owner', 'admin'].includes(selectedAccount.role || '') ? (
              <Card>
                <CardHeader>
                  <CardTitle>Domínio Personalizado</CardTitle>
                  <CardDescription>Configure seu próprio domínio para acessar o painel (ex: painel.suaempresa.com)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!customDomain ? (
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label>Seu Domínio</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="painel.suaempresa.com"
                            value={customDomain}
                            onChange={(e) => setCustomDomain(e.target.value)}
                          />
                          <Button onClick={handleDomainSave} disabled={configureDomain.isPending}>
                            {configureDomain.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Configurar"}
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">Insira apenas o subdomínio/domínio sem http:// ou https://</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Globe className="h-5 w-5 text-primary" />
                          <span className="font-medium text-lg">{customDomain}</span>
                          {domainStatus === 'active' && <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>}
                          {domainStatus === 'pending' && <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pendente</Badge>}
                          {domainStatus === 'failed' && <Badge variant="destructive">Falhou</Badge>}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDomainRemove()} disabled={removeDomain.isPending} className="text-destructive hover:text-destructive/80 hover:bg-destructive/10">
                          {removeDomain.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>

                      {domainStatus !== 'active' && (
                        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
                          <Info className="h-4 w-4 text-blue-600" />
                          <AlertTitle className="text-blue-800 dark:text-blue-400">Configuração DNS Necessária</AlertTitle>
                          <AlertDescription className="text-blue-700 dark:text-blue-300 mt-2">
                            <p className="mb-2">Crie um registro <strong>CNAME</strong> no seu provedor de domínio apontando para:</p>
                            <code className="px-2 py-1 bg-white/50 dark:bg-black/20 rounded font-mono block w-fit mb-3 select-all">cname.primecloudpro.com.br</code>
                            <p className="text-xs">Após configurar, clique em Verificar DNS abaixo.</p>
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => window.open(`http://${customDomain}`, '_blank')}>
                          testar Acesso
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                        <Button onClick={handleDomainVerify} disabled={verifyDomain.isPending || domainStatus === 'active'}>
                          {verifyDomain.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                          Verificar DNS
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p>Você não tem permissão para acessar estas configurações.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* SMTP Settings */}
          <TabsContent value="email">
            {selectedAccount && ['owner', 'admin'].includes(selectedAccount.role || '') ? (
              <Card>
                <CardHeader>
                  <CardTitle>Servidor de Email (SMTP)</CardTitle>
                  <CardDescription>Configure seu próprio servidor SMTP para envio de emails transacionais.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base">Usar SMTP Próprio</Label>
                      <p className="text-sm text-muted-foreground">Desabilitado usará o servidor padrão da plataforma.</p>
                    </div>
                    <Switch checked={smtpEnabled} onCheckedChange={setSmtpEnabled} />
                  </div>

                  {smtpEnabled && (
                    <div className="space-y-6 pt-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Servidor (Host)</Label>
                          <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.exemplo.com" />
                        </div>
                        <div className="space-y-2">
                          <Label>Porta</Label>
                          <Input value={smtpPort} onChange={(e) => setSmtpPort(Number(e.target.value))} placeholder="587" type="number" />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Usuário</Label>
                          <Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="email@exemplo.com" />
                        </div>
                        <div className="space-y-2">
                          <Label>Senha</Label>
                          <Input value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} type="password" placeholder="••••••" />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Email do Remetente</Label>
                          <Input value={smtpFromEmail} onChange={(e) => setSmtpFromEmail(e.target.value)} placeholder="nao-responda@exemplo.com" />
                        </div>
                        <div className="space-y-2">
                          <Label>Nome do Remetente</Label>
                          <Input value={smtpFromName} onChange={(e) => setSmtpFromName(e.target.value)} placeholder="Minha Empresa" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Criptografia</Label>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={smtpEncryption === 'none' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSmtpEncryption('none')}
                            className="h-9 min-w-[80px]"
                          >Nenhuma</Button>
                          <Button
                            variant={smtpEncryption === 'tls' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSmtpEncryption('tls')}
                            className="h-9 min-w-[80px]"
                          >TLS (Recomendado)</Button>
                          <Button
                            variant={smtpEncryption === 'ssl' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSmtpEncryption('ssl')}
                            className="h-9 min-w-[80px]"
                          >SSL</Button>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={handleTestConnection} disabled={testSmtpConnection.isPending} className="w-full sm:w-auto">
                          {testSmtpConnection.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Testar Conexão"}
                        </Button>
                        <Button onClick={handleSmtpSave} disabled={saveSmtpConfig.isPending} className="w-full sm:w-auto">
                          {saveSmtpConfig.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                          Salvar Configurações
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p>Você não tem permissão para acessar estas configurações.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Notificações por Email</Label>
                    <p className="text-sm text-muted-foreground">Receba alertas sobre sua conta e backups.</p>
                  </div>
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                  />
                </div>
                <Separator />
                <div className="space-y-4">
                  <Label>Resumo de Atividades</Label>
                  <Select value={emailDigest} onValueChange={setEmailDigest} disabled={!notificationsEnabled}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="never">Nunca</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>Gerencie a segurança da sua conta.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">Autenticação de Dois Fatores (2FA)</h4>
                      <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança.</p>
                    </div>
                  </div>
                  <Button variant="outline">Configurar</Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                      <Key className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">Alterar Senha</h4>
                      <p className="text-sm text-muted-foreground">Última alteração ha 30 dias.</p>
                    </div>
                  </div>
                  <Button variant="outline">Alterar</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
