import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import CreateAccount from "@/pages/CreateAccount";
import Storage from "@/pages/Storage";
import Team from "@/pages/Team";
import Billing from "@/pages/Billing";
import ApiKeys from "@/pages/ApiKeys";
import AuditLogs from "@/pages/AuditLogs";
import SftpAccess from "@/pages/SftpAccess";
import AdminDashboard from "@/pages/AdminDashboard";
import AcceptInvite from "@/pages/AcceptInvite";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

function PrivateRoute({ component: Component, adminOnly = false }: { component: React.ComponentType, adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  if (adminOnly && !user.email?.includes("admin")) { // Simple check for MVP
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      
      {/* Auth Protected Routes */}
      <Route path="/create-account">
        <PrivateRoute component={CreateAccount} />
      </Route>
      <Route path="/dashboard">
        <PrivateRoute component={Dashboard} />
      </Route>
      <Route path="/dashboard/storage">
        <PrivateRoute component={Storage} />
      </Route>
      <Route path="/dashboard/team">
        <PrivateRoute component={Team} />
      </Route>
      <Route path="/dashboard/billing">
        <PrivateRoute component={Billing} />
      </Route>
      <Route path="/dashboard/api-keys">
        <PrivateRoute component={ApiKeys} />
      </Route>
      <Route path="/dashboard/audit-logs">
        <PrivateRoute component={AuditLogs} />
      </Route>
      <Route path="/dashboard/sftp">
        <PrivateRoute component={SftpAccess} />
      </Route>

      {/* Admin Route */}
      <Route path="/admin">
        <PrivateRoute component={AdminDashboard} adminOnly />
      </Route>

      {/* Public Invitation Route */}
      <Route path="/invite/:token" component={AcceptInvite} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
