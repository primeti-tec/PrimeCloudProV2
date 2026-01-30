import DashboardLayout from "@/components/layout/DashboardLayout";
import { useMembers, useRemoveMember, useUpdateMemberRole } from "@/hooks/use-members";
import { useInvitations, useCreateInvitation, useCancelInvitation } from "@/hooks/use-invitations";
import { useMyAccounts } from "@/hooks/use-accounts";
import { useBuckets } from "@/hooks/use-buckets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Trash2, UserPlus, Shield, Crown, Code, X, Clock, Mail, User, Database, ChevronRight, FolderOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BucketPermissionEntry {
  bucketId: number;
  bucketName: string;
  selected: boolean;
  permission: 'read' | 'write' | 'read-write';
}

interface EnrichedMember {
  id: number;
  role: string;
  joinedAt?: string;
  user?: {
    firstName?: string;
    email?: string;
  };
  bucketPermissions?: {
    bucketId: number;
    bucketName: string;
    permission: string;
  }[];
}

export default function Team() {
  const { data: accounts } = useMyAccounts();
  const currentAccount = accounts?.[0];
  const { data: rawMembers, isLoading } = useMembers(currentAccount?.id);
  // Cast rawMembers to EnrichedMember[]
  const members = rawMembers as unknown as EnrichedMember[] | undefined;

  const { data: invitations } = useInvitations(currentAccount?.id);
  const { data: buckets } = useBuckets(currentAccount?.id);
  const { mutateAsync: createInvitation, isPending: isInviting } = useCreateInvitation();
  const { mutateAsync: cancelInvitation } = useCancelInvitation();
  const { mutateAsync: removeMember } = useRemoveMember();
  const { mutate: updateRole } = useUpdateMemberRole();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bucketPermissions, setBucketPermissions] = useState<BucketPermissionEntry[]>([]);
  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<{ email: string; role: string }>({
    defaultValues: { email: "", role: "developer" }
  });

  const selectedRole = watch("role");

  // Initialize bucket permissions when buckets load or dialog opens
  useEffect(() => {
    if (buckets && isDialogOpen) {
      setBucketPermissions(buckets.map(b => ({
        bucketId: b.id,
        bucketName: b.name,
        selected: false,
        permission: 'read' as const
      })));
    }
  }, [buckets, isDialogOpen]);

  const toggleBucketSelection = (bucketId: number) => {
    setBucketPermissions(prev => prev.map(bp =>
      bp.bucketId === bucketId ? { ...bp, selected: !bp.selected } : bp
    ));
  };

  const updateBucketPermission = (bucketId: number, permission: 'read' | 'write' | 'read-write') => {
    setBucketPermissions(prev => prev.map(bp =>
      bp.bucketId === bucketId ? { ...bp, permission } : bp
    ));
  };

  const onInviteMember = async (data: { email: string; role: string }) => {
    if (!currentAccount) return;

    // For external clients, require at least one bucket selected
    if (data.role === 'external_client') {
      const selectedBuckets = bucketPermissions.filter(bp => bp.selected);
      if (selectedBuckets.length === 0) {
        toast({ title: "Erro", description: "Selecione pelo menos um bucket para o cliente externo.", variant: "destructive" });
        return;
      }
    }

    try {
      const inviteData: any = { accountId: currentAccount.id, ...data };

      // Include bucket permissions for external clients
      if (data.role === 'external_client') {
        inviteData.bucketPermissions = bucketPermissions
          .filter(bp => bp.selected)
          .map(bp => ({ bucketId: bp.bucketId, permission: bp.permission }));
      }

      await createInvitation(inviteData);
      setIsDialogOpen(false);
      reset();
      setBucketPermissions([]);
      toast({ title: "Convite enviado", description: `Um convite foi enviado para ${data.email}.` });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao enviar convite.", variant: "destructive" });
    }
  };

  const onCancelInvitation = async (invitationId: number) => {
    if (!currentAccount || !confirm("Tem certeza que deseja cancelar este convite?")) return;
    try {
      await cancelInvitation({ accountId: currentAccount.id, invitationId });
      toast({ title: "Convite cancelado" });
    } catch {
      toast({ title: "Erro", description: "Falha ao cancelar convite.", variant: "destructive" });
    }
  };

  const onRemove = async (memberId: number) => {
    if (!currentAccount || !confirm("Tem certeza que deseja remover este membro?")) return;
    await removeMember({ accountId: currentAccount.id, memberId });
    toast({ title: "Membro removido" });
  };

  const onChangeRole = (memberId: number, newRole: string) => {
    if (!currentAccount) return;
    updateRole({ accountId: currentAccount.id, memberId, role: newRole }, {
      onSuccess: () => toast({ title: "Função atualizada" }),
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-3 h-3 mr-1" />;
      case 'admin': return <Shield className="w-3 h-3 mr-1" />;
      case 'external_client': return <User className="w-3 h-3 mr-1" />;
      default: return <Code className="w-3 h-3 mr-1" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Proprietário';
      case 'admin': return 'Administrador';
      case 'developer': return 'Desenvolvedor';
      case 'external_client': return 'Cliente Externo';
      default: return role;
    }
  };

  const pendingInvitations = invitations?.filter(inv => !inv.acceptedAt) || [];

  // Groups
  const owners = members?.filter(m => m.role === 'owner') || [];
  const admins = members?.filter(m => m.role === 'admin') || [];
  const developers = members?.filter(m => m.role === 'developer') || [];
  const guests = members?.filter(m => m.role === 'external_client') || [];

  const MemberTable = ({ title, description, membersList, showPermissions = false }: { title: string, description: string, membersList: EnrichedMember[], showPermissions?: boolean }) => {
    if (membersList.length === 0) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Card View */}
          <div className="md:hidden divide-y">
            {membersList.map((member) => (
              <div key={member.id} className="p-4 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
                      {member.user?.firstName?.[0] || member.user?.email?.[0] || "U"}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{member.user?.firstName || "Usuário"}</div>
                      <div className="text-xs text-muted-foreground break-all">{member.user?.email}</div>
                    </div>
                  </div>
                  {member.role !== 'owner' && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => onRemove(member.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-3 pl-1">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Função</span>
                    {member.role === 'owner' ? (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                        {getRoleIcon(member.role)}
                        {getRoleLabel(member.role)}
                      </Badge>
                    ) : (
                      <Select
                        value={member.role}
                        onValueChange={(value) => onChangeRole(member.id, value)}
                      >
                        <SelectTrigger className="w-full h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="developer">Desenvolvedor</SelectItem>
                          <SelectItem value="external_client">Cliente Externo</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {showPermissions && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Acesso a Buckets</span>
                      <div className="space-y-2">
                        {member.bucketPermissions && member.bucketPermissions.length > 0 ? (
                          member.bucketPermissions.map(bp => (
                            <div key={bp.bucketId} className="flex items-center justify-between text-sm bg-muted/50 px-3 py-2 rounded-md border">
                              <div className="flex items-center gap-2">
                                <FolderOpen className="h-3 w-3 text-blue-500" />
                                <span className="font-medium text-xs">{bp.bucketName}</span>
                              </div>
                              <Badge variant="outline" className="text-[10px] h-5 px-1 bg-background">
                                {bp.permission === 'read-write' ? 'Full' : bp.permission === 'read' ? 'Leitura' : 'Escrita'}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <span className="text-sm text-yellow-600 flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            Sem buckets
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground pt-1">
                    Entrou em: {member.joinedAt ? format(new Date(member.joinedAt), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground pl-6">Usuário</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Função</th>
                  {showPermissions && (
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Acesso a Buckets</th>
                  )}
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Entrou em</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground pr-6">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y relative">
                {membersList.map((member) => (
                  <tr key={member.id} className="group hover:bg-muted/50 transition-colors">
                    <td className="p-4 pl-6 align-top">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {member.user?.firstName?.[0] || member.user?.email?.[0] || "U"}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{member.user?.firstName || "Usuário"}</div>
                          <div className="text-xs text-muted-foreground">{member.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      {member.role === 'owner' ? (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                          {getRoleIcon(member.role)}
                          {getRoleLabel(member.role)}
                        </Badge>
                      ) : (
                        <Select
                          value={member.role}
                          onValueChange={(value) => onChangeRole(member.id, value)}
                        >
                          <SelectTrigger className="w-36 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="developer">Desenvolvedor</SelectItem>
                            <SelectItem value="external_client">Cliente Externo</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </td>

                    {showPermissions && (
                      <td className="p-4 align-top">
                        <div className="space-y-1">
                          {member.bucketPermissions && member.bucketPermissions.length > 0 ? (
                            member.bucketPermissions.map(bp => (
                              <div key={bp.bucketId} className="flex items-center gap-2 text-sm bg-muted/50 px-2 py-1 rounded-md border w-fit">
                                <FolderOpen className="h-3 w-3 text-blue-500" />
                                <span className="font-medium">{bp.bucketName}</span>
                                <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 ml-1 bg-background">
                                  {bp.permission === 'read-write' ? 'Full' : bp.permission === 'read' ? 'Leitura' : 'Escrita'}
                                </Badge>
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-yellow-600 flex items-center gap-1">
                              <Database className="h-3 w-3" />
                              Sem buckets
                            </span>
                          )}
                        </div>
                      </td>
                    )}

                    <td className="p-4 text-sm text-muted-foreground align-top">
                      {member.joinedAt ? format(new Date(member.joinedAt), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                    </td>
                    <td className="p-4 text-right pr-6 align-top">
                      {member.role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive h-8 w-8"
                          onClick={() => onRemove(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Gestão de Equipe</h1>
            <p className="text-muted-foreground">Gerencie quem tem acesso à sua organização.</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-invite-member">
                <UserPlus className="mr-2 h-4 w-4" /> Convidar Membro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Membro</DialogTitle>
                <DialogDescription>
                  Envie um convite por e-mail para um novo membro.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onInviteMember)} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-mail</label>
                  <Input
                    {...register("email", { required: true })}
                    placeholder="nome@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Função</label>
                  <Controller
                    control={control}
                    name="role"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="developer">Desenvolvedor</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="external_client">Cliente Externo</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {selectedRole === 'external_client' && (
                  <div className="space-y-3 pt-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Buckets Permitidos
                    </label>
                    <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                      {buckets?.map(b => {
                        const bp = bucketPermissions.find(p => p.bucketId === b.id);
                        return (
                          <div key={b.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={bp?.selected}
                                onCheckedChange={() => bp && toggleBucketSelection(bp.bucketId)}
                              />
                              <span className="text-sm">{b.name}</span>
                            </div>
                            {bp?.selected && (
                              <Select
                                value={bp.permission}
                                onValueChange={(val: any) => updateBucketPermission(bp.bucketId, val)}
                              >
                                <SelectTrigger className="w-24 h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="read">Ler</SelectItem>
                                  <SelectItem value="write">Escrever</SelectItem>
                                  <SelectItem value="read-write">Full</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isInviting}>
                  {isInviting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Enviar Convite"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {pendingInvitations.length > 0 && (
          <Card className="mb-8 border-dashed border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" /> Convites Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingInvitations.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex flex-col overflow-hidden mr-2">
                      <span className="font-medium truncate" title={inv.email}>{inv.email}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        {getRoleLabel(inv.role)} • Expira em {format(new Date(inv.expiresAt), "dd/MM")}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onCancelInvitation(inv.id)} className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-8">
            <MemberTable
              title="Proprietário"
              description="Acesso total e controle de faturamento."
              membersList={owners}
            />

            <MemberTable
              title="Administradores"
              description="Podem gerenciar buckets, convidar membros e configurar o sistema."
              membersList={admins}
            />

            <MemberTable
              title="Desenvolvedores"
              description="Acesso a buckets e chaves de API, sem configurações administrativas."
              membersList={developers}
            />

            <MemberTable
              title="Clientes Externos / Convidados"
              description="Acesso restrito apenas aos buckets listados abaixo."
              membersList={guests}
              showPermissions={true}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
