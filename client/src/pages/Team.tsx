import { Sidebar } from "@/components/Sidebar";
import { useMembers, useRemoveMember, useUpdateMemberRole } from "@/hooks/use-members";
import { useInvitations, useCreateInvitation, useCancelInvitation } from "@/hooks/use-invitations";
import { useMyAccounts } from "@/hooks/use-accounts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, UserPlus, Shield, Crown, Code, X, Clock, Mail } from "lucide-react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

export default function Team() {
  const { data: accounts } = useMyAccounts();
  const currentAccount = accounts?.[0];
  const { data: members, isLoading } = useMembers(currentAccount?.id);
  const { data: invitations } = useInvitations(currentAccount?.id);
  const { mutateAsync: createInvitation, isPending: isInviting } = useCreateInvitation();
  const { mutateAsync: cancelInvitation } = useCancelInvitation();
  const { mutateAsync: removeMember } = useRemoveMember();
  const { mutate: updateRole } = useUpdateMemberRole();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<{ email: string; role: string }>({
    defaultValues: { email: "", role: "developer" }
  });

  const onInviteMember = async (data: { email: string; role: string }) => {
    if (!currentAccount) return;
    try {
      await createInvitation({ accountId: currentAccount.id, ...data });
      setIsDialogOpen(false);
      reset();
      toast({ title: "Invitation sent", description: `An invitation has been sent to ${data.email}.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to send invitation.", variant: "destructive" });
    }
  };

  const onCancelInvitation = async (invitationId: number) => {
    if (!currentAccount || !confirm("Are you sure you want to cancel this invitation?")) return;
    try {
      await cancelInvitation({ accountId: currentAccount.id, invitationId });
      toast({ title: "Invitation cancelled" });
    } catch {
      toast({ title: "Error", description: "Failed to cancel invitation.", variant: "destructive" });
    }
  };

  const onRemove = async (memberId: number) => {
    if (!currentAccount || !confirm("Are you sure you want to remove this member?")) return;
    await removeMember({ accountId: currentAccount.id, memberId });
    toast({ title: "Member removed" });
  };

  const onChangeRole = (memberId: number, newRole: string) => {
    if (!currentAccount) return;
    updateRole({ accountId: currentAccount.id, memberId, role: newRole }, {
      onSuccess: () => toast({ title: "Role updated" }),
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-3 h-3 mr-1" />;
      case 'admin': return <Shield className="w-3 h-3 mr-1" />;
      default: return <Code className="w-3 h-3 mr-1" />;
    }
  };

  const pendingInvitations = invitations?.filter(inv => !inv.acceptedAt) || [];

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 ml-72 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900">Team Management</h1>
            <p className="text-muted-foreground">Manage access to your organization.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-invite-member">
                <UserPlus className="mr-2 h-4 w-4" /> Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your organization. They'll receive an email with a link to accept.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onInviteMember)} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input 
                    {...register("email", { 
                      required: "Email is required",
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" }
                    })} 
                    placeholder="colleague@example.com"
                    data-testid="input-invite-email"
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Controller
                    control={control}
                    name="role"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-invite-role">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="developer">Developer</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isInviting} data-testid="button-send-invite">
                  {isInviting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Invitation"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {pendingInvitations.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Pending Invitations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground pl-6">Email</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Expires</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pendingInvitations.map((invitation) => (
                    <tr key={invitation.id} className="group hover:bg-slate-50/50 transition-colors" data-testid={`row-invitation-${invitation.id}`}>
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                            <Mail className="h-4 w-4" />
                          </div>
                          <span className="font-medium text-slate-900" data-testid={`text-invitation-email-${invitation.id}`}>
                            {invitation.email}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary" className="capitalize">
                          {getRoleIcon(invitation.role)}
                          {invitation.role}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(invitation.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right pr-6">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-destructive" 
                          onClick={() => onCancelInvitation(invitation.id)}
                          data-testid={`button-cancel-invitation-${invitation.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Members</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground pl-6">User</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {members?.map((member) => (
                    <tr key={member.id} className="group hover:bg-slate-50/50 transition-colors" data-testid={`row-member-${member.id}`}>
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                             {member.user?.firstName?.[0] || member.user?.email?.[0] || "U"}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{member.user?.firstName || "Unknown User"}</div>
                            <div className="text-xs text-muted-foreground">{member.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {member.role === 'owner' ? (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                            {getRoleIcon(member.role)}
                            Owner
                          </Badge>
                        ) : (
                          <Select
                            value={member.role}
                            onValueChange={(value) => onChangeRole(member.id, value)}
                          >
                            <SelectTrigger className="w-32 h-8" data-testid={`select-role-${member.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="developer">Developer</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(member.joinedAt!).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right pr-6">
                        {member.role !== 'owner' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-destructive" 
                            onClick={() => onRemove(member.id)}
                            data-testid={`button-remove-member-${member.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
