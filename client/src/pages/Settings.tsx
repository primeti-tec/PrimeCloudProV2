import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useMyAccounts, useUpdateAccount } from "@/hooks/use-accounts";
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
import { User, Building, Bell, Shield, Loader2 } from "lucide-react";
import { validateDocument } from "@/lib/document-validation";

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
  const { toast } = useToast();

  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailDigest, setEmailDigest] = useState("daily");

  const selectedAccount = accounts?.find(a => a.id === selectedAccountId);

  useEffect(() => {
    if (accounts && accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

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
      <main className="flex-1 p-6 bg-background overflow-auto">
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
                    <p className="text-sm">CloudStorage Pro</p>
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
