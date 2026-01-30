
import { useState } from "react";
// import { Sidebar } from "@/components/Sidebar"; // Removed
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAccount, useMyAccounts } from "@/hooks/use-accounts";
import { useAccessKeys } from "@/hooks/use-access-keys";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui-custom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
    Copy, Check, Download, ExternalLink, Cloud, Server, HardDrive,
    Shield, FileCode, PlayCircle, CheckCircle, XCircle, Loader2,
    Settings, Info, AlertTriangle
} from "lucide-react";

// Supported backup software
const BACKUP_SOFTWARE = [
    {
        id: "imperius",
        name: "Imperius Backup",
        tier: 1,
        icon: "⚡",
        description: "Software de backup brasileiro com suporte completo S3",
        configFile: "config.xml",
        tutorialId: "imperius"
    },
    {
        id: "veeam",
        name: "Veeam Backup & Replication",
        tier: 1,
        icon: "🟢",
        description: "Solução enterprise líder de mercado",
        configFile: "veeam-repo.json",
        tutorialId: "veeam"
    },
    {
        id: "acronis",
        name: "Acronis Cyber Backup",
        tier: 1,
        icon: "🔵",
        description: "Backup e recuperação de desastres",
        configFile: "acronis-cloud.xml",
        tutorialId: "acronis"
    },
    {
        id: "duplicati",
        name: "Duplicati",
        tier: 2,
        icon: "📦",
        description: "Backup open-source gratuito",
        configFile: "duplicati-config.json",
        tutorialId: "duplicati"
    },
    {
        id: "restic",
        name: "Restic",
        tier: 2,
        icon: "🔒",
        description: "Backup rápido, seguro e eficiente",
        configFile: "restic-env.sh",
        tutorialId: "restic"
    },
    {
        id: "rclone",
        name: "rclone",
        tier: 2,
        icon: "☁️",
        description: "Rsync para armazenamento em nuvem",
        configFile: "rclone.conf",
        tutorialId: "rclone"
    },
];

// S3 Endpoint configuration
const S3_CONFIG = {
    endpoint: "s3.cloudstoragepro.com.br",
    region: "us-east-1",
    port: 443,
    useSSL: true,
};

