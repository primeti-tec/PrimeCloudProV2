import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrandingProvider } from "@/components/branding-provider";
import LandingPage from "@/pages/LandingPage"; // Keeping import for potential future use
import Dashboard from "@/pages/Dashboard";
import CreateAccount from "@/pages/CreateAccount";
import Storage from "@/pages/Storage";
import BucketBrowser from "@/pages/BucketBrowser";
import Team from "@/pages/Team";
import Billing from "@/pages/Billing";
import ApiKeys from "@/pages/ApiKeys";
import AuditLogs from "@/pages/AuditLogs";
import SftpAccess from "@/pages/SftpAccess";
import Orders from "@/pages/Orders";
import ContractService from "@/pages/ContractService";
import Settings from "@/pages/Settings";
import AdminDashboard from "@/pages/AdminDashboard";
import AcceptInvite from "@/pages/AcceptInvite";
import BackupConfig from "@/pages/BackupConfig";
import SignInPage from "@/pages/SignIn";
import SignUpPage from "@/pages/SignUp";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentRole } from "@/hooks/use-current-account";
import { Loader2 } from "lucide-react";

function PrivateRoute({ component: Component, adminOnly = false, allowExternalClient = false }: { component: React.ComponentType, adminOnly?: boolean, allowExternalClient?: boolean }) {
  const { user, isLoading } = useAuth();
  const { isExternalClient } = useCurrentRole();

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
  }

  if (!user) {
    return <Redirect to="/sign-in" />;
  }

  // Super Admin Check
  const SUPER_ADMINS = ["sergio.louzan@gmail.com", "admin@primecloudpro.com"];
  if (adminOnly && !SUPER_ADMINS.includes(user.email || "")) {
    return <Redirect to="/dashboard" />;
  }

  // External Client Restriction
  if (isExternalClient && !allowExternalClient) {
    return <Redirect to="/dashboard/storage" />;
  }

  return <Component />;
}

function HomeRedirect() {
  const { user, isLoading } = useAuth();
  const { isExternalClient } = useCurrentRole();

  if (isLoading) return <div className="h-screen w-full flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;

  if (user) {
    // Check for pending invite token
    const pendingToken = sessionStorage.getItem('pending_invite_token');
    if (pendingToken) {
      return <Redirect to={`/invite/${pendingToken}`} />;
    }

    // Redirect external clients directly to storage
    if (isExternalClient) return <Redirect to="/dashboard/storage" />;
    return <Redirect to="/dashboard" />;
  }

  return <Redirect to="/sign-in" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-in/*" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route path="/sign-up/*" component={SignUpPage} />

      {/* Auth Protected Routes */}
      <Route path="/create-account">
        <PrivateRoute component={CreateAccount} />
      </Route>
      <Route path="/dashboard">
        <PrivateRoute component={Dashboard} />
      </Route>
      <Route path="/dashboard/storage">
        <PrivateRoute component={Storage} allowExternalClient />
      </Route>
      <Route path="/dashboard/storage/:bucketId">
        <PrivateRoute component={BucketBrowser} allowExternalClient />
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
      <Route path="/dashboard/orders">
        <PrivateRoute component={Orders} />
      </Route>
      <Route path="/dashboard/contract">
        <PrivateRoute component={ContractService} />
      </Route>
      <Route path="/dashboard/settings">
        <PrivateRoute component={Settings} />
      </Route>
      <Route path="/dashboard/backup">
        <PrivateRoute component={BackupConfig} />
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
      <BrandingProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </BrandingProvider>
    </QueryClientProvider>
  );
}

export default App;
