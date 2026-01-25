import { useState } from 'react';
import { useAdminBuckets, AdminBucket } from '@/hooks/use-admin-buckets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Database, Search, RefreshCw, TrendingUp, HardDrive, DollarSign, Building2 } from 'lucide-react';

export function BucketsManager() {
    const { data: buckets, isLoading, error, refetch, isRefetching } = useAdminBuckets();
    const [searchTerm, setSearchTerm] = useState('');

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
    };

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('pt-BR');
    };

    const filteredBuckets = buckets?.filter(bucket =>
        bucket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bucket.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bucket.region?.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

    // Calculate summary stats
    const totalBuckets = buckets?.length || 0;
    const totalStorageBytes = buckets?.reduce((sum, b) => sum + b.sizeBytes, 0) || 0;
    const totalEstimatedCost = buckets?.reduce((sum, b) => sum + b.estimatedCostCents, 0) || 0;
    const totalObjects = buckets?.reduce((sum, b) => sum + (b.objectCount || 0), 0) || 0;

    if (error) {
        return (
            <Card className="border-red-200 bg-red-50/30">
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 text-red-600">
                        <Database className="h-5 w-5" />
                        <p>{error instanceof Error ? error.message : 'Erro ao carregar buckets'}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Database className="h-6 w-6 text-primary" />
                        Visão Geral de Storage
                    </h2>
                    <p className="text-muted-foreground">Visualize todos os buckets criados na plataforma</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => refetch()}
                    disabled={isRefetching}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Database className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Buckets</p>
                                <p className="text-2xl font-bold">{totalBuckets}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <HardDrive className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Armazenamento Total</p>
                                <p className="text-2xl font-bold">{formatBytes(totalStorageBytes)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                                <TrendingUp className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Objetos</p>
                                <p className="text-2xl font-bold">{totalObjects.toLocaleString('pt-BR')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-green-200 bg-green-50/30 dark:bg-green-950/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <DollarSign className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Receita Est. (Mensal)</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalEstimatedCost)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Table */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Todos os Buckets ({filteredBuckets.length})</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar bucket ou conta..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredBuckets.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Database className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p>{searchTerm ? 'Nenhum bucket encontrado para esta busca.' : 'Nenhum bucket criado na plataforma ainda.'}</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="pl-6">Bucket</TableHead>
                                    <TableHead>Conta (Tenant)</TableHead>
                                    <TableHead>Região</TableHead>
                                    <TableHead className="text-right">Objetos</TableHead>
                                    <TableHead className="text-right">Tamanho</TableHead>
                                    <TableHead className="text-right">Custo Est./Mês</TableHead>
                                    <TableHead>Criado em</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredBuckets.map((bucket) => (
                                    <TableRow key={bucket.id} className="hover:bg-muted/30">
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Database className="h-4 w-4 text-primary" />
                                                </div>
                                                <span className="font-medium font-mono text-sm">{bucket.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <span className="font-medium">{bucket.accountName}</span>
                                                    {bucket.accountStatus && bucket.accountStatus !== 'active' && (
                                                        <Badge variant="outline" className="ml-2 text-xs">
                                                            {bucket.accountStatus}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-mono text-xs">
                                                {bucket.region || 'us-east-1'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {(bucket.objectCount || 0).toLocaleString('pt-BR')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-medium">{formatBytes(bucket.sizeBytes)}</span>
                                            {bucket.storageLimitGB && (
                                                <span className="text-xs text-muted-foreground ml-1">
                                                    / {bucket.storageLimitGB} GB
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className={`font-semibold ${bucket.estimatedCostCents > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                                                {formatCurrency(bucket.estimatedCostCents)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatDate(bucket.createdAt)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
