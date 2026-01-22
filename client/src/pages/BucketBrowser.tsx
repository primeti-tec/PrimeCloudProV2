import { useState, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { useMyAccounts } from "@/hooks/use-accounts";
import { useCurrentRole } from "@/hooks/use-current-account";
import {
  useBuckets,
  useBucketObjects,
  useUploadFile,
  useDeleteObject,
  useGetDownloadUrl,
  type BucketObject,
} from "@/hooks/use-buckets";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Input,
} from "@/components/ui-custom";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  FolderOpen,
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  Upload,
  Download,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Home,
  RefreshCw,
  Eye,
  Search,
  X,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Bucket } from "@shared/schema";

// Extended bucket type with user permission
interface BucketWithPermission extends Bucket {
  userPermission?: "read" | "write" | "read-write";
}

// File type detection helpers
function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

function isPreviewableImage(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext);
}

function isPreviewableVideo(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["mp4", "webm", "ogg"].includes(ext);
}

function isPreviewableAudio(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["mp3", "wav", "ogg", "m4a", "aac"].includes(ext);
}

function isPreviewablePdf(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ext === "pdf";
}

function isPreviewableText(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["txt", "md", "json", "xml", "html", "css", "js", "ts", "tsx", "jsx", "py", "java", "c", "cpp", "go", "rs", "yaml", "yml", "log", "csv", "sql", "sh", "bat"].includes(ext);
}

function isOfficeFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp"].includes(ext);
}

function isPreviewable(filename: string): boolean {
  return isPreviewableImage(filename) || isPreviewableVideo(filename) || isPreviewableAudio(filename) || isPreviewablePdf(filename) || isPreviewableText(filename);
}

function getPreviewType(filename: string): "image" | "video" | "audio" | "pdf" | "text" | "office" | "none" {
  if (isPreviewableImage(filename)) return "image";
  if (isPreviewableVideo(filename)) return "video";
  if (isPreviewableAudio(filename)) return "audio";
  if (isPreviewablePdf(filename)) return "pdf";
  if (isPreviewableText(filename)) return "text";
  if (isOfficeFile(filename)) return "office";
  return "none";
}

