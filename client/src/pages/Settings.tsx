import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sidebar } from "@/components/Sidebar";
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
import { User, Building, Bell, Shield, Loader2, Palette, Globe, CheckCircle2, XCircle, AlertCircle, Mail } from "lucide-react";
import { validateDocument } from "@/lib/document-validation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

const accountUpdateSchema = z.object({
  name: z.string().min(2, "Nome da organização é obrigatório"),
  phone: z.string().optional(),
  document: z.string().optional(),
  documentType: z.enum(["cpf", "cnpj"]).optional(),
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
      setSmtpPass(""); // Never load password for security
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
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6 bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-72 p-6 bg-background overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
            <p className="text-muted-foreground">Gerencie seu perfil e configurações da organização</p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle>Perfil</CardTitle>
                </div>
                <CardDescription>Informações da sua conta pessoal</CardDescription>
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
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">ID do Usuário</Label>
                    <p className="text-sm font-mono" data-testid="text-user-id">{user?.id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Provedor de Autenticação</Label>
                    <p className="text-sm">Prime Cloud Pro</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {accounts && accounts.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-primary" />
                      <CardTitle>Configurações da Organização</CardTitle>
                    </div>
                    {accounts.length > 1 && (
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
                  <CardDescription>Gerencie os detalhes da sua organização</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome da Organização</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Minha Empresa"
                                data-testid="input-org-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="documentType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Documento</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-document-type">
                                    <SelectValue placeholder="Selecione o tipo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="cpf">CPF (Pessoa Física)</SelectItem>
                                  <SelectItem value="cnpj">CNPJ (Pessoa Jurídica)</SelectItem>
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
                                <Input
                                  {...field}
                                  placeholder={documentType === "cpf" ? "000.000.000-00" : "00.000.000/0001-00"}
                                  data-testid="input-document"
                                />
                              </FormControl>
                              {documentValue && !documentValidation.valid && (
                                <p className="text-sm text-destructive">{documentValidation.error}</p>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="+55 11 99999-9999"
                                data-testid="input-phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                        <Button
                          type="submit"
                          disabled={updateAccount.isPending}
                          data-testid="button-save-settings"
                        >
                          {updateAccount.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            "Salvar Alterações"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Branding Section - White Label */}
            {selectedAccount && ['owner', 'admin'].includes(selectedAccount.role) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    <CardTitle>Branding (White Label)</CardTitle>
                  </div>
                  <CardDescription>
                    Personalize a aparência da aplicação com sua marca
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="branding-name">Nome da Aplicação</Label>
                    <Input
                      id="branding-name"
                      value={brandingName}
                      onChange={(e) => setBrandingName(e.target.value)}
                      placeholder="Prime Cloud Pro"
                    />
                    <p className="text-xs text-muted-foreground">
                      Deixe em branco para usar o nome padrão
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branding-logo">URL do Logo</Label>
                    <Input
                      id="branding-logo"
                      type="url"
                      value={brandingLogo}
                      onChange={(e) => setBrandingLogo(e.target.value)}
                      placeholder="https://exemplo.com/logo.png"
                    />
                    <p className="text-xs text-muted-foreground">
                      URL pública para o logo da sua marca (recomendado: 32x32px ou maior)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branding-favicon">URL do Favicon</Label>
                    <Input
                      id="branding-favicon"
                      type="url"
                      value={brandingFavicon}
                      onChange={(e) => setBrandingFavicon(e.target.value)}
                      placeholder="https://exemplo.com/favicon.ico"
                    />
                    <p className="text-xs text-muted-foreground">
                      URL pública para o favicon (ícone da aba do navegador)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="branding-primary">Cor Primária</Label>
                      <div className="flex gap-2">
                        <Input
                          id="branding-primary"
                          type="color"
                          value={brandingPrimaryColor}
                          onChange={(e) => setBrandingPrimaryColor(e.target.value)}
                          className="h-10 w-16 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={brandingPrimaryColor}
                          onChange={(e) => setBrandingPrimaryColor(e.target.value)}
                          placeholder="#2563eb"
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Cor dos botões e elementos de destaque
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="branding-sidebar">Cor da Sidebar</Label>
                      <div className="flex gap-2">
                        <Input
                          id="branding-sidebar"
                          type="color"
                          value={brandingSidebarColor}
                          onChange={(e) => setBrandingSidebarColor(e.target.value)}
                          className="h-10 w-16 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={brandingSidebarColor}
                          onChange={(e) => setBrandingSidebarColor(e.target.value)}
                          placeholder="#1e293b"
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Cor de fundo da barra lateral
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center pt-2">
                    <p className="text-sm text-muted-foreground">
                      As mudanças serão aplicadas após salvar e recarregar a página
                    </p>
                    <Button
                      onClick={handleBrandingSave}
                      disabled={updateBranding.isPending}
                    >
                      {updateBranding.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        "Salvar Branding"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Custom Domain Section */}
            {selectedAccount && ['owner', 'admin'].includes(selectedAccount.role) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <CardTitle>Domínio Personalizado</CardTitle>
                  </div>
                  <CardDescription>
                    Configure seu próprio domínio para acessar a plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-domain">Domínio ou Subdomínio</Label>
                    <Input
                      id="custom-domain"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="backup.suaempresa.com.br"
                      disabled={!!(selectedAccount.customDomain && domainStatus === "active")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Digite o domínio completo (ex: storage.minhaempresa.com)
                    </p>
                  </div>

                  {selectedAccount.customDomain && (
                    <div className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status do Domínio:</span>
                        <Badge variant={domainStatus === "active" ? "default" : domainStatus === "failed" ? "destructive" : "secondary"}>
                          {domainStatus === "active" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {domainStatus === "failed" && <XCircle className="h-3 w-3 mr-1" />}
                          {domainStatus === "pending" && <AlertCircle className="h-3 w-3 mr-1" />}
                          {domainStatus === "active" ? "Ativo" : domainStatus === "failed" ? "Falhou" : "Pendente"}
                        </Badge>
                      </div>

                      {domainStatus !== "active" && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Instruções de Configuração DNS:</p>
                            <div className="bg-muted p-3 rounded text-sm space-y-2">
                              <p className="font-mono">
                                <strong>Opção 1 (CNAME):</strong> Aponte {customDomain} para app.primecloudpro.com.br
                              </p>
                              <p className="font-mono text-xs break-all">
                                <strong>Opção 2 (TXT):</strong> Adicione TXT: primecloudpro-verification={verificationToken}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Após configurar o DNS, aguarde alguns minutos e clique em "Verificar DNS"
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <Separator />

                  <div className="flex gap-2 flex-wrap">
                    {!selectedAccount.customDomain ? (
                      <Button
                        onClick={handleDomainSave}
                        disabled={configureDomain.isPending || !customDomain}
                      >
                        {configureDomain.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Configurando...
                          </>
                        ) : (
                          "Configurar Domínio"
                        )}
                      </Button>
                    ) : (
                      <>
                        {domainStatus !== "active" && (
                          <Button
                            onClick={handleDomainVerify}
                            disabled={verifyDomain.isPending}
                          >
                            {verifyDomain.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verificando...
                              </>
                            ) : (
                              "Verificar DNS"
                            )}
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          onClick={handleDomainRemove}
                          disabled={removeDomain.isPending}
                        >
                          {removeDomain.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Removendo...
                            </>
                          ) : (
                            "Remover Domínio"
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <CardTitle>Preferências de Notificação</CardTitle>
                </div>
                <CardDescription>Configure como você recebe notificações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Notificações por E-mail</Label>
                    <p className="text-sm text-muted-foreground">Receba atualizações importantes por e-mail</p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                    data-testid="switch-notifications"
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Frequência do Resumo por E-mail</Label>
                  <Select value={emailDigest} onValueChange={setEmailDigest} disabled={!notificationsEnabled}>
                    <SelectTrigger data-testid="select-email-digest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Em tempo real</SelectItem>
                      <SelectItem value="daily">Resumo diário</SelectItem>
                      <SelectItem value="weekly">Resumo semanal</SelectItem>
                      <SelectItem value="never">Nunca</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Nota: As preferências de e-mail são salvas localmente para este MVP.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* SMTP Email Configuration Section */}
            {selectedAccount && ['owner', 'admin'].includes(selectedAccount.role) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <CardTitle>Configuração de E-mail (SMTP)</CardTitle>
                  </div>
                  <CardDescription>
                    Configure seu próprio servidor SMTP para envio de e-mails
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="smtp-enabled">Ativar SMTP Personalizado</Label>
                      <p className="text-sm text-muted-foreground">
                        Usar seu próprio servidor SMTP para enviar e-mails
                      </p>
                    </div>
                    <Switch
                      id="smtp-enabled"
                      checked={smtpEnabled}
                      onCheckedChange={setSmtpEnabled}
                    />
                  </div>

                  {smtpEnabled && (
                    <>
                      <Separator />
                      <div className="grid gap-4">
                        <div className="grid gap-2 grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="smtp-host">Servidor SMTP *</Label>
                            <Input
                              id="smtp-host"
                              value={smtpHost}
                              onChange={(e) => setSmtpHost(e.target.value)}
                              placeholder="smtp.gmail.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="smtp-port">Porta *</Label>
                            <Input
                              id="smtp-port"
                              type="number"
                              value={smtpPort}
                              onChange={(e) => setSmtpPort(parseInt(e.target.value) || 587)}
                              placeholder="587"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="smtp-encryption">Criptografia</Label>
                          <Select value={smtpEncryption} onValueChange={(value: any) => setSmtpEncryption(value)}>
                            <SelectTrigger id="smtp-encryption">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhuma</SelectItem>
                              <SelectItem value="tls">TLS (STARTTLS)</SelectItem>
                              <SelectItem value="ssl">SSL/TLS</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Porta 587 geralmente usa TLS. Porta 465 usa SSL/TLS.
                          </p>
                        </div>

                        <div className="grid gap-2 grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="smtp-user">Usuário SMTP *</Label>
                            <Input
                              id="smtp-user"
                              value={smtpUser}
                              onChange={(e) => setSmtpUser(e.target.value)}
                              placeholder="seu-email@exemplo.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="smtp-pass">Senha SMTP *</Label>
                            <Input
                              id="smtp-pass"
                              type="password"
                              value={smtpPass}
                              onChange={(e) => setSmtpPass(e.target.value)}
                              placeholder="••••••••"
                            />
                          </div>
                        </div>

                        <Separator />

                        <div className="grid gap-2 grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="smtp-from-email">E-mail Remetente</Label>
                            <Input
                              id="smtp-from-email"
                              type="email"
                              value={smtpFromEmail}
                              onChange={(e) => setSmtpFromEmail(e.target.value)}
                              placeholder="noreply@suaempresa.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="smtp-from-name">Nome do Remetente</Label>
                            <Input
                              id="smtp-from-name"
                              value={smtpFromName}
                              onChange={(e) => setSmtpFromName(e.target.value)}
                              placeholder="Sua Empresa"
                            />
                          </div>
                        </div>

                        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                          <p className="text-sm font-medium">⚠️ Informações Importantes:</p>
                          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                            <li>Gmail: Use senha de aplicativo, não sua senha normal</li>
                            <li>Office 365: smtp.office365.com, porta 587, TLS</li>
                            <li>O envio de e-mails usará estas configurações quando ativado</li>
                          </ul>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <Button
                            onClick={handleSmtpSave}
                            disabled={saveSmtpConfig.isPending}
                          >
                            {saveSmtpConfig.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                              </>
                            ) : (
                              "Salvar Configuração"
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleTestConnection}
                            disabled={testSmtpConnection.isPending || !smtpHost}
                          >
                            {testSmtpConnection.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Testando...
                              </>
                            ) : (
                              "Testar Conexão"
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle>Segurança</CardTitle>
                </div>
                <CardDescription>A autenticação é gerenciada através do seu provedor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-md bg-muted/50">
                  <div>
                    <p className="font-medium">Autenticação de Dois Fatores</p>
                    <p className="text-sm text-muted-foreground">Configure nas configurações da sua conta</p>
                  </div>
                  <Button variant="outline" data-testid="button-manage-security">
                    Gerenciar Segurança
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
