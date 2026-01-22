import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAdminPricing, useUpdatePricing, useSeedPricing, usePricingHistory } from '@/hooks/use-pricing';
import { useToast } from '@/hooks/use-toast';
import {
    DollarSign,
    Edit,
    History,
    Loader2,
    RefreshCw,
    Server,
    Cloud,
    Save,
    Database,
    CheckCircle,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import type { PricingConfig } from '@shared/schema';

const categoryLabels: Record<string, { label: string; icon: any; color: string }> = {
    vps: { label: 'Servidor VPS', icon: Server, color: 'text-blue-600' },
    backup_cloud: { label: 'Backup em Nuvem', icon: Cloud, color: 'text-cyan-600' },
    backup_vps: { label: 'Backup de VPS', icon: Save, color: 'text-purple-600' },
    storage: { label: 'Object Storage', icon: Database, color: 'text-green-600' },
};

const unitLabels: Record<string, string> = {
    core: '/core',
    gb: '/GB',
    mbps: '/Mbps',
    day: '/dia',
    unit: '/unid',
    percent: '%',
};

function formatCurrency(cents: number) {
    if (cents < 100) {
        return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

export function PricingManager() {
    const [selectedCategory, setSelectedCategory] = useState<string>('vps');
    const [editingConfig, setEditingConfig] = useState<PricingConfig | null>(null);
    const [editPrice, setEditPrice] = useState('');
    const [editReason, setEditReason] = useState('');
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);

    const { data: pricing, isLoading, refetch } = useAdminPricing();
    const updatePricing = useUpdatePricing();
    const seedPricing = useSeedPricing();
    const { data: history } = usePricingHistory(selectedConfigId || undefined);
    const { toast } = useToast();

    const filteredPricing = pricing?.filter(p => p.category === selectedCategory) || [];
    const categories = Array.from(new Set(pricing?.map(p => p.category) || []));

    const handleEdit = (config: PricingConfig) => {
        setEditingConfig(config);
        setEditPrice((config.priceCents / 100).toFixed(2));
        setEditReason('');
    };

    const handleSaveEdit = async () => {
        if (!editingConfig) return;

        const newPriceCents = Math.round(parseFloat(editPrice.replace(',', '.')) * 100);
        if (isNaN(newPriceCents) || newPriceCents < 0) {
            toast({ title: 'Erro', description: 'Preço inválido', variant: 'destructive' });
            return;
        }

        try {
            await updatePricing.mutateAsync({
                id: editingConfig.id,
                data: { priceCents: newPriceCents, changeReason: editReason },
            });
            toast({ title: 'Sucesso', description: 'Preço atualizado com sucesso' });
            setEditingConfig(null);
        } catch (error) {
            toast({ title: 'Erro', description: 'Falha ao atualizar preço', variant: 'destructive' });
        }
    };

    const handleViewHistory = (configId: number) => {
        setSelectedConfigId(configId);
        setHistoryDialogOpen(true);
    };

    const handleSeed = async () => {
        try {
            await seedPricing.mutateAsync();
            toast({ title: 'Sucesso', description: 'Preços iniciais configurados' });
            refetch();
        } catch (error) {
            toast({ title: 'Erro', description: 'Falha ao configurar preços', variant: 'destructive' });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <DollarSign className="h-6 w-6" />
                        Gerenciamento de Preços
                    </h2>
                    <p className="text-muted-foreground">Configure os preços de cada recurso da plataforma</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar
                    </Button>
                    {pricing?.length === 0 && (
                        <Button onClick={handleSeed} disabled={seedPricing.isPending}>
                            {seedPricing.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            Configurar Preços Iniciais
                        </Button>
                    )}
                </div>
            </div>

            {pricing && pricing.length > 0 ? (
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                    <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4">
                        {categories.map(cat => {
                            const catInfo = categoryLabels[cat] || { label: cat, icon: Database, color: 'text-gray-600' };
                            const Icon = catInfo.icon;
                            return (
                                <TabsTrigger key={cat} value={cat} className="flex items-center gap-2">
                                    <Icon className={`h-4 w-4 ${catInfo.color}`} />
                                    <span className="hidden sm:inline">{catInfo.label}</span>
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>

                    {categories.map(cat => (
                        <TabsContent key={cat} value={cat}>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        {(() => {
                                            const catInfo = categoryLabels[cat];
                                            if (catInfo?.icon) {
                                                const IconComp = catInfo.icon;
                                                return <IconComp className={`h-5 w-5 ${catInfo.color}`} />;
                                            }
                                            return null;
                                        })()}
                                        Preços de {categoryLabels[cat]?.label || cat}
                                    </CardTitle>
                                    <CardDescription>
                                        Clique em "Editar" para alterar o preço de cada recurso
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Recurso</TableHead>
                                                <TableHead>Descrição</TableHead>
                                                <TableHead className="text-right">Preço</TableHead>
                                                <TableHead className="text-center">Unidade</TableHead>
                                                <TableHead className="text-right">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredPricing.map(config => (
                                                <TableRow key={config.id}>
                                                    <TableCell className="font-medium">{config.resourceLabel}</TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">
                                                        {config.description || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono">
                                                        {config.unit === 'percent' ? (
                                                            <Badge variant="secondary">{config.priceCents}%</Badge>
                                                        ) : (
                                                            <span className="text-lg font-bold">{formatCurrency(config.priceCents)}</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline">{unitLabels[config.unit] || config.unit}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(config)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => handleViewHistory(config.id)}>
                                                                <History className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    ))}
                </Tabs>
            ) : (
                <Card className="p-12 text-center">
                    <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Nenhum Preço Configurado</h3>
                    <p className="text-muted-foreground mb-4">
                        Clique no botão acima para configurar os preços iniciais da plataforma.
                    </p>
                </Card>
            )}

            {/* Edit Dialog */}
            <Dialog open={!!editingConfig} onOpenChange={(open) => !open && setEditingConfig(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Preço</DialogTitle>
                        <DialogDescription>
                            Altere o preço de "{editingConfig?.resourceLabel}"
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <Label>Preço Atual</Label>
                                <div className="text-2xl font-bold text-muted-foreground">
                                    {editingConfig?.unit === 'percent'
                                        ? `${editingConfig?.priceCents}%`
                                        : formatCurrency(editingConfig?.priceCents || 0)}
                                </div>
                            </div>
                            <ArrowUp className="h-6 w-6 text-muted-foreground" />
                            <div className="flex-1">
                                <Label>Novo Preço</Label>
                                <div className="flex items-center gap-2">
                                    {editingConfig?.unit !== 'percent' && <span className="text-lg">R$</span>}
                                    <Input
                                        type="text"
                                        value={editPrice}
                                        onChange={(e) => setEditPrice(e.target.value)}
                                        className="text-lg font-bold"
                                    />
                                    {editingConfig?.unit === 'percent' && <span className="text-lg">%</span>}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Motivo da Alteração</Label>
                            <Textarea
                                value={editReason}
                                onChange={(e) => setEditReason(e.target.value)}
                                placeholder="Ex: Ajuste de custos operacionais, promoção sazonal..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingConfig(null)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={updatePricing.isPending}>
                            {updatePricing.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                            Salvar Alteração
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* History Dialog */}
            <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Histórico de Alterações
                        </DialogTitle>
                    </DialogHeader>
                    <div className="max-h-96 overflow-y-auto">
                        {history && history.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Preço Anterior</TableHead>
                                        <TableHead>Novo Preço</TableHead>
                                        <TableHead>Motivo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((h: any) => (
                                        <TableRow key={h.id}>
                                            <TableCell>{new Date(h.createdAt).toLocaleString('pt-BR')}</TableCell>
                                            <TableCell className="font-mono">{formatCurrency(h.oldPriceCents)}</TableCell>
                                            <TableCell className="font-mono">
                                                <span className={h.newPriceCents > h.oldPriceCents ? 'text-red-600' : 'text-green-600'}>
                                                    {formatCurrency(h.newPriceCents)}
                                                    {h.newPriceCents > h.oldPriceCents ? <ArrowUp className="inline h-3 w-3 ml-1" /> : <ArrowDown className="inline h-3 w-3 ml-1" />}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{h.changeReason || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                Nenhum histórico de alteração encontrado.
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
