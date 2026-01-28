import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrandingProvider } from "@/components/branding-provider";
import { Suspense, lazy } from "react";
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const CreateAccount = lazy(() => import("@/pages/CreateAccount"));
const Storage = lazy(() => import("@/pages/Storage"));
const BucketBrowser = lazy(() => import("@/pages/BucketBrowser"));
const Team = lazy(() => import("@/pages/Team"));
const Billing = lazy(() => import("@/pages/Billing"));
const ApiKeys = lazy(() => import("@/pages/ApiKeys"));
const AuditLogs = lazy(() => import("@/pages/AuditLogs"));
const SftpAccess = lazy(() => import("@/pages/SftpAccess"));
const Orders = lazy(() => import("@/pages/Orders"));
const ContractService = lazy(() => import("@/pages/ContractService"));
const Settings = lazy(() => import("@/pages/Settings"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AcceptInvite = lazy(() => import("@/pages/AcceptInvite"));
const BackupConfig = lazy(() => import("@/pages/BackupConfig"));
const SignInPage = lazy(() => import("@/pages/SignIn"));
const SignUpPage = lazy(() => import("@/pages/SignUp"));
const NotFound = lazy(() => import("@/pages/not-found"));
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Loader2 } from "lucide-react";

function PrivateRoute({ component: Component, adminOnly = false, allowExternalClient = false }: { component: React.ComponentType, adminOnly?: boolean, allowExternalClient?: boolean }) {
  const { user, isLoading, isSuperAdmin } = useAuth();
  const { isExternalClient } = usePermissions();

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
  }

  if (!user) {
    return <Redirect to="/sign-in" />;
  }

  if (adminOnly && !isSuperAdmin) {
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
  const { isExternalClient } = usePermissions();

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
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center bg-background">
          <Loader2 className="animate-spin text-primary h-8 w-8" />
        </div>
      }
    >
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
    </Suspense>
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
