import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { usePricing } from '@/hooks/use-pricing';
import {
    Server,
    Cpu,
    MemoryStick,
    HardDrive,
    Globe,
    Network,
    Shield,
    Clock,
    MapPin,
    Minus,
    Plus,
    Zap,
    Info,
    Loader2
} from 'lucide-react';

// Opções de Sistema Operacional
const osOptions = [
    { value: 'ubuntu-22.04', label: 'Ubuntu 22.04 LTS', icon: '🐧' },
    { value: 'ubuntu-20.04', label: 'Ubuntu 20.04 LTS', icon: '🐧' },
    { value: 'debian-12', label: 'Debian 12', icon: '🐧' },
    { value: 'centos-8', label: 'CentOS 8 Stream', icon: '🐧' },
    { value: 'rocky-9', label: 'Rocky Linux 9', icon: '🐧' },
    { value: 'windows-2022', label: 'Windows Server 2022', icon: '🪟' },
    { value: 'windows-2019', label: 'Windows Server 2019', icon: '🪟' },
];

// Opções de Localização
const locationOptions = [
    { value: 'sp', label: 'São Paulo', country: 'BR', flag: '🇧🇷', latency: '~5ms' },
    { value: 'rj', label: 'Rio de Janeiro', country: 'BR', flag: '🇧🇷', latency: '~8ms' },
    { value: 'ny', label: 'New York', country: 'US', flag: '🇺🇸', latency: '~120ms' },
    { value: 'mia', label: 'Miami', country: 'US', flag: '🇺🇸', latency: '~100ms' },
    { value: 'fra', label: 'Frankfurt', country: 'DE', flag: '🇩🇪', latency: '~180ms' },
];

// Configurações de recursos
const cpuSteps = [1, 2, 4, 6, 8, 12, 16, 24, 32];
const ramSteps = [1, 2, 4, 8, 16, 32, 64, 128];
const storageSteps = [25, 50, 100, 200, 400, 800, 1000, 2000];
const bandwidthSteps = [50, 100, 200, 500, 1000];

// Preços padrão (fallback caso a API não retorne)
const DEFAULT_PRICES = {
    cpuPerCore: 1500, // R$ 15,00 por core
    ramPerGB: 800, // R$ 8,00 por GB
    storagePerGB: 15, // R$ 0,15 por GB
    bandwidthPerMbps: 20, // R$ 0,20 por Mbps
    publicIP: 1500, // R$ 15,00 por IP
    backup: 2000, // R$ 20,00 base + % do storage
    internalNetwork: 500, // R$ 5,00 por rede
};

interface VpsConfiguratorProps {
    onSubmit?: (config: VpsConfigData) => void;
    isSubmitting?: boolean;
}

export interface VpsConfigData {
    os: string;
    location: string;
    cpuCores: number;
    ramGB: number;
    storageGB: number;
    bandwidth: number;
    hasPublicIP: boolean;
    publicIPCount: number;
    hasBackup: boolean;
    backupFrequency: string;
    internalNetworks: number;
    notes: string;
    estimatedPrice: number;
}

