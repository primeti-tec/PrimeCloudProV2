import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAccountSchema, type CreateAccountRequest } from "@shared/schema";
import { useCreateAccount } from "@/hooks/use-accounts";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@/components/ui-custom";
import { Loader2, Rocket } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function CreateAccount() {
  const { mutateAsync, isPending } = useCreateAccount();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const form = useForm<CreateAccountRequest>({
    resolver: zodResolver(insertAccountSchema),
    defaultValues: {
      name: "",
      slug: "", // optional, usually auto-generated if empty but good to ask
    },
  });

  const onSubmit = async (data: CreateAccountRequest) => {
    try {
      await mutateAsync(data);
      setLocation("/dashboard");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-lg shadow-2xl border-t-4 border-t-primary">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create Organization</CardTitle>
          <p className="text-muted-foreground mt-2">
            Welcome, {user?.firstName}! To get started, set up your organization workspace.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization Name</label>
              <Input
                placeholder="Acme Corp"
                {...form.register("name")}
                className="h-12"
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Slug (Optional)</label>
              <Input
                placeholder="acme-corp"
                {...form.register("slug")}
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">Unique identifier for your organization URL.</p>
            </div>

            <Button type="submit" className="w-full h-12 text-base" disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin mr-2" /> : null}
              Create Workspace
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