export default function BackupConfig() {
    const { toast } = useToast();
    const { data: myAccountsData } = useMyAccounts();
    const selectedAccountId = (myAccountsData?.[0] as any)?.account?.id;
    const { data: account } = useAccount(selectedAccountId!);
    const { data: accessKeys } = useAccessKeys(selectedAccountId!);

    const [selectedSoftware, setSelectedSoftware] = useState<string | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");

    // Use the first active access key
    const activeKey = accessKeys?.find((k: any) => k.isActive);

    const copyToClipboard = async (text: string, field: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
        toast({
            title: "Copiado!",
            description: `${field} copiado para a área de transferência.`,
        });
    };

    const handleTestConnection = async () => {
        setTestStatus("testing");

        // Simulate API call to test connection
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock success (in production, would call /api/backup/test-connection)
        const success = Math.random() > 0.2;

        if (success) {
            setTestStatus("success");
            toast({
                title: "✅ Conexão Bem-sucedida!",
                description: "Suas credenciais estão funcionando corretamente.",
            });
        } else {
            setTestStatus("error");
            toast({
                title: "❌ Falha na Conexão",
                description: "Verifique suas credenciais e tente novamente.",
                variant: "destructive",
            });
        }

        setTimeout(() => setTestStatus("idle"), 5000);
    };

    const downloadConfig = (software: typeof BACKUP_SOFTWARE[0]) => {
        let content = "";
        let filename = software.configFile;
        let mimeType = "text/plain";

        const config = {
            endpoint: S3_CONFIG.endpoint,
            port: S3_CONFIG.port,
            region: S3_CONFIG.region,
            accessKeyId: activeKey?.accessKeyId || "YOUR_ACCESS_KEY",
            secretAccessKey: "YOUR_SECRET_KEY",
            useSSL: S3_CONFIG.useSSL,
            bucketName: "backup-" + (account?.slug || "servidor"),
        };

        switch (software.id) {
            case "imperius":
                content = `<?xml version="1.0" encoding="UTF-8"?>
<ImperiusBackupConfig>
  <CloudStorage>
    <Provider>S3Compatible</Provider>
    <DisplayName>Prime Cloud Pro</DisplayName>
    <ServiceURL>https://${config.endpoint}</ServiceURL>
    <Region>${config.region}</Region>
    <AccessKeyID>${config.accessKeyId}</AccessKeyID>
    <SecretAccessKey>${config.secretAccessKey}</SecretAccessKey>
    <BucketName>${config.bucketName}</BucketName>
    <UseSSL>true</UseSSL>
    <Port>443</Port>
  </CloudStorage>
</ImperiusBackupConfig>`;
                mimeType = "application/xml";
                break;

            case "veeam":
                content = JSON.stringify({
                    provider: "S3Compatible",
                    displayName: "Prime Cloud Pro",
                    serviceUrl: `https://${config.endpoint}`,
                    region: config.region,
                    accessKeyId: config.accessKeyId,
                    secretAccessKey: config.secretAccessKey,
                    bucketName: config.bucketName,
                }, null, 2);
                mimeType = "application/json";
                break;

            case "rclone":
                content = `[cloudstoragepro]
type = s3
provider = Minio
access_key_id = ${config.accessKeyId}
secret_access_key = ${config.secretAccessKey}
endpoint = https://${config.endpoint}
region = ${config.region}`;
                break;

            case "restic":
                content = `#!/bin/bash
# Restic Environment Configuration for Prime Cloud Pro
export AWS_ACCESS_KEY_ID="${config.accessKeyId}"
export AWS_SECRET_ACCESS_KEY="${config.secretAccessKey}"
export RESTIC_REPOSITORY="s3:https://${config.endpoint}/${config.bucketName}"
export RESTIC_PASSWORD="your_restic_password_here"`;
                mimeType = "application/x-sh";
                break;

            default:
                content = `# Prime Cloud Pro - S3 Credentials
S3_ENDPOINT=https://${config.endpoint}
S3_REGION=${config.region}
S3_ACCESS_KEY_ID=${config.accessKeyId}
S3_SECRET_ACCESS_KEY=${config.secretAccessKey}
S3_BUCKET=${config.bucketName}`;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        toast({
            title: "Download Iniciado",
            description: `Arquivo ${filename} baixado com sucesso.`,
        });
    };

    const downloadEnvFile = () => {
        const content = `# Prime Cloud Pro - S3 Credentials
# Generated: ${new Date().toISOString()}

S3_ENDPOINT=https://${S3_CONFIG.endpoint}
S3_REGION=${S3_CONFIG.region}
S3_ACCESS_KEY_ID=${activeKey?.accessKeyId || "YOUR_ACCESS_KEY"}
S3_SECRET_ACCESS_KEY=YOUR_SECRET_KEY

# Alternative formats:
AWS_ACCESS_KEY_ID=${activeKey?.accessKeyId || "YOUR_ACCESS_KEY"}
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
AWS_ENDPOINT_URL=https://${S3_CONFIG.endpoint}
`;
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "credentials.env";
        a.click();
        URL.revokeObjectURL(url);
    };

    const selectedSoftwareData = BACKUP_SOFTWARE.find(s => s.id === selectedSoftware);

    return (
        <DashboardLayout>
            <div className="p-6 lg:p-8 overflow-auto w-full">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <HardDrive className="h-8 w-8 text-primary" />
                            Configurar Software de Backup
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Conecte seu software de backup ao Prime Cloud Pro para proteger seus dados.
                        </p>
                    </div>

                    {/* Software Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Selecione seu Software
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {BACKUP_SOFTWARE.map((software) => (
                                    <button
                                        key={software.id}
                                        onClick={() => setSelectedSoftware(software.id)}
                                        className={`p-4 rounded-lg border-2 text-left transition-all ${selectedSoftware === software.id
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">{software.icon}</span>
                                            <div>
                                                <div className="font-medium flex items-center gap-2">
                                                    {software.name}
                                                    {software.tier === 1 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Recomendado
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {software.description}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Credentials Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Credenciais S3
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!activeKey ? (
                                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                    <div className="flex items-center gap-2 text-yellow-600">
                                        <AlertTriangle className="h-5 w-5" />
                                        <span className="font-medium">Nenhuma Access Key ativa</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Você precisa criar uma Access Key antes de configurar o backup.
                                        <Button variant="ghost" className="p-0 h-auto ml-1">
                                            Ir para API Keys →
                                        </Button>
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Credential Fields */}
                                    <div className="grid gap-4">
                                        {[
                                            { label: "Endpoint", value: S3_CONFIG.endpoint },
                                            { label: "Porta", value: String(S3_CONFIG.port) },
                                            { label: "Região", value: S3_CONFIG.region },
                                            { label: "Access Key ID", value: activeKey.accessKeyId },
                                            { label: "SSL/TLS", value: "Habilitado ✅" },
                                        ].map((field) => (
                                            <div key={field.label} className="flex items-center gap-3">
                                                <div className="w-32 text-sm text-muted-foreground">
                                                    {field.label}:
                                                </div>
                                                <div className="flex-1 flex items-center gap-2">
                                                    <code className="flex-1 px-3 py-2 rounded bg-muted font-mono text-sm">
                                                        {field.value}
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => copyToClipboard(field.value, field.label)}
                                                    >
                                                        {copiedField === field.label ? (
                                                            <Check className="h-4 w-4 text-green-500" />
                                                        ) : (
                                                            <Copy className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Secret Key (masked) */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-32 text-sm text-muted-foreground">
                                                Secret Key:
                                            </div>
                                            <div className="flex-1 flex items-center gap-2">
                                                <code className="flex-1 px-3 py-2 rounded bg-muted font-mono text-sm">
                                                    ••••••••••••••••••••••••
                                                </code>
                                                <span className="text-xs text-muted-foreground">
                                                    (Disponível apenas na criação)
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-3 pt-4 border-t">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                const allCreds = `Endpoint: ${S3_CONFIG.endpoint}\nRegião: ${S3_CONFIG.region}\nAccess Key: ${activeKey.accessKeyId}`;
                                                copyToClipboard(allCreds, "Todas credenciais");
                                            }}
                                        >
                                            <Copy className="h-4 w-4 mr-2" />
                                            Copiar Tudo
                                        </Button>
                                        <Button variant="outline" onClick={downloadEnvFile}>
                                            <Download className="h-4 w-4 mr-2" />
                                            Download .env
                                        </Button>
                                        {selectedSoftwareData && (
                                            <Button variant="outline" onClick={() => downloadConfig(selectedSoftwareData)}>
                                                <FileCode className="h-4 w-4 mr-2" />
                                                Download {selectedSoftwareData.configFile}
                                            </Button>
                                        )}
                                        <Button
                                            onClick={handleTestConnection}
                                            disabled={testStatus === "testing"}
                                            className={
                                                testStatus === "success"
                                                    ? "bg-green-600 hover:bg-green-700"
                                                    : testStatus === "error"
                                                        ? "bg-red-600 hover:bg-red-700"
                                                        : ""
                                            }
                                        >
                                            {testStatus === "testing" ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : testStatus === "success" ? (
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                            ) : testStatus === "error" ? (
                                                <XCircle className="h-4 w-4 mr-2" />
                                            ) : (
                                                <PlayCircle className="h-4 w-4 mr-2" />
                                            )}
                                            {testStatus === "testing"
                                                ? "Testando..."
                                                : testStatus === "success"
                                                    ? "Conexão OK!"
                                                    : testStatus === "error"
                                                        ? "Falhou"
                                                        : "Testar Conexão S3"}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tutorial Section */}
                    {selectedSoftwareData && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Info className="h-5 w-5" />
                                    Guia: {selectedSoftwareData.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="steps">
                                    <TabsList>
                                        <TabsTrigger value="steps">Passo a Passo</TabsTrigger>
                                        <TabsTrigger value="tips">Dicas</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="steps" className="space-y-4 mt-4">
                                        <div className="space-y-3">
                                            {getStepsForSoftware(selectedSoftware!).map((step, index) => (
                                                <div key={index} className="flex gap-3">
                                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                                                        {index + 1}
                                                    </div>
                                                    <p className="text-sm pt-0.5">{step}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <Button variant="outline" className="gap-2">
                                                <PlayCircle className="h-4 w-4" />
                                                Assistir Vídeo Tutorial
                                            </Button>

                                            {/* Link para o Guia Markdown */}
                                            {["imperius", "veeam"].includes(selectedSoftware!) && (
                                                <Button
                                                    variant="outline"
                                                    className="gap-2"
                                                    onClick={() => window.open(`/tutorials/${selectedSoftware}-guide.md`, '_blank')}
                                                >
                                                    <FileCode className="h-4 w-4" />
                                                    Ler Guia de Configuração
                                                </Button>
                                            )}

                                            {!["imperius", "veeam"].includes(selectedSoftware!) && (
                                                <Button variant="outline" className="gap-2" disabled>
                                                    <Download className="h-4 w-4" />
                                                    Guia Indisponível
                                                </Button>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="tips" className="mt-4">
                                        <div className="space-y-3">
                                            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                                <p className="text-sm">
                                                    💡 <strong>Dica:</strong> Crie um bucket dedicado para cada servidor de backup.
                                                    Ex: <code className="bg-muted px-1 rounded">backup-web-01</code>, <code className="bg-muted px-1 rounded">backup-db-prod</code>
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                                <p className="text-sm">
                                                    🔄 <strong>Recomendado:</strong> Configure lifecycle policies para deletar backups com mais de 90 dias automaticamente.
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                                <p className="text-sm">
                                                    ⚠️ <strong>Importante:</strong> Teste a restauração de backups periodicamente para garantir que os dados estão íntegros.
                                                </p>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    )}

                    {/* Help Section */}
                    <Card>
                        <CardContent className="py-6">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-medium">Precisa de ajuda?</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Nossa equipe está pronta para ajudar você a configurar seu backup.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                    <Button variant="outline" className="w-full sm:w-auto">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Documentação
                                    </Button>
                                    <Button className="w-full sm:w-auto">
                                        <Cloud className="h-4 w-4 mr-2" />
                                        Falar com Suporte
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

// Tutorial steps for each software
function getStepsForSoftware(softwareId: string): string[] {
    switch (softwareId) {
        case "imperius":
            return [
                "Abra o Imperius Backup Manager no seu servidor",
                "Vá em: Ferramentas → Opções → Armazenamento em Nuvem",
                "Clique em 'Adicionar Novo Armazenamento'",
                "Selecione 'Amazon S3 Compatible'",
                "Cole as credenciais acima nos campos correspondentes",
                "Clique em 'Testar Conexão' para verificar",
                "Salve e configure seu job de backup",
            ];
        case "veeam":
            return [
                "Abra o Veeam Backup & Replication Console",
                "Vá em: Backup Infrastructure → Backup Repositories",
                "Clique com botão direito e selecione 'Add Backup Repository'",
                "Escolha 'Object Storage' → 'S3 Compatible'",
                "Insira o Service Point: https://s3.cloudstoragepro.com.br",
                "Cole suas credenciais de acesso",
                "Selecione ou crie um bucket e configure o repositório",
            ];
        case "acronis":
            return [
                "Abra o Acronis Cyber Backup Console",
                "Vá em: Settings → Cloud Storage",
                "Clique em 'Add Cloud Storage'",
                "Selecione 'S3 Compatible Storage'",
                "Configure o endpoint e credenciais",
                "Teste a conexão e salve",
            ];
        case "duplicati":
            return [
                "Abra o Duplicati via navegador (http://localhost:8200)",
                "Clique em 'Add Backup'",
                "Na etapa de destino, selecione 'S3 Compatible'",
                "Server: s3.cloudstoragepro.com.br",
                "Use path style: Sim",
                "Preencha Access Key ID e Secret Key",
                "Especifique o nome do bucket e finalize",
            ];
        case "restic":
            return [
                "Exporte as variáveis de ambiente (baixe o arquivo .sh)",
                "Execute: source restic-env.sh",
                "Inicialize o repositório: restic init",
                "Execute backup: restic backup /caminho/dados",
                "Verifique: restic snapshots",
            ];
        case "rclone":
            return [
                "Copie a configuração para ~/.config/rclone/rclone.conf",
                "Ou execute: rclone config e configure manualmente",
                "Liste seus buckets: rclone lsd cloudstoragepro:",
                "Sincronize: rclone sync /local/path cloudstoragepro:bucket",
            ];
        default:
            return [
                "Configure seu software com as credenciais S3 acima",
                "Use o endpoint: s3.cloudstoragepro.com.br",
                "Certifique-se de usar HTTPS (porta 443)",
                "Teste a conexão antes de iniciar backups",
            ];
    }
}
