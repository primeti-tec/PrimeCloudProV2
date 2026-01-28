
import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AppBrandingProps {
    accountId: number;
    initialData: {
        brandingAppName?: string;
        brandingIconUrl?: string;
        brandingThemeColor?: string;
        brandingBgColor?: string;
    };
}

export function AppBranding({ accountId, initialData }: AppBrandingProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial State Fix: Ensure no undefined values to prevent React "uncontrolled input" warning
    const [appName, setAppName] = useState(initialData.brandingAppName || "");
    const [themeColor, setThemeColor] = useState(initialData.brandingThemeColor || "#ffffff");
    const [bgColor, setBgColor] = useState(initialData.brandingBgColor || "#ffffff");
    const [previewIcon, setPreviewIcon] = useState<string | null>(initialData.brandingIconUrl || null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const uploadMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            const res = await fetch(`/api/accounts/${accountId}/branding`, {
                method: "POST",
                body: formData,
            });
            if (!res.ok) throw new Error("Falha ao salvar aplicativo");
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
            toast({ title: "App Atualizado", description: "Configurações do aplicativo salvas com sucesso." });
            if (data.iconUrl) {
                setPreviewIcon(`${data.iconUrl}?t=${new Date().getTime()}`);
            }
        },
        onError: () => toast({ title: "Erro", description: "Erro ao processar imagem.", variant: "destructive" }),
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewIcon(objectUrl);
        }
    };

    const handleSave = () => {
        const formData = new FormData();
        formData.append("appName", appName);
        formData.append("themeColor", themeColor);
        formData.append("bgColor", bgColor);

        if (selectedFile) {
            formData.append("file", selectedFile);
        }

        // Logic check: If user has no existing icon AND didn't upload one, warn them.
        // But if they just want to change the Name/Color of an existing app, that's fine.
        if (!selectedFile && !initialData.brandingIconUrl && !previewIcon) {
            toast({ title: "Imagem Obrigatória", description: "Por favor selecione um ícone para o app.", variant: "destructive" });
            return;
        }

        uploadMutation.mutate(formData);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label>Nome do App (Curto)</Label>
                    <Input
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        placeholder="Ex: Minha Empresa"
                        maxLength={12}
                    />
                    <p className="text-xs text-muted-foreground">Nome que aparece abaixo do ícone na tela inicial (Máx 12)</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Cor de Fundo (Splash)</Label>
                        <div className="flex gap-2">
                            <Input
                                type="color"
                                value={bgColor}
                                onChange={(e) => setBgColor(e.target.value)}
                                className="w-12 h-10 p-1"
                            />
                            <Input
                                value={bgColor}
                                onChange={(e) => setBgColor(e.target.value)}
                                className="flex-1"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Cor do Tema (Status Bar)</Label>
                        <div className="flex gap-2">
                            <Input
                                type="color"
                                value={themeColor}
                                onChange={(e) => setThemeColor(e.target.value)}
                                className="w-12 h-10 p-1"
                            />
                            <Input
                                value={themeColor}
                                onChange={(e) => setThemeColor(e.target.value)}
                                className="flex-1"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Ícone do App (Alta Resolução)</Label>
                    <div
                        className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {previewIcon ? (
                            <div className="relative w-32 h-32 mb-4">
                                <img src={previewIcon} alt="Preview" className="w-full h-full object-contain rounded-xl shadow-md" />
                            </div>
                        ) : (
                            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                        )}
                        <p className="text-sm font-medium">Toque para selecionar</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, 1024x1024 (Recomendado)</p>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/png,image/jpeg"
                        onChange={handleFileChange}
                    />
                </div>

                <Button onClick={handleSave} disabled={uploadMutation.isPending} className="w-full">
                    {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar e Gerar Ícones
                </Button>
            </div>

            {/* Preview Section - The "Container" Strategy Visualization */}
            <div className="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-xl p-8">
                <Label className="mb-4 text-muted-foreground font-semibold flex items-center gap-2">
                    <Smartphone className="h-4 w-4" /> Prévia (Android/iOS)
                </Label>

                {/* Mobile Frame */}
                <div className="relative w-[280px] h-[580px] bg-black rounded-[3rem] shadow-2xl border-4 border-gray-800 overflow-hidden">
                    {/* Screen Content */}
                    <div className="absolute inset-0 bg-wallpaper bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1557683316-973673baf926?w=400&q=80)' }}>
                        {/* Status Bar Mock */}
                        <div className="h-6 w-full flex justify-between px-6 items-center text-[10px] font-bold text-white/80 mt-2">
                            <span>12:30</span>
                            <div className="flex gap-1">
                                <span className="w-3 h-3 bg-white/80 rounded-full"></span>
                                <span className="w-3 h-3 border border-white/80 rounded-[2px] relative overflow-hidden">
                                    <span className="absolute inset-y-0 left-0 w-2/3 bg-white/80"></span>
                                </span>
                            </div>
                        </div>

                        {/* App Grid */}
                        <div className="grid grid-cols-4 gap-4 p-4 mt-8">
                            {/* Random Apps */}
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex flex-col items-center gap-1">
                                    <div className="w-14 h-14 bg-white/20 rounded-2xl backdrop-blur-sm"></div>
                                    <div className="h-2 w-8 bg-white/20 rounded-full"></div>
                                </div>
                            ))}

                            {/* OUR APP */}
                            <div className="flex flex-col items-center gap-1 animate-in zoom-in duration-500">
                                {/* THE CONTAINER STRATEGY: White background with safe zone */}
                                <div className="w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center p-2 relative overflow-hidden">
                                    {previewIcon ? (
                                        <img src={previewIcon} className="w-full h-full object-contain" alt="App Icon" />
                                    ) : (
                                        <span className="text-xs font-bold text-gray-400">?</span>
                                    )}
                                </div>
                                <span className="text-[10px] font-medium text-white drop-shadow-md truncate max-w-[60px] text-center">
                                    {appName || "Seu App"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center max-w-xs">
                    Isso é como seu app aparecerá na tela inicial do cliente. A logo é centralizada automaticamente em um fundo seguro.
                </p>
            </div>
        </div>
    );
}