function getFileIcon(filename: string) {
  const ext = getFileExtension(filename);

  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"];
  const videoExts = ["mp4", "webm", "mov", "avi", "mkv", "wmv", "ogg"];
  const audioExts = ["mp3", "wav", "ogg", "flac", "aac", "m4a"];
  const archiveExts = ["zip", "rar", "7z", "tar", "gz", "bz2"];
  const codeExts = ["js", "ts", "tsx", "jsx", "py", "java", "cpp", "c", "go", "rs", "html", "css", "json", "xml", "yaml", "yml"];

  const wordExts = ["doc", "docx", "odt"];
  const excelExts = ["xls", "xlsx", "ods"];
  const powerpointExts = ["ppt", "pptx", "odp"];
  const pdfExts = ["pdf"];
  const textExts = ["txt", "md", "csv", "log"];

  if (imageExts.includes(ext)) return <FileImage className="h-5 w-5 text-purple-500" />;
  if (videoExts.includes(ext)) return <FileVideo className="h-5 w-5 text-pink-500" />;
  if (audioExts.includes(ext)) return <FileAudio className="h-5 w-5 text-pink-400" />;
  if (archiveExts.includes(ext)) return <FileArchive className="h-5 w-5 text-amber-600" />;
  if (codeExts.includes(ext)) return <FileCode className="h-5 w-5 text-slate-500" />;

  if (pdfExts.includes(ext)) return <FileText className="h-5 w-5 text-red-500" />;
  if (wordExts.includes(ext)) return <FileText className="h-5 w-5 text-blue-600" />;
  if (excelExts.includes(ext)) return <FileText className="h-5 w-5 text-green-600" />;
  if (powerpointExts.includes(ext)) return <FileText className="h-5 w-5 text-orange-500" />;
  if (textExts.includes(ext)) return <FileText className="h-5 w-5 text-slate-400" />;

  return <File className="h-5 w-5 text-slate-400" />;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("pt-BR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDisplayName(fullPath: string, prefix: string) {
  return fullPath.replace(prefix, "").replace(/\/$/, "");
}

// Preview Modal Component
function FilePreviewModal({
  isOpen,
  onClose,
  file,
  previewUrl,
  onDownload,
}: {
  isOpen: boolean;
  onClose: () => void;
  file: BucketObject | null;
  previewUrl: string | null;
  onDownload: () => void;
}) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);

  // Load text content when it's a text file
  const loadTextContent = useCallback(async () => {
    if (!file || !previewUrl || !isPreviewableText(file.name)) return;

    setIsLoadingText(true);
    try {
      const response = await fetch(previewUrl);
      const text = await response.text();
      setTextContent(text);
    } catch (error) {
      setTextContent("Erro ao carregar o conteúdo do arquivo.");
    } finally {
      setIsLoadingText(false);
    }
  }, [file, previewUrl]);

  // Reset text content when modal closes or file changes
  useState(() => {
    if (isOpen && file && isPreviewableText(file.name) && previewUrl) {
      loadTextContent();
    } else {
      setTextContent(null);
    }
  });

  if (!file || !previewUrl) return null;

  const previewType = getPreviewType(file.name);
  const fileName = file.name.split("/").pop() || file.name;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        {/* Header - Standardized */}
        <div className="flex items-center justify-between p-6 bg-card border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-accent/50">
              {getFileIcon(file.name)}
            </div>
            <div>
              <DialogTitle className="text-xl font-display font-bold leading-none mb-1">
                {fileName}
              </DialogTitle>
              <p className="text-sm text-muted-foreground font-medium">
                {formatBytes(file.size)} • {getFileExtension(file.name).toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mr-8">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg h-9"
              onClick={() => window.open(previewUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2 text-primary" />
              Abrir em nova aba
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="rounded-lg h-9"
              onClick={onDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-0 bg-muted/20 flex items-center justify-center min-h-[500px]">
          {previewType === "image" && (
            <img
              src={previewUrl}
              alt={fileName}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
            />
          )}

          {previewType === "video" && (
            <video
              src={previewUrl}
              controls
              autoPlay={false}
              className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
            >
              Seu navegador não suporta a reprodução de vídeos.
            </video>
          )}

          {previewType === "audio" && (
            <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
              <div className="flex flex-col items-center gap-4">
                <FileAudio className="h-16 w-16 text-pink-500" />
                <p className="font-medium text-center">{fileName}</p>
                <audio src={previewUrl} controls className="w-full">
                  Seu navegador não suporta a reprodução de áudio.
                </audio>
              </div>
            </div>
          )}

          {previewType === "pdf" && (
            <iframe
              src={previewUrl}
              className="w-full h-[70vh] rounded-lg shadow-lg bg-white"
              title={fileName}
            />
          )}

          {previewType === "text" && (
            <iframe
              src={previewUrl}
              className="w-full h-[70vh] rounded-lg shadow-lg bg-white"
              title={fileName}
            />
          )}

          {previewType === "office" && (
            <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
              <FileText className="h-16 w-16 mx-auto text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Arquivo do Office</h3>
              <p className="text-muted-foreground mb-6">
                Arquivos do Word, Excel e PowerPoint não podem ser visualizados diretamente no navegador por questões de segurança e compatibilidade.
              </p>
              <Button variant="primary" className="w-full" onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Baixar para Visualizar
              </Button>
            </div>
          )}

          {previewType === "none" && (
            <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
              <File className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sem Prévia Disponível</h3>
              <p className="text-muted-foreground mb-6">
                Este tipo de arquivo ({getFileExtension(file.name).toUpperCase()}) não suporta visualização direta.
              </p>
              <Button variant="primary" className="w-full" onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Baixar Arquivo
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function BucketBrowser() {
  const { bucketId } = useParams<{ bucketId: string }>();
  const [, setLocation] = useLocation();
  const { data: accounts, isLoading: isAccountsLoading } = useMyAccounts();
  const { isExternalClient } = useCurrentRole();
  const bucketIdInt = parseInt(bucketId || "0");

  // Find the current account - for now we default to the first one
  // In a multi-account scenario, we should find the account that owns this bucket
  const currentAccount = accounts?.[0];

  const { data: buckets, isLoading: isBucketsLoading } = useBuckets(currentAccount?.id) as any;
  const bucket = buckets?.find((b: any) => b.id === bucketIdInt);

  // Debug logs
  console.log(`[BucketBrowser] Render: bucketId=${bucketIdInt}, isExternal=${isExternalClient}`);
  console.log(`[BucketBrowser] Accounts:`, accounts?.length);
  console.log(`[BucketBrowser] Current Account:`, currentAccount?.id);
  console.log(`[BucketBrowser] Buckets in Current Account:`, buckets?.length);
  console.log(`[BucketBrowser] Target Bucket Found:`, !!bucket);
  if (bucket) console.log(`[BucketBrowser] Bucket Permission:`, bucket.userPermission);

  const [currentPrefix, setCurrentPrefix] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [objectToDelete, setObjectToDelete] = useState<BucketObject | null>(null);

  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<BucketObject | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const {
    data: objectsData,
    isLoading: isObjectsLoading,
    error: objectsError,
    refetch,
  } = useBucketObjects(currentAccount?.id, bucket?.id, currentPrefix);

  const { mutate: uploadFile, isPending: isUploading } = useUploadFile(
    currentAccount?.id,
    bucket?.id
  );
  const { mutate: deleteObject, isPending: isDeleting } = useDeleteObject(
    currentAccount?.id,
    bucket?.id
  );
  const { mutateAsync: getDownloadUrl } = useGetDownloadUrl(
    currentAccount?.id,
    bucket?.id
  );

  // Permission checks
  const canRead =
    !isExternalClient ||
    bucket?.userPermission === "read" ||
    bucket?.userPermission === "read-write";
  const canWrite =
    !isExternalClient ||
    bucket?.userPermission === "write" ||
    bucket?.userPermission === "read-write";

  // Filtered objects based on search
  const filteredObjects =
    objectsData?.objects.filter((obj) =>
      getDisplayName(obj.name, currentPrefix)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    ) || [];

  const filteredPrefixes =
    objectsData?.prefixes.filter((prefix) =>
      getDisplayName(prefix, currentPrefix)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    ) || [];

  // Breadcrumb parts
  const breadcrumbParts = currentPrefix
    .split("/")
    .filter(Boolean)
    .map((part, index, arr) => ({
      name: part,
      path: arr.slice(0, index + 1).join("/") + "/",
    }));

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      uploadFile(
        {
          file,
          prefix: currentPrefix,
          onProgress: setUploadProgress,
        },
        {
          onSuccess: () => {
            toast({
              title: "Upload concluído",
              description: `${file.name} foi enviado com sucesso.`,
            });
            setUploadProgress(null);
            refetch();
          },
          onError: (error) => {
            toast({
              title: "Erro no upload",
              description: error.message || "Falha ao enviar arquivo.",
              variant: "destructive",
            });
            setUploadProgress(null);
          },
        }
      );

      // Reset input
      event.target.value = "";
    },
    [uploadFile, currentPrefix, toast, refetch]
  );

  const handleDownload = async (obj: BucketObject) => {
    try {
      const { downloadUrl } = await getDownloadUrl({ key: obj.name, download: true });
      // Create a temporary link to force download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = obj.name.split("/").pop() || obj.name;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao gerar link de download.",
        variant: "destructive",
      });
    }
  };

  const handlePreview = async (obj: BucketObject) => {
    // Check if file is previewable
    if (!isPreviewable(obj.name)) {
      // If not previewable, just download
      handleDownload(obj);
      return;
    }

    setIsLoadingPreview(true);
    setPreviewFile(obj);
    setPreviewOpen(true);

    try {
      const { downloadUrl } = await getDownloadUrl({ key: obj.name, download: false });
      setPreviewUrl(downloadUrl);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao gerar link de preview.",
        variant: "destructive",
      });
      setPreviewOpen(false);
      setPreviewFile(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewFile(null);
    setPreviewUrl(null);
  };

  const handleDeleteConfirm = () => {
    if (!objectToDelete) return;

    deleteObject(objectToDelete.name, {
      onSuccess: () => {
        toast({
          title: "Arquivo excluído",
          description: `${getDisplayName(objectToDelete.name, currentPrefix)} foi removido.`,
        });
        setDeleteDialogOpen(false);
        setObjectToDelete(null);
        refetch();
      },
      onError: (error) => {
        toast({
          title: "Erro",
          description: error.message || "Falha ao excluir arquivo.",
          variant: "destructive",
        });
      },
    });
  };

  const navigateToFolder = (prefix: string) => {
    setCurrentPrefix(prefix);
    setSearchTerm("");
  };

  const navigateUp = () => {
    const parts = currentPrefix.split("/").filter(Boolean);
    parts.pop();
    setCurrentPrefix(parts.length > 0 ? parts.join("/") + "/" : "");
    setSearchTerm("");
  };

  if (isAccountsLoading || isBucketsLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-72 p-8">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Card className="border-none shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm">
            <CardHeader className="bg-white p-6 border-b border-border/50">
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-32" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!bucket) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-72 p-8">
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <FolderOpen className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
            <h2 className="text-xl font-semibold mb-2">Bucket não encontrado</h2>
            <p className="text-muted-foreground mb-6">Não foi possível encontrar o bucket solicitado ou você não tem permissão para acessá-lo.</p>
            <Button onClick={() => setLocation("/dashboard/storage")}>
              Voltar para Armazenamento
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-72 p-8">
        {/* Header */}
        <header className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/dashboard/storage")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-display font-bold text-foreground">
                {bucket.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Navegue e gerencie os arquivos deste bucket
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isExternalClient && (
                <Badge
                  variant="secondary"
                  className={
                    bucket.userPermission === "read-write"
                      ? "bg-green-100 text-green-700"
                      : bucket.userPermission === "write"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-700"
                  }
                >
                  {bucket.userPermission === "read-write"
                    ? "Leitura e Escrita"
                    : bucket.userPermission === "write"
                      ? "Somente Escrita"
                      : "Somente Leitura"}
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isObjectsLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isObjectsLoading ? "animate-spin" : ""}`}
                />
                Atualizar
              </Button>
              {canWrite && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm bg-muted/50 rounded-lg px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => navigateToFolder("")}
            >
              <Home className="h-4 w-4" />
            </Button>
            {breadcrumbParts.map((part) => (
              <div key={part.path} className="flex items-center">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => navigateToFolder(part.path)}
                >
                  {part.name}
                </Button>
              </div>
            ))}
          </div>

          {/* Upload Progress */}
          {uploadProgress !== null && (
            <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-700">
                  Enviando arquivo...
                </p>
                <Progress value={uploadProgress} className="h-2 mt-1" />
              </div>
              <span className="text-sm text-blue-600">
                {Math.round(uploadProgress)}%
              </span>
            </div>
          )}
        </header>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Arquivos e Pastas</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar arquivos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isObjectsLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            ) : objectsError ? (
              <div className="p-12 text-center text-destructive">
                <p>Erro ao carregar arquivos: {(objectsError as Error).message}</p>
                <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                  Tentar Novamente
                </Button>
              </div>
            ) : filteredPrefixes.length === 0 && filteredObjects.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>
                  {currentPrefix
                    ? "Esta pasta está vazia."
                    : "Nenhum arquivo neste bucket ainda."}
                </p>
                {canWrite && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" /> Fazer Upload
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-4 pl-6 text-sm font-medium text-muted-foreground">
                        Nome
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        Tamanho
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        Última Modificação
                      </th>
                      <th className="text-right p-4 pr-6 text-sm font-medium text-muted-foreground">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {/* Go up folder */}
                    {currentPrefix && (
                      <tr
                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={navigateUp}
                      >
                        <td className="p-4 pl-6" colSpan={4}>
                          <div className="flex items-center gap-3">
                            <FolderOpen className="h-5 w-5 text-amber-500" />
                            <span className="font-medium text-slate-600">
                              ..
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Folders (prefixes) */}
                    {filteredPrefixes.map((prefix) => (
                      <tr
                        key={prefix}
                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigateToFolder(prefix)}
                      >
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <FolderOpen className="h-5 w-5 text-amber-500" />
                            <span className="font-medium">
                              {getDisplayName(prefix, currentPrefix)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">—</td>
                        <td className="p-4 text-sm text-muted-foreground">—</td>
                        <td className="p-4 pr-6 text-right">
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}

                    {/* Files */}
                    {filteredObjects.map((obj) => (
                      <tr
                        key={obj.name}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            {getFileIcon(obj.name)}
                            <span className="font-medium">
                              {getDisplayName(obj.name, currentPrefix)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {formatBytes(obj.size)}
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {formatDate(obj.lastModified)}
                        </td>
                        <td className="p-4 pr-6">
                          <div className="flex items-center justify-end gap-1">
                            {canRead && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title={isPreviewable(obj.name) ? "Visualizar" : "Abrir"}
                                  onClick={() => handlePreview(obj)}
                                  disabled={isLoadingPreview}
                                >
                                  {isLoadingPreview && previewFile?.name === obj.name ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Download"
                                  onClick={() => handleDownload(obj)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {canWrite && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Excluir"
                                onClick={() => {
                                  setObjectToDelete(obj);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Preview Modal */}
        <FilePreviewModal
          isOpen={previewOpen}
          onClose={handleClosePreview}
          file={previewFile}
          previewUrl={previewUrl}
          onDownload={() => previewFile && handleDownload(previewFile)}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Arquivo</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir este arquivo? Esta ação não pode
                ser desfeita.
              </DialogDescription>
            </DialogHeader>
            {objectToDelete && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                {getFileIcon(objectToDelete.name)}
                <div>
                  <p className="font-medium">
                    {getDisplayName(objectToDelete.name, currentPrefix)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatBytes(objectToDelete.size)}
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
