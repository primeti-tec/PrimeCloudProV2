import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Sidebar } from '@/components/Sidebar';
import { VpsConfigurator, VpsConfigData } from '@/components/VpsConfigurator';
import { useMyAccounts } from '@/hooks/use-accounts';
import { useCreateVpsOrder } from '@/hooks/use-vps-order';
import { useCreateBackupOrder } from '@/hooks/use-backup-order';
import { usePricing } from '@/hooks/use-pricing';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
    Server,
    Database,
    Cloud,
    ArrowLeft,
    Sparkles,
    ShoppingCart,
    Cpu,
    Box,
    HardDrive,
    Shield,
    Clock,
    Info,
    Zap,
    Save,
    RefreshCw,
    Archive
} from 'lucide-react';

// Tipos de produtos disponíveis para contratação
const productCategories = [
    {
        id: 'vps',
        name: 'Servidor VPS',
        description: 'Máquinas virtuais de alta performance',
        icon: Server,
        available: true,
        badge: 'Popular',
        badgeColor: 'bg-green-500/10 text-green-600',
    },
    {
        id: 'backup-cloud',
        name: 'Backup em Nuvem',
        description: 'Armazenamento S3 para seus dados críticos',
        icon: Cloud,
        available: true,
        badge: 'Ativo',
        badgeColor: 'bg-blue-500/10 text-blue-600',
    },
    {
        id: 'backup-vps',
        name: 'Backup de VPS Completo',
        description: 'Snapshot completo de máquinas virtuais',
        icon: Save,
        available: true,
        badge: 'Novo',
        badgeColor: 'bg-purple-500/10 text-purple-600',
    },
    {
        id: 'dedicated',
        name: 'Servidor Dedicado',
        description: 'Hardware exclusivo para sua aplicação',
        icon: Cpu,
        available: false,
        badge: 'Em breve',
        badgeColor: 'bg-yellow-500/10 text-yellow-600',
    },
    {
        id: 'storage',
        name: 'Object Storage',
        description: 'Armazenamento compatível com S3',
        icon: Database,
        available: false,
        badge: 'Em breve',
        badgeColor: 'bg-yellow-500/10 text-yellow-600',
    },
    {
        id: 'colocation',
        name: 'Colocation',
        description: 'Hospede seu hardware em nosso datacenter',
        icon: Box,
        available: false,
        badge: 'Em breve',
        badgeColor: 'bg-yellow-500/10 text-yellow-600',
    },
];

// Preços padrão de backup (em centavos) - fallback caso API não retorne
const DEFAULT_BACKUP_PRICES = {
    storagePerGB: 8, // R$ 0,08 por GB
    retentionPerDay: 50, // R$ 0,50 por dia de retenção além do básico
    encryptedBonus: 0, // Criptografia gratuita
    dailyBackup: 2000, // R$ 20,00 base diário
    weeklyBackup: 1000, // R$ 10,00 base semanal
    monthlyBackup: 500, // R$ 5,00 base mensal
};

const DEFAULT_VPS_BACKUP_PRICES = {
    perGB: 15, // R$ 0,15 por GB de VM
    dailyMultiplier: 150, // 150% = 1.5x (armazenado como porcentagem)
    weeklyMultiplier: 100, // 100% = 1.0x
    monthlyMultiplier: 50, // 50% = 0.5x
    snapshotBase: 5000, // R$ 50,00 base
    retentionPerDay: 100, // R$ 1,00 por dia
    databaseAddon: 2000, // R$ 20,00 addon databases
};

