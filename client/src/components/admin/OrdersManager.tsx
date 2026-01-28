import { useState } from 'react';
import { useAdminOrders, useAdminUpdateOrder, useAdminDenyOrder, useAdminDeleteOrder } from '@/hooks/use-orders';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ShoppingCart, Eye, CheckCircle, XCircle, FileText, Server, Cloud, Database, Trash2 } from 'lucide-react';
import { OrderWithDetails } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export function OrdersManager() {
    const { data: orders, isLoading, refetch } = useAdminOrders();
    const updateOrder = useAdminUpdateOrder();
    const denyOrder = useAdminDenyOrder();
    const deleteOrder = useAdminDeleteOrder();
    const { toast } = useToast();

    const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
    const [responseNote, setResponseNote] = useState('');

    const pendingOrders = orders?.filter(o => {
        const status = o.status || '';
        return ['pending', 'quoting'].includes(status);
    }) || [];

    const formatCurrency = (cents: number | null | undefined) => {
        if (cents === null || cents === undefined) return '-';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
    };

    const getStatusBadge = (status: string | null) => {
        const s = status || 'unknown';
        switch (s) {
            case 'pending':
            case 'quoting':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
            case 'processing':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Processando</Badge>;
            case 'completed':
                return <Badge variant="default" className="bg-green-100 text-green-800">Concluído</Badge>;
            case 'canceled':
                return <Badge variant="destructive">Cancelado</Badge>;
            case 'denied':
                return <Badge variant="destructive" className="bg-red-100 text-red-800">Recusado</Badge>;
            default:
                return <Badge variant="outline">{s}</Badge>;
        }
    };

    const getOrderTypeIcon = (type: string | null) => {
        const t = type || '';
        if (t === 'vps') return <Server className="h-4 w-4" />;
        if (t === 'backup-cloud') return <Cloud className="h-4 w-4" />;
        if (t === 'backup-vps') return <Database className="h-4 w-4" />;
        return <ShoppingCart className="h-4 w-4" />;
    };

    const getTypeLabel = (type: string | null) => {
        const t = type || '';
        if (t === 'vps') return 'VPS';
        if (t === 'backup-cloud') return 'Backup Cloud';
        if (t === 'backup-vps') return 'Backup VPS';
        return t || 'Desconhecido';
    };

    const formatDate = (date: Date | string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString();
    };

    const formatDateTime = (date: Date | string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleString();
    };

    const tryParseJson = (str: string | null) => {
        if (!str) return 'Sem detalhes.';
        try {
            const parsed = JSON.parse(str);
            return JSON.stringify(parsed, null, 2);
        } catch (e) {
            return str;
        }
    };

    const handleDeny = async () => {
        if (!selectedOrder) return;
        if (!confirm('Tem certeza que deseja recusar este pedido?')) return;

        try {
            await denyOrder.mutateAsync({
                orderId: selectedOrder.id,
                reason: responseNote || 'Pedido recusado pelo administrador'
            });
            toast({ title: "Pedido recusado", description: "O pedido foi marcado como recusado." });
            setSelectedOrder(null);
        } catch (error) {
            toast({ title: "Erro", description: "Falha ao recusar pedido.", variant: "destructive" });
        }
    };

    const handleDelete = async (orderId: number) => {
        if (!confirm('Tem certeza que deseja EXCLUIR este pedido permanentemente? Esta ação não pode ser desfeita.')) return;

        try {
            await deleteOrder.mutateAsync(orderId);
            toast({ title: "Pedido excluído", description: "O pedido foi removido permanentemente." });
            if (selectedOrder?.id === orderId) setSelectedOrder(null);
        } catch (error) {
            toast({ title: "Erro", description: "Falha ao excluir pedido.", variant: "destructive" });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <ShoppingCart className="h-6 w-6" />
                        Gerenciamento de Pedidos
                    </h2>
                    <p className="text-muted-foreground">Visualize e processe solicitações de contratação</p>
                </div>
                <Button variant="outline" onClick={() => refetch()}>Atualizar</Button>
            </div>

            <Card className="border-yellow-200 bg-yellow-50/20">
                <CardHeader>
                    <CardTitle className="text-lg">Solicitações Pendentes ({pendingOrders.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {pendingOrders.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">Nenhuma solicitação pendente.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Pedido</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Valor Est.</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingOrders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">{order.orderNumber || '-'}</TableCell>
                                        <TableCell>{order.account?.name || 'Conta #' + order.accountId}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getOrderTypeIcon(order.orderType)}
                                                {getTypeLabel(order.orderType)}
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Detalhes
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(order.id);
                                                    }}
                                                    disabled={deleteOrder.isPending}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Pedido #{selectedOrder?.orderNumber}</DialogTitle>
                        <DialogDescription>
                            Solicitação de {getTypeLabel(selectedOrder?.orderType || null)} feita em {formatDateTime(selectedOrder?.createdAt || null)}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Cliente</h4>
                                <p className="font-medium">{selectedOrder?.account?.name}</p>
                                <p className="text-sm text-muted-foreground">{selectedOrder?.account?.document || 'Sem documento'}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Valor Estimado</h4>
                                <p className="text-xl font-bold text-green-600">
                                    {formatCurrency(selectedOrder?.totalAmount)}
                                </p>
                            </div>
                        </div>

                        <div className="bg-muted/50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Configuração Solicitada
                            </h4>
                            <pre className="text-xs bg-background p-3 rounded border overflow-auto max-h-60 whitespace-pre-wrap break-all">
                                {selectedOrder?.orderType === 'vps' && (selectedOrder as any).vpsConfig ? (
                                    JSON.stringify((selectedOrder as any).vpsConfig, null, 2)
                                ) : (
                                    tryParseJson(selectedOrder?.notes || null)
                                )}
                            </pre>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium mb-2">Ações de Resposta</h4>
                            <Textarea
                                placeholder="Adicione uma nota ou resposta para o cliente..."
                                value={responseNote}
                                onChange={e => setResponseNote(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
                        <Button
                            variant="destructive"
                            onClick={handleDeny}
                            disabled={denyOrder.isPending}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Recusar Pedido
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setSelectedOrder(null)}>Fechar</Button>
                            <Button
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                    if (selectedOrder && selectedOrder.accountId) {
                                        updateOrder.mutate({
                                            accountId: selectedOrder.accountId,
                                            orderId: selectedOrder.id,
                                            status: 'processing',
                                            notes: responseNote || undefined
                                        });
                                        setSelectedOrder(null);
                                    }
                                }}
                                disabled={updateOrder.isPending}
                            >
                                {updateOrder.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                Aprovar e Gerar Fatura
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
