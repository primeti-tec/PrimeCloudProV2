import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { useBranding } from "@/components/branding-provider";
import { useMyAccounts } from "@/hooks/use-accounts";
import { usePermissions } from "@/hooks/use-permissions";
import {
  useBuckets,
  useBucketObjects,
  useUploadFile,
  useDeleteObject,
  useGetDownloadUrl,
  useBucketFavorites,
  useAddFavorite,
  useRemoveFavorite,
  useBucketTags,
  useAddTag,
  useRemoveTag,
  useBucketSharesByMe,
  useBucketSharesWithMe,
  useCreateShare,
  useRevokeShare,
  type ListObjectsResponse,
  type BucketObject,
} from "@/hooks/use-buckets";
import { Button, Input } from "@/components/ui-custom";
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
  Star,
  Tag,
  Upload,
  Download,
  Trash2,
  Home,
  RefreshCw,
  Eye,
  Search,
  Bell,
  List,
  Plus,
  Share2,
  User,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import type { Bucket } from "@shared/schema";

type BucketWithPermission = Bucket & { userPermission?: "read" | "write" | "read-write" };

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
  const [location, setLocation] = useLocation();
  const { data: accounts, isLoading: isAccountsLoading } = useMyAccounts();
  const { isExternalClient } = usePermissions();
  const branding = useBranding();
  const bucketIdInt = parseInt(bucketId || "0");

  // Find the current account - for now we default to the first one
  // In a multi-account scenario, we should find the account that owns this bucket
  const currentAccount = accounts?.[0];

  const { data: buckets, isLoading: isBucketsLoading } = useBuckets(currentAccount?.id);
  const bucket = (buckets as BucketWithPermission[] | undefined)?.find((b) => b.id === bucketIdInt);

  // Debug logs
  logger.log(`[BucketBrowser] Render: bucketId=${bucketIdInt}, isExternal=${isExternalClient}`);
  logger.log(`[BucketBrowser] Accounts:`, accounts?.length);
  logger.log(`[BucketBrowser] Current Account:`, currentAccount?.id);
  logger.log(`[BucketBrowser] Buckets in Current Account:`, buckets?.length);
  logger.log(`[BucketBrowser] Target Bucket Found:`, !!bucket);
  if (bucket) logger.log(`[BucketBrowser] Bucket Permission:`, bucket.userPermission);

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

  // Share state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<BucketObject | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareExpiresDays, setShareExpiresDays] = useState("");
  const [shareAccess, setShareAccess] = useState<"read" | "download">("read");
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  // Tag state
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagTarget, setTagTarget] = useState<BucketObject | null>(null);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (!shareDialogOpen) {
      setShareTarget(null);
      setShareUrl(null);
      setShareEmail("");
      setShareExpiresDays("");
      setShareAccess("read");
    }
  }, [shareDialogOpen]);

  useEffect(() => {
    if (!tagDialogOpen) {
      setTagTarget(null);
      setTagInput("");
    }
  }, [tagDialogOpen]);


  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getViewFromSearch = () => {
    if (typeof window === "undefined") return "all";
    const params = new URLSearchParams(window.location.search);
    return params.get("view") || "all";
  };
  const [viewParam, setViewParam] = useState(getViewFromSearch);

  useEffect(() => {
    const updateView = () => setViewParam(getViewFromSearch());
    const handlePopState = () => updateView();
    const handleHashChange = () => updateView();

    const originalPush = history.pushState;
    const originalReplace = history.replaceState;

    history.pushState = function (this: History, ...args: Parameters<History["pushState"]>) {
      const result = originalPush.apply(this, args);
      updateView();
      return result;
    } as History["pushState"];

    history.replaceState = function (this: History, ...args: Parameters<History["replaceState"]>) {
      const result = originalReplace.apply(this, args);
      updateView();
      return result;
    } as History["replaceState"];

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      history.pushState = originalPush;
      history.replaceState = originalReplace;
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);
  const allowedViews = ["all", "recent", "favorites", "shared-with-you", "shared-by-link", "tags"];
  const activeView = allowedViews.includes(viewParam) ? viewParam : "all";
  const listPrefix = activeView === "all" ? currentPrefix : "";
  const listRecursive = activeView !== "all";
  const cacheKey = currentAccount?.id && bucket?.id
    ? `bucketObjects:${currentAccount.id}:${bucket.id}:${activeView}`
    : null;
  const cachedInitialData = (() => {
    if (!cacheKey || activeView === "all") return undefined;
    try {
      const raw = window.localStorage.getItem(cacheKey);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw) as { ts: number; data: ListObjectsResponse };
      if (!parsed?.ts || !parsed?.data) return undefined;
      if (Date.now() - parsed.ts > 10 * 60 * 1000) return undefined;
      return parsed.data;
    } catch {
      return undefined;
    }
  })();

  const {
    data: objectsData,
    isLoading: isObjectsLoading,
    error: objectsError,
    refetch,
  } = useBucketObjects(currentAccount?.id, bucket?.id, listPrefix, listRecursive, cachedInitialData);

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

  const { data: favoritesData } = useBucketFavorites(currentAccount?.id, bucket?.id);
  const { mutate: addFavorite } = useAddFavorite(currentAccount?.id, bucket?.id);
  const { mutate: removeFavorite } = useRemoveFavorite(currentAccount?.id, bucket?.id);

  const { data: tagsData } = useBucketTags(currentAccount?.id, bucket?.id);
  const { mutate: addTag } = useAddTag(currentAccount?.id, bucket?.id);
  const { mutate: removeTag } = useRemoveTag(currentAccount?.id, bucket?.id);

  const { data: sharesByMe } = useBucketSharesByMe(currentAccount?.id, bucket?.id);
  const { data: sharesWithMe } = useBucketSharesWithMe(currentAccount?.id, bucket?.id);
  const { mutateAsync: createShare } = useCreateShare(currentAccount?.id, bucket?.id);
  const { mutate: revokeShare } = useRevokeShare(currentAccount?.id, bucket?.id);

  // Permission checks
  const canRead =
    !isExternalClient ||
    bucket?.userPermission === "read" ||
    bucket?.userPermission === "read-write";
  const canWrite =
    !isExternalClient ||
    bucket?.userPermission === "write" ||
    bucket?.userPermission === "read-write";

  const viewLabelMap: Record<string, string> = {
    all: "Todos os arquivos",
    recent: "Recentes",
    favorites: "Favoritos",
    "shared-with-you": "Compartilhado com você",
    "shared-by-link": "Compartilhado por link",
    tags: "Tags",
  };

  useEffect(() => {
    if (activeView !== "all" && currentPrefix) {
      setCurrentPrefix("");
    }
  }, [activeView, currentPrefix]);

  const favoriteSet = new Set(favoritesData?.keys || []);
  const tagsMap = new Map(
    (tagsData?.tags || []).map((entry) => [entry.key, entry.tags])
  );
  const taggedKeys = new Set(tagsMap.keys());
  const sharedByKeys = new Set((sharesByMe || []).map((share) => share.objectKey));
  const sharedByLinkKeys = new Set(
    (sharesByMe || [])
      .filter((share) => !share.sharedWithEmail)
      .map((share) => share.objectKey)
  );
  const sharedWithKeys = new Set((sharesWithMe || []).map((share) => share.objectKey));

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

  const displayPrefixes = activeView === "all" ? filteredPrefixes : [];
  const displayObjects = activeView === "recent"
    ? [...filteredObjects]
        .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
        .slice(0, 10)
    : activeView === "favorites"
      ? filteredObjects.filter((obj) => favoriteSet.has(obj.name))
      : activeView === "shared-by-link"
        ? filteredObjects.filter((obj) => sharedByLinkKeys.has(obj.name))
        : activeView === "shared-with-you"
          ? filteredObjects.filter((obj) => sharedWithKeys.has(obj.name))
          : activeView === "tags"
            ? filteredObjects.filter((obj) => taggedKeys.has(obj.name))
            : filteredObjects;
  const isFilteredEmpty = activeView !== "all" && displayObjects.length === 0;

  useEffect(() => {
    if (!cacheKey || activeView === "all") return;
    if (!objectsData) return;

    const cachedData: ListObjectsResponse = {
      objects: displayObjects.slice(0, 300),
      prefixes: [],
      prefix: "",
    };

    try {
      window.localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: cachedData }));
    } catch {
      // ignore storage errors
    }
  }, [cacheKey, activeView, objectsData, displayObjects]);

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

  const handleToggleFavorite = (obj: BucketObject) => {
    if (favoriteSet.has(obj.name)) {
      removeFavorite(obj.name);
      return;
    }
    addFavorite(obj.name);
  };

  const handleOpenShare = (obj: BucketObject) => {
    const existingShare = (sharesByMe || []).find((share) => share.objectKey === obj.name);
    setShareTarget(obj);
    setShareDialogOpen(true);
    setShareEmail("");
    setShareExpiresDays("");
    setShareAccess((existingShare?.access as "read" | "download") || "read");
    setShareUrl(existingShare?.shareUrl || null);
  };

  const handleCreateShare = async () => {
    if (!shareTarget) return;
    const expiresAt = shareExpiresDays
      ? new Date(Date.now() + Number(shareExpiresDays) * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    try {
      const result = await createShare({
        key: shareTarget.name,
        sharedWithEmail: shareEmail || undefined,
        access: shareAccess,
        expiresAt,
      });
      setShareUrl(result.shareUrl);
      toast({
        title: "Compartilhamento criado",
        description: "Link gerado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar compartilhamento.",
        variant: "destructive",
      });
    }
  };

  const handleCopyShare = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copiado", description: "O link foi copiado para a área de transferência." });
  };

  const handleRevokeShare = (shareId: number) => {
    revokeShare(shareId, {
      onSuccess: () => {
        setShareUrl(null);
        toast({ title: "Compartilhamento revogado", description: "O link foi revogado." });
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao revogar compartilhamento.", variant: "destructive" });
      },
    });
  };

  const handleOpenTags = (obj: BucketObject) => {
    setTagTarget(obj);
    setTagDialogOpen(true);
    setTagInput("");
  };

  const handleAddTag = () => {
    if (!tagTarget || !tagInput.trim()) return;
    addTag({ key: tagTarget.name, tag: tagInput.trim() });
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    if (!tagTarget) return;
    removeTag({ key: tagTarget.name, tag });
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
          <div className="border border-border rounded-lg shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
            <div className="bg-white p-6 border-b border-border/50">
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-32" />
                </div>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>
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

  const currentShare = shareTarget
    ? (sharesByMe || []).find((share) => share.objectKey === shareTarget.name)
    : null;
  const currentTags = tagTarget ? tagsMap.get(tagTarget.name) || [] : [];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-72 flex flex-col min-h-screen">
          <header className="h-14 flex items-center justify-end px-6 text-white" style={{ backgroundColor: branding.primaryColor }}>
            <div className="flex items-center gap-5">
              <Search className="h-4 w-4" />
              <Bell className="h-4 w-4" />
              <div className="h-8 w-8 rounded-full bg-white/70 dark:bg-white/20 flex items-center justify-center text-slate-700">
                <User className="h-4 w-4" />
              </div>
            </div>
          </header>

          <div className="px-6 py-4 bg-card border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setLocation("/dashboard/storage")}
                title="Voltar para Armazenamento"
              >
                <Home className="h-4 w-4" />
              </button>
              <span className="text-slate-300">|</span>
              <span className="text-sm font-semibold text-foreground">{branding.name || bucket.name}</span>
              {branding.name && branding.name !== bucket.name && (
                <span className="text-xs text-muted-foreground">{bucket.name}</span>
              )}
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                {viewLabelMap[activeView] || "Todos os arquivos"}
              </span>
              {isExternalClient && (
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    bucket.userPermission === "read-write"
                      ? "bg-green-100 text-green-700"
                      : bucket.userPermission === "write"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {bucket.userPermission === "read-write"
                    ? "Leitura e Escrita"
                    : bucket.userPermission === "write"
                      ? "Somente Escrita"
                      : "Somente Leitura"}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  if (canWrite) fileInputRef.current?.click();
                }}
                className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground"
                disabled={!canWrite}
                title={canWrite ? "Upload" : "Sem permissão"}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4" />
                <Input
                  placeholder="Buscar"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-sm bg-background"
                />
              </div>
              <button type="button" className="text-muted-foreground">
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => refetch()}
                className="text-muted-foreground"
                title="Atualizar"
              >
                <RefreshCw className={`h-4 w-4 ${isObjectsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          <div className="flex-1 bg-muted/30 dark:bg-background/40 p-6 overflow-y-auto">
            {uploadProgress !== null && (
              <div className="mb-4 flex items-center gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-700">Enviando arquivo...</p>
                  <Progress value={uploadProgress} className="h-2 mt-1" />
                </div>
                <span className="text-sm text-blue-600">{Math.round(uploadProgress)}%</span>
              </div>
            )}

            <div className="bg-card shadow-sm border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="w-10 p-4">
                      <input type="checkbox" />
                    </th>
                    <th className="p-4">Nome</th>
                    <th className="p-4 hidden md:table-cell">Tamanho</th>
                    <th className="p-4 hidden md:table-cell">Modificado</th>
                    <th className="p-4 text-right"> </th>
                  </tr>
                </thead>
                <tbody>
                  {isObjectsLoading ? (
                    <tr>
                      <td colSpan={5} className="p-6">
                        <div className="space-y-3">
                          {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ) : objectsError ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-destructive">
                        <p>Erro ao carregar arquivos: {(objectsError as Error).message}</p>
                        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                          Tentar Novamente
                        </Button>
                      </td>
                    </tr>
                  ) : (displayPrefixes.length === 0 && displayObjects.length === 0) || isFilteredEmpty ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-muted-foreground">
                        <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>
                          {isFilteredEmpty
                            ? "Nenhum item para este filtro."
                            : currentPrefix
                              ? "Esta pasta está vazia."
                              : "Nenhum arquivo neste bucket ainda."}
                        </p>
                        {canWrite && (
                          <Button variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="h-4 w-4 mr-2" /> Fazer Upload
                          </Button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    <>
                      {currentPrefix && activeView === "all" && (
                        <tr className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={navigateUp}>
                          <td className="p-4">
                            <input type="checkbox" />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <FolderOpen className="h-4 w-4 text-blue-500" />
                              <span className="font-medium">..</span>
                            </div>
                          </td>
                          <td className="p-4 hidden md:table-cell text-muted-foreground">—</td>
                          <td className="p-4 hidden md:table-cell text-muted-foreground">—</td>
                          <td className="p-4 text-right text-muted-foreground">
                            <Share2 className="h-4 w-4 inline" />
                          </td>
                        </tr>
                      )}

                      {displayPrefixes.map((prefix) => (
                        <tr
                          key={prefix}
                          className="hover:bg-muted/20 transition-colors cursor-pointer"
                          onClick={() => navigateToFolder(prefix)}
                        >
                          <td className="p-4">
                            <input type="checkbox" />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <FolderOpen className="h-4 w-4 text-blue-500" />
                              <span className="font-medium">
                                {getDisplayName(prefix, currentPrefix)}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 hidden md:table-cell text-muted-foreground">0 KB</td>
                          <td className="p-4 hidden md:table-cell text-muted-foreground">—</td>
                          <td className="p-4 text-right text-muted-foreground">
                            <Share2 className="h-4 w-4 inline" />
                          </td>
                        </tr>
                      ))}

                      {displayObjects.map((obj) => (
                        <tr key={obj.name} className="hover:bg-muted/20 transition-colors">
                          <td className="p-4">
                            <input type="checkbox" />
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-3">
                                {getFileIcon(obj.name)}
                                <span className="font-medium">
                                  {getDisplayName(obj.name, currentPrefix)}
                                </span>
                              </div>
                              {(tagsMap.get(obj.name) || []).length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {(tagsMap.get(obj.name) || []).map((tag) => (
                                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4 hidden md:table-cell text-muted-foreground">
                            {formatBytes(obj.size)}
                          </td>
                          <td className="p-4 hidden md:table-cell text-muted-foreground">
                            {formatDate(obj.lastModified)}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2 text-muted-foreground">
                              {canRead && (
                                <>
                                  <button
                                    type="button"
                                    title={favoriteSet.has(obj.name) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                                    onClick={() => handleToggleFavorite(obj)}
                                    className={favoriteSet.has(obj.name) ? "text-yellow-500" : ""}
                                  >
                                    <Star className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Tags"
                                    onClick={() => handleOpenTags(obj)}
                                  >
                                    <Tag className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Compartilhar"
                                    onClick={() => handleOpenShare(obj)}
                                  >
                                    <Share2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              {canRead && (
                                <>
                                  <button
                                    type="button"
                                    title={isPreviewable(obj.name) ? "Visualizar" : "Abrir"}
                                    onClick={() => handlePreview(obj)}
                                    disabled={isLoadingPreview}
                                  >
                                    {isLoadingPreview && previewFile?.name === obj.name ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </button>
                                  <button type="button" title="Download" onClick={() => handleDownload(obj)}>
                                    <Download className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              {canWrite && (
                                <button
                                  type="button"
                                  title="Excluir"
                                  onClick={() => {
                                    setObjectToDelete(obj);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />

          {/* File Preview Modal */}
          <FilePreviewModal
            isOpen={previewOpen}
            onClose={handleClosePreview}
            file={previewFile}
            previewUrl={previewUrl}
            onDownload={() => previewFile && handleDownload(previewFile)}
          />

          {/* Share Dialog */}
          <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Compartilhar Arquivo</DialogTitle>
                <DialogDescription>
                  Gere um link de compartilhamento ou envie para um email.
                </DialogDescription>
              </DialogHeader>
              {shareTarget && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    {getFileIcon(shareTarget.name)}
                    <div>
                      <p className="font-medium">{getDisplayName(shareTarget.name, currentPrefix)}</p>
                      <p className="text-sm text-muted-foreground">{formatBytes(shareTarget.size)}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Email (opcional)</label>
                    <Input
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      placeholder="cliente@empresa.com"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Acesso</label>
                      <select
                        value={shareAccess}
                        onChange={(e) => setShareAccess(e.target.value as "read" | "download")}
                        className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                      >
                        <option value="read">Visualizar</option>
                        <option value="download">Download</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Expira em (dias)</label>
                      <Input
                        type="number"
                        value={shareExpiresDays}
                        onChange={(e) => setShareExpiresDays(e.target.value)}
                        min={1}
                        placeholder="Opcional"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {shareUrl && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Link gerado</label>
                      <div className="flex gap-2">
                        <Input value={shareUrl} readOnly className="bg-background" />
                        <Button variant="outline" onClick={handleCopyShare}>Copiar</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter className="flex justify-between">
                {currentShare && (
                  <Button
                    variant="outline"
                    onClick={() => handleRevokeShare(currentShare.id)}
                  >
                    Revogar link
                  </Button>
                )}
                <Button onClick={handleCreateShare}>Gerar link</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Tags Dialog */}
          <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tags do Arquivo</DialogTitle>
                <DialogDescription>Adicione ou remova tags para este arquivo.</DialogDescription>
              </DialogHeader>
              {tagTarget && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    {getFileIcon(tagTarget.name)}
                    <div>
                      <p className="font-medium">{getDisplayName(tagTarget.name, currentPrefix)}</p>
                      <p className="text-sm text-muted-foreground">{formatBytes(tagTarget.size)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Nova tag"
                      className="bg-background"
                    />
                    <Button onClick={handleAddTag}>Adicionar</Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {currentTags.length === 0 && (
                      <span className="text-sm text-muted-foreground">Nenhuma tag cadastrada.</span>
                    )}
                    {currentTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground hover:bg-muted/70"
                      >
                        {tag} <span className="ml-1">×</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Excluir Arquivo</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja excluir este arquivo? Esta ação não pode ser desfeita.
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
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
                  {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Excluir
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      </main>
    </div>
  );
}