// Componente de Configurador de Backup em Nuvem
function BackupCloudConfigurator({ onSubmit, isSubmitting }: { onSubmit: (data: any) => void, isSubmitting?: boolean }) {
    // Buscar preços dinâmicos do backend
    const { data: pricingData } = usePricing('backup_cloud');

    // Mapear preços da API
    const BACKUP_PRICES = useMemo(() => {
        if (!pricingData || pricingData.length === 0) return DEFAULT_BACKUP_PRICES;

        const priceMap = pricingData.reduce((acc, p) => {
            acc[p.resourceKey] = p.priceCents;
            return acc;
        }, {} as Record<string, number>);

        return {
            storagePerGB: priceMap['storage_per_gb'] ?? DEFAULT_BACKUP_PRICES.storagePerGB,
            retentionPerDay: priceMap['retention_per_day'] ?? DEFAULT_BACKUP_PRICES.retentionPerDay,
            encryptedBonus: 0,
            dailyBackup: priceMap['daily_backup'] ?? DEFAULT_BACKUP_PRICES.dailyBackup,
            weeklyBackup: priceMap['weekly_backup'] ?? DEFAULT_BACKUP_PRICES.weeklyBackup,
            monthlyBackup: priceMap['monthly_backup'] ?? DEFAULT_BACKUP_PRICES.monthlyBackup,
        };
    }, [pricingData]);

    const [storageGB, setStorageGB] = useState(100);
    const [frequency, setFrequency] = useState('daily');
    const [retention, setRetention] = useState(30);
    const [encrypted, setEncrypted] = useState(true);
    const [notes, setNotes] = useState('');

    const storageSteps = [50, 100, 250, 500, 1000, 2000, 5000, 10000];
    const [storageIndex, setStorageIndex] = useState(1);
    const currentStorage = storageSteps[storageIndex];

    const retentionSteps = [7, 14, 30, 60, 90, 180, 365];
    const [retentionIndex, setRetentionIndex] = useState(2);
    const currentRetention = retentionSteps[retentionIndex];

    // Calcular preço (agora usando preços dinâmicos)
    const calculatePrice = () => {
        let total = 0;
        total += currentStorage * BACKUP_PRICES.storagePerGB;
        if (frequency === 'daily') total += BACKUP_PRICES.dailyBackup;
        else if (frequency === 'weekly') total += BACKUP_PRICES.weeklyBackup;
        else total += BACKUP_PRICES.monthlyBackup;
        if (currentRetention > 30) {
            total += (currentRetention - 30) * BACKUP_PRICES.retentionPerDay;
        }
        return total;
    };

    const estimatedPrice = calculatePrice();

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
    };

    const handleSubmit = () => {
        onSubmit({
            type: 'backup-cloud',
            storageGB: currentStorage,
            frequency,
            retentionDays: currentRetention,
            encrypted,
            notes,
            estimatedPrice,
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card className="border-primary/20 bg-gradient-to-br from-blue-500/5 to-transparent">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <Cloud className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Backup em Nuvem</CardTitle>
                                <CardDescription>Armazenamento seguro compatível com S3</CardDescription>
                            </div>
                        </div>
                        <Badge variant="outline" className="w-fit mt-2 bg-blue-500/10 text-blue-600 border-blue-500/30">
                            <Shield className="h-3 w-3 mr-1" />
                            CRIPTOGRAFIA AES-256
                        </Badge>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <HardDrive className="h-5 w-5 text-muted-foreground" />
                            Capacidade de Armazenamento
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Espaço disponível</span>
                            <span className="text-2xl font-bold">{currentStorage} GB</span>
                        </div>
                        <Slider
                            value={[storageIndex]}
                            onValueChange={([v]) => setStorageIndex(v)}
                            max={storageSteps.length - 1}
                            step={1}
                            className="[&_[role=slider]]:bg-blue-600"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>50 GB</span>
                            <span>10 TB</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-muted-foreground" />
                            Frequência de Backup
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select value={frequency} onValueChange={setFrequency}>
                            <SelectTrigger className="w-full h-12">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-green-500" />
                                        <span>Diário (+R$ 20,00/mês)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="weekly">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-blue-500" />
                                        <span>Semanal (+R$ 10,00/mês)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="monthly">
                                    <div className="flex items-center gap-2">
                                        <Archive className="h-4 w-4 text-gray-500" />
                                        <span>Mensal (+R$ 5,00/mês)</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            Período de Retenção
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Manter backups por</span>
                            <span className="text-2xl font-bold">{currentRetention} dias</span>
                        </div>
                        <Slider
                            value={[retentionIndex]}
                            onValueChange={([v]) => setRetentionIndex(v)}
                            max={retentionSteps.length - 1}
                            step={1}
                            className="[&_[role=slider]]:bg-blue-600"
                        />
                        <p className="text-xs text-muted-foreground">
                            Até 30 dias incluídos. Acima disso: +R$ 0,50/dia adicional
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Shield className="h-5 w-5 text-green-600" />
                                <div>
                                    <Label className="text-base">Criptografia AES-256</Label>
                                    <p className="text-sm text-muted-foreground">Proteção total dos seus dados</p>
                                </div>
                            </div>
                            <Switch checked={encrypted} onCheckedChange={setEncrypted} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Observações</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Descreva suas necessidades específicas de backup..."
                            rows={3}
                        />
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-1">
                <div className="sticky top-6">
                    <Card className="border-2 border-blue-500/20 shadow-lg">
                        <CardHeader className="pb-3 bg-gradient-to-br from-blue-500/5 to-transparent">
                            <CardTitle className="text-lg">Resumo do Backup</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center py-4">
                                <p className="text-4xl font-bold text-blue-600">{formatCurrency(estimatedPrice)}</p>
                                <p className="text-sm text-muted-foreground">/mês</p>
                            </div>
                            <Separator />
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Armazenamento</span>
                                    <span className="font-medium">{currentStorage} GB</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Frequência</span>
                                    <span className="font-medium capitalize">
                                        {frequency === 'daily' ? 'Diário' : frequency === 'weekly' ? 'Semanal' : 'Mensal'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Retenção</span>
                                    <span className="font-medium">{currentRetention} dias</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Criptografia</span>
                                    <span className="font-medium">{encrypted ? 'Sim' : 'Não'}</span>
                                </div>
                            </div>
                            <Separator />
                            <Button className="w-full h-12 text-lg font-semibold" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Enviando...' : 'Solicitar Backup'}
                            </Button>
                            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                                <Info className="h-3 w-3" />
                                Ativação em até 24 horas
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Componente de Configurador de Backup de VPS Completo
function BackupVpsConfigurator({ onSubmit, isSubmitting }: { onSubmit: (data: any) => void, isSubmitting?: boolean }) {
    // Buscar preços dinâmicos do backend
    const { data: pricingData } = usePricing('backup_vps');

    // Mapear preços da API
    const VPS_BACKUP_PRICES = useMemo(() => {
        if (!pricingData || pricingData.length === 0) return DEFAULT_VPS_BACKUP_PRICES;

        const priceMap = pricingData.reduce((acc, p) => {
            acc[p.resourceKey] = p.priceCents;
            return acc;
        }, {} as Record<string, number>);

        return {
            snapshotBase: priceMap['snapshot_base'] ?? DEFAULT_VPS_BACKUP_PRICES.snapshotBase,
            perGB: priceMap['per_gb'] ?? DEFAULT_VPS_BACKUP_PRICES.perGB,
            dailyMultiplier: (priceMap['daily_multiplier'] ?? DEFAULT_VPS_BACKUP_PRICES.dailyMultiplier) / 100,
            weeklyMultiplier: (priceMap['weekly_multiplier'] ?? DEFAULT_VPS_BACKUP_PRICES.weeklyMultiplier) / 100,
            monthlyMultiplier: (priceMap['monthly_multiplier'] ?? DEFAULT_VPS_BACKUP_PRICES.monthlyMultiplier) / 100,
            retentionPerDay: priceMap['retention_per_day'] ?? DEFAULT_VPS_BACKUP_PRICES.retentionPerDay,
            databaseAddon: priceMap['database_addon'] ?? DEFAULT_VPS_BACKUP_PRICES.databaseAddon,
        };
    }, [pricingData]);

    const [vmSizeGB, setVmSizeGB] = useState(50);
    const [frequency, setFrequency] = useState('daily');
    const [retention, setRetention] = useState(7);
    const [includeDatabase, setIncludeDatabase] = useState(true);
    const [notes, setNotes] = useState('');

    const vmSizeSteps = [25, 50, 100, 200, 500, 1000, 2000];
    const [vmSizeIndex, setVmSizeIndex] = useState(1);
    const currentVmSize = vmSizeSteps[vmSizeIndex];

    // Calcular preço (agora usando preços dinâmicos)
    const calculatePrice = () => {
        let total = VPS_BACKUP_PRICES.snapshotBase;
        total += currentVmSize * VPS_BACKUP_PRICES.perGB;
        if (frequency === 'daily') total *= VPS_BACKUP_PRICES.dailyMultiplier;
        else if (frequency === 'weekly') total *= VPS_BACKUP_PRICES.weeklyMultiplier;
        else total *= VPS_BACKUP_PRICES.monthlyMultiplier;
        total += retention * VPS_BACKUP_PRICES.retentionPerDay;
        if (includeDatabase) total += VPS_BACKUP_PRICES.databaseAddon;
        return Math.round(total);
    };

    const estimatedPrice = calculatePrice();

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
    };

    const handleSubmit = () => {
        onSubmit({
            type: 'backup-vps',
            vmSizeGB: currentVmSize,
            frequency,
            retentionDays: retention,
            includeDatabase,
            notes,
            estimatedPrice,
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card className="border-primary/20 bg-gradient-to-br from-purple-500/5 to-transparent">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-purple-500/10">
                                <Save className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Backup de VPS Completo</CardTitle>
                                <CardDescription>Snapshot completo de máquinas virtuais</CardDescription>
                            </div>
                        </div>
                        <Badge variant="outline" className="w-fit mt-2 bg-purple-500/10 text-purple-600 border-purple-500/30">
                            <Zap className="h-3 w-3 mr-1" />
                            RESTAURAÇÃO RÁPIDA
                        </Badge>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Server className="h-5 w-5 text-muted-foreground" />
                            Tamanho da VM
                        </CardTitle>
                        <CardDescription>Espaço total ocupado pela máquina virtual</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Disco da VM</span>
                            <span className="text-2xl font-bold">{currentVmSize} GB</span>
                        </div>
                        <Slider
                            value={[vmSizeIndex]}
                            onValueChange={([v]) => setVmSizeIndex(v)}
                            max={vmSizeSteps.length - 1}
                            step={1}
                            className="[&_[role=slider]]:bg-purple-600"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>25 GB</span>
                            <span>2 TB</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-muted-foreground" />
                            Frequência de Snapshot
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select value={frequency} onValueChange={setFrequency}>
                            <SelectTrigger className="w-full h-12">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-green-500" />
                                        <span>Diário (1.5x preço base)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="weekly">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-blue-500" />
                                        <span>Semanal (preço base)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="monthly">
                                    <div className="flex items-center gap-2">
                                        <Archive className="h-4 w-4 text-gray-500" />
                                        <span>Mensal (0.5x preço base)</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            Dias de Retenção
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Manter snapshots por</span>
                            <span className="text-2xl font-bold">{retention} dias</span>
                        </div>
                        <Slider
                            value={[retention]}
                            onValueChange={([v]) => setRetention(v)}
                            min={1}
                            max={90}
                            step={1}
                            className="[&_[role=slider]]:bg-purple-600"
                        />
                        <p className="text-xs text-muted-foreground">R$ 1,00 por dia de retenção</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Database className="h-5 w-5 text-purple-600" />
                                <div>
                                    <Label className="text-base">Incluir Databases</Label>
                                    <p className="text-sm text-muted-foreground">Backup consistente de MySQL/PostgreSQL (+R$ 20,00)</p>
                                </div>
                            </div>
                            <Switch checked={includeDatabase} onCheckedChange={setIncludeDatabase} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Observações</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Informe o IP ou hostname da VPS, horário preferencial para backup..."
                            rows={3}
                        />
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-1">
                <div className="sticky top-6">
                    <Card className="border-2 border-purple-500/20 shadow-lg">
                        <CardHeader className="pb-3 bg-gradient-to-br from-purple-500/5 to-transparent">
                            <CardTitle className="text-lg">Resumo do Backup</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center py-4">
                                <p className="text-4xl font-bold text-purple-600">{formatCurrency(estimatedPrice)}</p>
                                <p className="text-sm text-muted-foreground">/mês</p>
                            </div>
                            <Separator />
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tamanho VM</span>
                                    <span className="font-medium">{currentVmSize} GB</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Frequência</span>
                                    <span className="font-medium capitalize">
                                        {frequency === 'daily' ? 'Diário' : frequency === 'weekly' ? 'Semanal' : 'Mensal'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Retenção</span>
                                    <span className="font-medium">{retention} dias</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Databases</span>
                                    <span className="font-medium">{includeDatabase ? 'Incluído' : 'Não'}</span>
                                </div>
                            </div>
                            <Separator />
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-xs">
                                <p className="font-medium text-purple-700 dark:text-purple-300">Inclui:</p>
                                <ul className="mt-1 space-y-1 text-purple-600 dark:text-purple-400">
                                    <li>• Snapshot completo do sistema</li>
                                    <li>• Restauração com 1 clique</li>
                                    <li>• Compressão automática</li>
                                    <li>• Notificações de status</li>
                                </ul>
                            </div>
                            <Button className="w-full h-12 text-lg font-semibold bg-purple-600 hover:bg-purple-700" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Enviando...' : 'Solicitar Backup VPS'}
                            </Button>
                            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                                <Info className="h-3 w-3" />
                                Configuração em até 48 horas
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function ContractService() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const { data: accounts } = useMyAccounts();
    const currentAccount = accounts?.[0];
    const accountId = currentAccount?.id || 0;

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const createVpsOrder = useCreateVpsOrder(accountId);
    const createBackupOrder = useCreateBackupOrder(accountId);

    const handleVpsSubmit = async (config: VpsConfigData) => {
        try {
            const result = await createVpsOrder.mutateAsync(config);
            toast({
                title: 'Solicitação Enviada!',
                description: `Seu pedido #${result.order.orderNumber} foi criado com sucesso. Nossa equipe entrará em contato em breve.`,
            });
            setLocation('/dashboard/billing');
        } catch (error) {
            toast({
                title: 'Erro ao criar pedido',
                description: 'Não foi possível processar sua solicitação. Tente novamente.',
                variant: 'destructive',
            });
        }
    };

    const handleBackupSubmit = async (config: any) => {
        try {
            const result = await createBackupOrder.mutateAsync(config);
            toast({
                title: 'Solicitação Enviada!',
                description: `Seu pedido #${result.order.orderNumber} foi criado com sucesso. Nossa equipe entrará em contato em breve.`,
            });
            setLocation('/dashboard/billing');
        } catch (error) {
            toast({
                title: 'Erro ao criar pedido',
                description: 'Não foi possível processar sua solicitação. Tente novamente.',
                variant: 'destructive',
            });
        }
    };

    const handleBack = () => {
        if (selectedCategory) {
            setSelectedCategory(null);
        } else {
            setLocation('/dashboard/billing');
        }
    };

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 ml-72 p-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={handleBack}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <ShoppingCart className="h-6 w-6" />
                                {selectedCategory ? 'Configurar Serviço' : 'Contratar Serviço'}
                            </h1>
                            <p className="text-muted-foreground">
                                {selectedCategory
                                    ? 'Configure os recursos conforme sua necessidade'
                                    : 'Escolha o tipo de serviço que deseja contratar'}
                            </p>
                        </div>
                    </div>

                    {/* Seleção de Categoria */}
                    {!selectedCategory && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {productCategories.map((category) => (
                                <Card
                                    key={category.id}
                                    className={`relative cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 ${!category.available ? 'opacity-60' : ''
                                        }`}
                                    onClick={() => category.available && setSelectedCategory(category.id)}
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="p-3 rounded-xl bg-primary/10">
                                                <category.icon className="h-6 w-6 text-primary" />
                                            </div>
                                            <Badge className={category.badgeColor}>
                                                {category.badge}
                                            </Badge>
                                        </div>
                                        <CardTitle className="mt-4">{category.name}</CardTitle>
                                        <CardDescription>{category.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button
                                            className="w-full"
                                            variant={category.available ? 'default' : 'secondary'}
                                            disabled={!category.available}
                                        >
                                            {category.available ? 'Configurar' : 'Indisponível'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Configurador de VPS */}
                    {selectedCategory === 'vps' && (
                        <VpsConfigurator
                            onSubmit={handleVpsSubmit}
                            isSubmitting={createVpsOrder.isPending}
                        />
                    )}

                    {/* Configurador de Backup em Nuvem */}
                    {selectedCategory === 'backup-cloud' && (
                        <BackupCloudConfigurator
                            onSubmit={handleBackupSubmit}
                            isSubmitting={createBackupOrder.isPending}
                        />
                    )}

                    {/* Configurador de Backup de VPS */}
                    {selectedCategory === 'backup-vps' && (
                        <BackupVpsConfigurator
                            onSubmit={handleBackupSubmit}
                            isSubmitting={createBackupOrder.isPending}
                        />
                    )}

                    {/* Placeholder para outros tipos */}
                    {selectedCategory && !['vps', 'backup-cloud', 'backup-vps'].includes(selectedCategory) && (
                        <Card className="p-12 text-center">
                            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Em Desenvolvimento</h3>
                            <p className="text-muted-foreground mb-4">
                                Este serviço estará disponível em breve.
                            </p>
                            <Button variant="outline" onClick={() => setSelectedCategory(null)}>
                                Voltar para Catálogo
                            </Button>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
