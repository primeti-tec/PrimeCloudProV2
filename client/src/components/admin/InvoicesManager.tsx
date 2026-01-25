import { useState } from 'react';
import { useAdminInvoices, useGenerateMonthlyInvoices, useMarkInvoicePaid, InvoiceWithAccount } from '@/hooks/use-admin-invoices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
    Loader2,
    FileText,
    Search,
    RefreshCw,
    DollarSign,
    CheckCircle,
    Clock,
    AlertTriangle,
    Calendar,
    Building2,
    Zap
} from 'lucide-react';

export function InvoicesManager() {
    const { data: invoices, isLoading, error, refetch, isRefetching } = useAdminInvoices();
    const generateInvoices = useGenerateMonthlyInvoices();
    const markPaid = useMarkInvoicePaid();
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [paymentDialog, setPaymentDialog] = useState<InvoiceWithAccount | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('pix');

    const formatCurrency = (cents: number | null | undefined) => {
        if (cents === null || cents === undefined) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
    };

    const formatDate = (date: string | Date | null | undefined) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('pt-BR');
    };

    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"><CheckCircle className="h-3 w-3 mr-1" />Pago</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
            case 'overdue':
                return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"><AlertTriangle className="h-3 w-3 mr-1" />Atrasado</Badge>;
            case 'canceled':
                return <Badge variant="secondary">Cancelado</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const filteredInvoices = invoices?.filter(invoice => {
        const matchesSearch =
            invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.account?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

        return matchesSearch && matchesStatus;
    }) || [];

    // Summary stats
    const totalPending = invoices?.filter(i => i.status === 'pending').reduce((sum, i) => sum + (i.totalAmount || 0), 0) || 0;
    const totalPaid = invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.totalAmount || 0), 0) || 0;
    const totalOverdue = invoices?.filter(i => i.status === 'overdue').reduce((sum, i) => sum + (i.totalAmount || 0), 0) || 0;
    const pendingCount = invoices?.filter(i => i.status === 'pending').length || 0;

    const handleGenerateInvoices = async () => {
        try {
            const result = await generateInvoices.mutateAsync();
            toast({
                title: "Faturas Geradas",
                description: `${result.generated} faturas criadas com sucesso.${result.errors?.length ? ` ${result.errors.length} erros.` : ''}`,
            });
        } catch (err: any) {
            toast({
                title: "Erro",
                description: err.message,
                variant: "destructive",
            });
        }
    };

    const handleMarkPaid = async () => {
        if (!paymentDialog) return;
        try {
            await markPaid.mutateAsync({ id: paymentDialog.id, paymentMethod });
            toast({
                title: "Pagamento Confirmado",
                description: `Fatura ${paymentDialog.invoiceNumber} marcada como paga.`,
            });
            setPaymentDialog(null);
        } catch (err: any) {
            toast({
                title: "Erro",
                description: err.message,
                variant: "destructive",
            });
        }
    };

    if (error) {
        return (
            <Card className="border-red-200 bg-red-50/30">
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 text-red-600">
                        <FileText className="h-5 w-5" />
                        <p>{error instanceof Error ? error.message : 'Erro ao carregar faturas'}</p>
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
                        <FileText className="h-6 w-6 text-primary" />
                        Gestão de Faturas
                    </h2>
                    <p className="text-muted-foreground">Gerencie cobranças mensais de todos os clientes</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => refetch()}
                        disabled={isRefetching}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                    <Button
                        onClick={handleGenerateInvoices}
                        disabled={generateInvoices.isPending}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {generateInvoices.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Zap className="h-4 w-4 mr-2" />
                        )}
                        Gerar Faturas do Mês
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-yellow-500/10">
                                <Clock className="h-5 w-5 text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Pendentes</p>
                                <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
                                <p className="text-xs text-muted-foreground">{pendingCount} faturas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Recebido (Mês)</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/10">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Em Atraso</p>
                                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOverdue)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-primary/30 bg-primary/5">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <DollarSign className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Geral</p>
                                <p className="text-2xl font-bold">{formatCurrency(totalPending + totalPaid + totalOverdue)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Table */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between gap-4">
                        <CardTitle className="text-lg">Todas as Faturas ({filteredInvoices.length})</CardTitle>
                        <div className="flex gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar fatura ou cliente..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="pending">Pendentes</SelectItem>
                                    <SelectItem value="paid">Pagos</SelectItem>
                                    <SelectItem value="overdue">Em Atraso</SelectItem>
                                    <SelectItem value="canceled">Cancelados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p>{searchTerm || statusFilter !== 'all' ? 'Nenhuma fatura encontrada com esses filtros.' : 'Nenhuma fatura gerada ainda.'}</p>
                            <p className="text-sm mt-2">Clique em "Gerar Faturas do Mês" para criar faturas para todos os clientes ativos.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="pl-6">Fatura</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Período</TableHead>
                                    <TableHead className="text-right">Valor</TableHead>
                                    <TableHead>Vencimento</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right pr-6">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInvoices.map((invoice) => (
                                    <TableRow key={invoice.id} className="hover:bg-muted/30">
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <FileText className="h-4 w-4 text-primary" />
                                                </div>
                                                <span className="font-medium font-mono text-sm">{invoice.invoiceNumber}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{invoice.account?.name || `Conta #${invoice.accountId}`}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-semibold">{formatCurrency(invoice.totalAmount)}</span>
                                            <div className="text-xs text-muted-foreground">
                                                {invoice.storageGB}GB + {invoice.bandwidthGB}GB band.
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm">
                                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                                {formatDate(invoice.dueDate)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(invoice.status)}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            {invoice.status === 'pending' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => setPaymentDialog(invoice)}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Confirmar Pgto.
                                                </Button>
                                            )}
                                            {invoice.status === 'paid' && (
                                                <span className="text-sm text-green-600 flex items-center gap-1">
                                                    <CheckCircle className="h-4 w-4" />
                                                    Pago em {formatDate(invoice.paidAt)}
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Payment Confirmation Dialog */}
            <Dialog open={!!paymentDialog} onOpenChange={(open) => !open && setPaymentDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Pagamento</DialogTitle>
                        <DialogDescription>
                            Marcar a fatura {paymentDialog?.invoiceNumber} como paga.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">Cliente</p>
                            <p className="font-medium">{paymentDialog?.account?.name}</p>
                        </div>

                        <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-900">
                            <p className="text-sm text-muted-foreground">Valor</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(paymentDialog?.totalAmount)}</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Forma de Pagamento</label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pix">PIX</SelectItem>
                                    <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                                    <SelectItem value="boleto">Boleto</SelectItem>
                                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                                    <SelectItem value="other">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPaymentDialog(null)}>Cancelar</Button>
                        <Button
                            onClick={handleMarkPaid}
                            disabled={markPaid.isPending}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {markPaid.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                            Confirmar Pagamento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
