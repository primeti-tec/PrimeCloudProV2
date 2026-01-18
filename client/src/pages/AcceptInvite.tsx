import { useParams, useLocation } from "wouter";
import { useInvitationByToken, useAcceptInvitation } from "@/hooks/use-invitations";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Mail, Building2, User } from "lucide-react";

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { data: invitation, isLoading, error } = useInvitationByToken(token);
  const { mutate: acceptInvitation, isPending: isAccepting, isSuccess } = useAcceptInvitation();

  const handleAccept = () => {
    if (token) {
      acceptInvitation(token, {
        onSuccess: () => {
          setTimeout(() => {
            setLocation("/dashboard");
          }, 1500);
        },
      });
    }
  };

  const handleLogin = () => {
    window.location.href = `/__replit/auth/login?redirect=/invite/${token}`;
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="loading-container">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" data-testid="error-container">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-xl">Invalid Invitation</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => setLocation("/")} data-testid="button-go-home">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" data-testid="success-container">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-xl">Welcome to {invitation?.account?.name}!</CardTitle>
            <CardDescription>
              You have successfully joined the team. Redirecting to dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" data-testid="invite-container">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-xl">You're Invited!</CardTitle>
          <CardDescription>
            You've been invited to join a team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Organization</p>
                <p className="font-medium" data-testid="text-account-name">{invitation?.account?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Invited by</p>
                <p className="font-medium" data-testid="text-inviter-name">
                  {invitation?.inviter?.firstName || invitation?.inviter?.email || "A team member"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Your role</p>
                <p className="font-medium capitalize" data-testid="text-role">{invitation?.role}</p>
              </div>
            </div>
          </div>

          {user ? (
            <Button 
              onClick={handleAccept} 
              className="w-full" 
              disabled={isAccepting}
              data-testid="button-accept-invite"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                "Accept Invitation"
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Please log in to accept this invitation
              </p>
              <Button 
                onClick={handleLogin} 
                className="w-full"
                data-testid="button-login"
              >
                Log in to Accept
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