export function VpsConfigurator({ onSubmit, isSubmitting }: VpsConfiguratorProps) {
    // Buscar preços dinâmicos do backend
    const { data: pricingData, isLoading: pricingLoading } = usePricing('vps');

    // Mapear preços da API para o formato usado no componente
    const PRICES = useMemo(() => {
        if (!pricingData || pricingData.length === 0) return DEFAULT_PRICES;

        const priceMap = pricingData.reduce((acc, p) => {
            acc[p.resourceKey] = p.priceCents;
            return acc;
        }, {} as Record<string, number>);

        return {
            cpuPerCore: priceMap['cpu_per_core'] ?? DEFAULT_PRICES.cpuPerCore,
            ramPerGB: priceMap['ram_per_gb'] ?? DEFAULT_PRICES.ramPerGB,
            storagePerGB: priceMap['storage_per_gb'] ?? DEFAULT_PRICES.storagePerGB,
            bandwidthPerMbps: priceMap['bandwidth_per_mbps'] ?? DEFAULT_PRICES.bandwidthPerMbps,
            publicIP: priceMap['public_ip'] ?? DEFAULT_PRICES.publicIP,
            backup: priceMap['backup_base'] ?? DEFAULT_PRICES.backup,
            internalNetwork: priceMap['internal_network'] ?? DEFAULT_PRICES.internalNetwork,
        };
    }, [pricingData]);

    // Estados do configurador
    const [os, setOs] = useState('ubuntu-22.04');
    const [location, setLocation] = useState('sp');
    const [cpuIndex, setCpuIndex] = useState(0);
    const [ramIndex, setRamIndex] = useState(0);
    const [storageIndex, setStorageIndex] = useState(0);
    const [bandwidthIndex, setBandwidthIndex] = useState(0);
    const [hasPublicIP, setHasPublicIP] = useState(false);
    const [publicIPCount, setPublicIPCount] = useState(1);
    const [hasBackup, setHasBackup] = useState(false);
    const [backupFrequency, setBackupFrequency] = useState('daily');
    const [internalNetworks, setInternalNetworks] = useState(0);
    const [notes, setNotes] = useState('');

    // Valores atuais
    const cpuCores = cpuSteps[cpuIndex];
    const ramGB = ramSteps[ramIndex];
    const storageGB = storageSteps[storageIndex];
    const bandwidth = bandwidthSteps[bandwidthIndex];

    // Cálculo de preço estimado (agora usando preços dinâmicos)
    const estimatedPrice = useMemo(() => {
        let total = 0;
        total += cpuCores * PRICES.cpuPerCore;
        total += ramGB * PRICES.ramPerGB;
        total += storageGB * PRICES.storagePerGB;
        total += bandwidth * PRICES.bandwidthPerMbps;
        if (hasPublicIP) total += publicIPCount * PRICES.publicIP;
        if (hasBackup) total += PRICES.backup + (storageGB * PRICES.storagePerGB * 0.1);
        total += internalNetworks * PRICES.internalNetwork;
        return total;
    }, [cpuCores, ramGB, storageGB, bandwidth, hasPublicIP, publicIPCount, hasBackup, internalNetworks, PRICES]);

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
    };

    const handleSubmit = () => {
        const config: VpsConfigData = {
            os,
            location,
            cpuCores,
            ramGB,
            storageGB,
            bandwidth,
            hasPublicIP,
            publicIPCount: hasPublicIP ? publicIPCount : 0,
            hasBackup,
            backupFrequency: hasBackup ? backupFrequency : '',
            internalNetworks,
            notes,
            estimatedPrice,
        };
        onSubmit?.(config);
    };

    const selectedOs = osOptions.find(o => o.value === os);
    const selectedLocation = locationOptions.find(l => l.value === location);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configurador Principal */}
            <div className="lg:col-span-2 space-y-6">
                {/* Header */}
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-primary/10">
                                <Server className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Configurar VPS</CardTitle>
                                <CardDescription>
                                    Monte sua máquina virtual sob demanda
                                </CardDescription>
                            </div>
                        </div>
                        <Badge variant="outline" className="w-fit mt-2 bg-blue-500/10 text-blue-600 border-blue-500/30">
                            <Zap className="h-3 w-3 mr-1" />
                            TRÁFEGO ILIMITADO
                        </Badge>
                    </CardHeader>
                </Card>

                {/* Sistema Operacional */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Cpu className="h-5 w-5 text-muted-foreground" />
                            Modelo (Sistema Operacional)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select value={os} onValueChange={setOs}>
                            <SelectTrigger className="w-full h-12">
                                <SelectValue>
                                    <div className="flex items-center gap-2">
                                        <span>{selectedOs?.icon}</span>
                                        <span>{selectedOs?.label}</span>
                                    </div>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {osOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        <div className="flex items-center gap-2">
                                            <span>{option.icon}</span>
                                            <span>{option.label}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {/* Localização */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            Localização
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select value={location} onValueChange={setLocation}>
                            <SelectTrigger className="w-full h-12">
                                <SelectValue>
                                    <div className="flex items-center gap-2">
                                        <span>{selectedLocation?.flag}</span>
                                        <span>{selectedLocation?.label}</span>
                                        <Badge variant="secondary" className="ml-2 text-xs">
                                            {selectedLocation?.latency}
                                        </Badge>
                                    </div>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {locationOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        <div className="flex items-center gap-2">
                                            <span>{option.flag}</span>
                                            <span>{option.label}</span>
                                            <Badge variant="secondary" className="ml-2 text-xs">
                                                {option.latency}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {/* Recursos de Hardware */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Recursos</CardTitle>
                        <CardDescription>Ajuste os recursos conforme sua necessidade</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {/* CPU */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2 text-base">
                                    <Cpu className="h-4 w-4" />
                                    CPU
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setCpuIndex(Math.max(0, cpuIndex - 1))}
                                        disabled={cpuIndex === 0}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-20 text-center font-semibold text-lg">
                                        {cpuCores} Core{cpuCores > 1 ? 's' : ''}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setCpuIndex(Math.min(cpuSteps.length - 1, cpuIndex + 1))}
                                        disabled={cpuIndex === cpuSteps.length - 1}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            <Slider
                                value={[cpuIndex]}
                                onValueChange={([v]) => setCpuIndex(v)}
                                max={cpuSteps.length - 1}
                                step={1}
                                className="[&_[role=slider]]:bg-primary"
                            />
                        </div>

                        <Separator />

                        {/* RAM */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2 text-base">
                                    <MemoryStick className="h-4 w-4" />
                                    RAM
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setRamIndex(Math.max(0, ramIndex - 1))}
                                        disabled={ramIndex === 0}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-20 text-center font-semibold text-lg">
                                        {ramGB} GB
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setRamIndex(Math.min(ramSteps.length - 1, ramIndex + 1))}
                                        disabled={ramIndex === ramSteps.length - 1}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            <Slider
                                value={[ramIndex]}
                                onValueChange={([v]) => setRamIndex(v)}
                                max={ramSteps.length - 1}
                                step={1}
                                className="[&_[role=slider]]:bg-primary"
                            />
                        </div>

                        <Separator />

                        {/* Largura de Banda */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2 text-base">
                                    <Network className="h-4 w-4" />
                                    Largura de banda
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setBandwidthIndex(Math.max(0, bandwidthIndex - 1))}
                                        disabled={bandwidthIndex === 0}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-24 text-center font-semibold text-lg">
                                        {bandwidth} Mbps
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setBandwidthIndex(Math.min(bandwidthSteps.length - 1, bandwidthIndex + 1))}
                                        disabled={bandwidthIndex === bandwidthSteps.length - 1}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            <Slider
                                value={[bandwidthIndex]}
                                onValueChange={([v]) => setBandwidthIndex(v)}
                                max={bandwidthSteps.length - 1}
                                step={1}
                                className="[&_[role=slider]]:bg-primary"
                            />
                        </div>

                        <Separator />

                        {/* SSD Storage */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2 text-base">
                                    <HardDrive className="h-4 w-4" />
                                    SSD
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setStorageIndex(Math.max(0, storageIndex - 1))}
                                        disabled={storageIndex === 0}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-24 text-center font-semibold text-lg">
                                        {storageGB} GB
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setStorageIndex(Math.min(storageSteps.length - 1, storageIndex + 1))}
                                        disabled={storageIndex === storageSteps.length - 1}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            <Slider
                                value={[storageIndex]}
                                onValueChange={([v]) => setStorageIndex(v)}
                                max={storageSteps.length - 1}
                                step={1}
                                className="[&_[role=slider]]:bg-primary"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Recursos Adicionais */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Recursos Adicionais</CardTitle>
                        <CardDescription>Opcionais para sua infraestrutura</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* IP Público */}
                        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                            <div className="flex items-center gap-3">
                                <Globe className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <Label className="text-base">IP Público</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Acesse sua VPS de qualquer lugar
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {hasPublicIP && (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => setPublicIPCount(Math.max(1, publicIPCount - 1))}
                                            disabled={publicIPCount <= 1}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-8 text-center">{publicIPCount}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => setPublicIPCount(Math.min(5, publicIPCount + 1))}
                                            disabled={publicIPCount >= 5}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                                <Switch
                                    checked={hasPublicIP}
                                    onCheckedChange={setHasPublicIP}
                                />
                            </div>
                        </div>

                        {/* Redes Internas */}
                        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                            <div className="flex items-center gap-3">
                                <Network className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <Label className="text-base">Redes Internas</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Conecte com outras VPS na mesma rede
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setInternalNetworks(Math.max(0, internalNetworks - 1))}
                                    disabled={internalNetworks === 0}
                                >
                                    <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center font-medium">{internalNetworks}</span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setInternalNetworks(Math.min(10, internalNetworks + 1))}
                                    disabled={internalNetworks >= 10}
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        {/* Backup */}
                        <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Shield className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <Label className="text-base">Backup Automático</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Proteção contra perda de dados
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={hasBackup}
                                    onCheckedChange={setHasBackup}
                                />
                            </div>
                            {hasBackup && (
                                <div className="pt-2">
                                    <Label className="text-sm text-muted-foreground mb-2 block">
                                        Frequência do Backup
                                    </Label>
                                    <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                                        <SelectTrigger className="w-48">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">Diário</SelectItem>
                                            <SelectItem value="weekly">Semanal</SelectItem>
                                            <SelectItem value="monthly">Mensal</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Observações */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Observações</CardTitle>
                        <CardDescription>Informações adicionais para sua solicitação</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Descreva qualquer requisito especial, software que precisa ser pré-instalado, etc..."
                            rows={4}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Resumo Lateral (Sticky) */}
            <div className="lg:col-span-1">
                <div className="sticky top-6 space-y-4">
                    <Card className="border-2 border-primary/20 shadow-lg">
                        <CardHeader className="pb-3 bg-gradient-to-br from-primary/5 to-transparent">
                            <CardTitle className="text-lg">Resumo da Configuração</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Preço */}
                            <div className="text-center py-4">
                                <p className="text-4xl font-bold text-primary">
                                    {formatCurrency(estimatedPrice)}
                                </p>
                                <p className="text-sm text-muted-foreground">/mês</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {formatCurrency(Math.round(estimatedPrice / 30 / 24))}/hora
                                </p>
                            </div>

                            <Separator />

                            {/* Detalhes */}
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Sistema</span>
                                    <span className="font-medium">{selectedOs?.label}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Localização</span>
                                    <span className="font-medium">{selectedLocation?.flag} {selectedLocation?.label}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">CPU</span>
                                    <span className="font-medium">{cpuCores} Core{cpuCores > 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">RAM</span>
                                    <span className="font-medium">{ramGB} GB</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Banda</span>
                                    <span className="font-medium">{bandwidth} Mbps</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">SSD</span>
                                    <span className="font-medium">{storageGB} GB</span>
                                </div>
                                {hasPublicIP && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">IP Público</span>
                                        <span className="font-medium">{publicIPCount}x</span>
                                    </div>
                                )}
                                {internalNetworks > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Redes Internas</span>
                                        <span className="font-medium">{internalNetworks}x</span>
                                    </div>
                                )}
                                {hasBackup && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Backup</span>
                                        <span className="font-medium capitalize">{backupFrequency === 'daily' ? 'Diário' : backupFrequency === 'weekly' ? 'Semanal' : 'Mensal'}</span>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            {/* Bônus */}
                            <div className="space-y-2 text-xs">
                                <p className="text-muted-foreground">Receba R$ de bônus por cada pagamento</p>
                                <div className="space-y-1">
                                    <p>a partir de R$ 500 <span className="text-green-600 font-medium">+3% de R$ bônus</span></p>
                                    <p>a partir de R$ 1000 <span className="text-green-600 font-medium">+5% de R$ bônus</span></p>
                                    <p>a partir de R$ 5000 <span className="text-green-600 font-medium">+10% de R$ bônus</span></p>
                                </div>
                            </div>

                            <Separator />

                            {/* SLA */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Prazo de entrega: até 5 dias úteis após aprovação</span>
                            </div>

                            <Button
                                className="w-full h-12 text-lg font-semibold"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Enviando...' : 'Solicitar Orçamento'}
                            </Button>

                            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                                <Info className="h-3 w-3" />
                                O orçamento será analisado pela equipe
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default VpsConfigurator;
