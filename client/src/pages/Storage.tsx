import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useMyAccounts } from "@/hooks/use-accounts";
import { useBuckets, useCreateBucket, useDeleteBucket } from "@/hooks/use-buckets";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui-custom";
import { Loader2, Database, Plus, Trash2, Globe, Lock, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const REGIONS = [
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "eu-west-1", label: "Europe (Ireland)" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
  { value: "sa-east-1", label: "South America (Sao Paulo)" },
];

export default function Storage() {
  const { data: accounts } = useMyAccounts();
  const currentAccount = accounts?.[0];
  const { data: buckets, isLoading } = useBuckets(currentAccount?.id);
  const { mutate: createBucket, isPending: isCreating } = useCreateBucket(currentAccount?.id);
  const { mutate: deleteBucket, isPending: isDeleting } = useDeleteBucket(currentAccount?.id);
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [bucketName, setBucketName] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [isPublic, setIsPublic] = useState(false);

  const handleCreate = () => {
    if (!bucketName.trim()) return;
    createBucket({ name: bucketName, region, isPublic }, {
      onSuccess: () => {
        toast({ title: "Bucket created!", description: `${bucketName} is now available.` });
        setBucketName("");
        setDialogOpen(false);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to create bucket.", variant: "destructive" });
      },
    });
  };

  const handleDelete = (bucketId: number, bucketNameToDelete: string) => {
    if (confirm(`Are you sure you want to delete "${bucketNameToDelete}"? This cannot be undone.`)) {
      deleteBucket(bucketId, {
        onSuccess: () => {
          toast({ title: "Bucket deleted", description: `${bucketNameToDelete} has been removed.` });
        },
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 ml-72 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900" data-testid="text-page-title">Storage Buckets</h1>
            <p className="text-muted-foreground">Manage your S3-compatible object storage buckets.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-bucket"><Plus className="mr-2 h-4 w-4" /> Create Bucket</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Bucket</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Bucket Name</label>
                  <Input
                    value={bucketName}
                    onChange={(e) => setBucketName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="my-bucket-name"
                    className="mt-1 font-mono"
                    data-testid="input-bucket-name"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Lowercase letters, numbers, and hyphens only</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Region</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="mt-1 w-full h-11 rounded-lg border border-input bg-background px-3 text-sm"
                    data-testid="select-region"
                  >
                    {REGIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="public"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    data-testid="checkbox-public"
                  />
                  <label htmlFor="public" className="text-sm text-slate-700">
                    Make bucket publicly accessible
                  </label>
                </div>
                <Button onClick={handleCreate} disabled={!bucketName || isCreating} className="w-full" data-testid="button-confirm-create">
                  {isCreating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                  Create Bucket
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Buckets</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : buckets?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No buckets yet. Create one to get started.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-4 pl-6 text-sm font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Region</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Objects</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Size</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Access</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Created</th>
                    <th className="text-right p-4 pr-6 text-sm font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {buckets?.map((bucket) => (
                    <tr key={bucket.id} className="hover:bg-slate-50/50 transition-colors" data-testid={`row-bucket-${bucket.id}`}>
                      <td className="p-4 pl-6 flex items-center gap-3">
                        <Database className="h-5 w-5 text-blue-500" />
                        <span className="font-medium font-mono">{bucket.name}</span>
                      </td>
                      <td className="p-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {bucket.region}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600">{bucket.objectCount ?? 0} objects</td>
                      <td className="p-4 text-sm text-slate-600">{formatBytes(bucket.sizeBytes ?? 0)}</td>
                      <td className="p-4">
                        {bucket.isPublic ? (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            <Globe className="h-3 w-3 mr-1" /> Public
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                            <Lock className="h-3 w-3 mr-1" /> Private
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {bucket.createdAt ? new Date(bucket.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(bucket.id, bucket.name)}
                          disabled={isDeleting}
                          data-testid={`button-delete-${bucket.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
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
