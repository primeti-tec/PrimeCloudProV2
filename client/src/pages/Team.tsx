import { Sidebar } from "@/components/Sidebar";
import { useMembers, useAddMember, useRemoveMember } from "@/hooks/use-members";
import { useMyAccounts } from "@/hooks/use-accounts";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui-custom";
import { Loader2, Trash2, UserPlus, Shield, User } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function Team() {
  const { data: accounts } = useMyAccounts();
  const currentAccount = accounts?.[0];
  const { data: members, isLoading } = useMembers(currentAccount?.id);
  const { mutateAsync: addMember, isPending: isAdding } = useAddMember();
  const { mutateAsync: removeMember } = useRemoveMember();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<{ email: string; role: 'admin' | 'developer' }>();

  const onAddMember = async (data: { email: string; role: 'admin' | 'developer' }) => {
    if (!currentAccount) return;
    try {
      await addMember({ accountId: currentAccount.id, ...data });
      setIsDialogOpen(false);
      reset();
    } catch (e) {
      console.error(e);
    }
  };

  const onRemove = async (memberId: number) => {
    if (!currentAccount || !confirm("Are you sure?")) return;
    await removeMember({ accountId: currentAccount.id, memberId });
  };

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
              <Button><UserPlus className="mr-2 h-4 w-4" /> Add Member</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onAddMember)} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input {...register("email", { required: true })} placeholder="colleague@example.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <select {...register("role")} className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="developer">Developer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <Button type="submit" className="w-full" disabled={isAdding}>
                  {isAdding ? "Sending Invite..." : "Send Invite"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
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
                    <tr key={member.id} className="group hover:bg-slate-50/50 transition-colors">
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.role === 'owner' ? 'bg-purple-100 text-purple-800' : 
                          member.role === 'admin' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {member.role === 'owner' && <Shield className="w-3 h-3 mr-1" />}
                          {member.role}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(member.joinedAt!).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right pr-6">
                        {member.role !== 'owner' && (
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => onRemove(member.id)}>
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
