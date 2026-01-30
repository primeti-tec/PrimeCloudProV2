import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type Customer, type CreateCustomerRequest, type Bucket } from "@shared/schema";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Card, CardContent } from "@/components/ui-custom";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, Users, Building, Mail, Phone, Calendar, CreditCard, Activity, Loader2, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { useCustomers } from "@/hooks/use-customers";
import { useMyAccounts } from "@/hooks/use-accounts";
import { useBuckets } from "@/hooks/use-buckets";

// Fetch Clients moved to hooks/use-customers.ts

function useCreateCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch("/api/customers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to create customer");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
        },
    });
}

export default function Customers() {
    const { data: customers, isLoading } = useCustomers();
    const { mutate: createCustomer, isPending: isCreating } = useCreateCustomer();
    const { toast } = useToast();

    // Data for linking buckets
    const { data: accounts } = useMyAccounts();
    const currentAccount = accounts?.[0];
    const { data: allBuckets } = useBuckets(currentAccount?.id);

    // Filter buckets that are not linked to any customer
    const availableBuckets = useMemo(() => {
        return allBuckets?.filter(b => !b.customerId) || [];
    }, [allBuckets]);

    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form States
    const [name, setName] = useState("");
    const [document, setDocument] = useState("");
    const [emailAdmin, setEmailAdmin] = useState("");
    const [emailFinancial, setEmailFinancial] = useState("");
    const [selectedBucketIds, setSelectedBucketIds] = useState<number[]>([]);

    const filteredCustomers = customers?.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.document?.includes(searchTerm)
    );

    const [billingModel, setBillingModel] = useState("usage");
    const [contractedStorageGB, setContractedStorageGB] = useState(0);
    const [priceFixedCents, setPriceFixedCents] = useState(0);
    const [priceOveragePerGB, setPriceOveragePerGB] = useState(15);

    const handleCreate = () => {
        if (!name) return;
        createCustomer({
            name, document, emailAdmin, emailFinancial,
            billingModel, contractedStorageGB,
            priceFixedCents: Math.round(priceFixedCents),
            priceOveragePerGB: Math.round(priceOveragePerGB),
            bucketIds: selectedBucketIds.length > 0 ? selectedBucketIds : undefined
        }, {
            onSuccess: () => {
                toast({ title: "Cliente cadastrado!", description: `${name} foi adicionado.` });
                setIsDialogOpen(false);
                setName("");
                setDocument("");
                setEmailAdmin("");
                setEmailFinancial("");
                setSelectedBucketIds([]);
            },
            onError: (err) => {
                toast({ title: "Erro", description: err.message || "Falha ao cadastrar cliente.", variant: "destructive" });
            }
        });
    };

    const toggleBucketSelection = (bucketId: number) => {
        setSelectedBucketIds(prev =>
            prev.includes(bucketId)
                ? prev.filter(id => id !== bucketId)
                : [...prev, bucketId]
        );
    };

    return (
        <DashboardLayout>
            <div className="p-4 md:p-8 w-full max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Gestão de Clientes</h1>
                        <p className="text-muted-foreground">Cadastre e gerencie seus clientes para vincular buckets e faturas.</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Novo Cliente
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Novo Cliente</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Nome da Empresa *</label>
                                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Coca Cola Industrias" />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">CNPJ / CPF</label>
                                    <Input value={document} onChange={(e) => setDocument(e.target.value)} placeholder="00.000.000/0001-00" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Email Admin</label>
                                        <Input value={emailAdmin} onChange={(e) => setEmailAdmin(e.target.value)} placeholder="tech@cliente.com" />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Email Financeiro</label>
                                        <Input value={emailFinancial} onChange={(e) => setEmailFinancial(e.target.value)} placeholder="fin@cliente.com" />
                                    </div>
                                </div>

                                {/* Bucket Linking Section */}
                                <div className="border rounded-md p-4 bg-muted/20">
                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                        <Database className="h-4 w-4" /> Vincular Buckets Existentes
                                    </h4>
                                    {availableBuckets.length === 0 ? (
                                        <p className="text-sm text-muted-foreground italic">Nenhum bucket disponível para vínculo.</p>
                                    ) : (
                                        <ScrollArea className="h-40 border rounded-md bg-background p-2">
                                            <div className="space-y-2">
                                                {availableBuckets.map(bucket => (
                                                    <div key={bucket.id} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded">
                                                        <Checkbox
                                                            id={`bucket-${bucket.id}`}
                                                            checked={selectedBucketIds.includes(bucket.id)}
                                                            onCheckedChange={() => toggleBucketSelection(bucket.id)}
                                                        />
                                                        <Label htmlFor={`bucket-${bucket.id}`} className="text-sm cursor-pointer flex-1">
                                                            {bucket.name} <span className="text-muted-foreground text-xs">({(bucket.storageLimitGB || 50)} GB)</span>
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Selecione buckets que já foram criados mas não possuem cliente vinculado.
                                    </p>
                                </div>

                                <div className="border-t pt-4 mt-2">
                                    <h4 className="text-sm font-semibold mb-3">Configuração de Faturamento</h4>
                                    <div className="grid gap-2 mb-3">
                                        <label className="text-sm font-medium">Modelo de Cobrança</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={billingModel}
                                            onChange={(e) => {
                                                const model = e.target.value;
                                                setBillingModel(model);
                                                // Set defaults based on model
                                                if (model === 'usage') {
                                                    setPriceOveragePerGB(69); // R$ 0.69 default
                                                    setContractedStorageGB(100); // 100GB default base
                                                    setPriceFixedCents(0);
                                                } else if (model === 'fixed') {
                                                    setPriceOveragePerGB(43); // R$ 0.43 default for fixed overage
                                                    setContractedStorageGB(2000); // Example default
                                                    setPriceFixedCents(86000); // Example default R$ 860.00
                                                }
                                            }}
                                        >
                                            <option value="usage">Por Uso (Pay-As-You-Go)</option>
                                            <option value="fixed">Valor Fixo (Franquia)</option>
                                            <option value="hybrid">Híbrido (Fixo + Excedente)</option>
                                        </select>
                                    </div>

                                    {billingModel === 'fixed' || billingModel === 'hybrid' ? (
                                        <div className="space-y-4 border p-4 rounded-md bg-muted/20">
                                            <div className="flex justify-between items-center pb-2 border-b">
                                                <h5 className="font-medium text-sm flex items-center gap-2">
                                                    <CreditCard className="h-4 w-4" /> Configuração Fixo
                                                </h5>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <label className="text-sm font-medium">Armazenamento (GB)</label>
                                                    <Input type="number" value={contractedStorageGB} onChange={(e) => setContractedStorageGB(Number(e.target.value))} />
                                                    <p className="text-xs text-muted-foreground">Franquia contratada</p>
                                                </div>
                                                <div className="grid gap-2">
                                                    <label className="text-sm font-medium">Valor Mensal (Centavos)</label>
                                                    <Input type="number" value={priceFixedCents} onChange={(e) => setPriceFixedCents(Number(e.target.value))} />
                                                    <p className="text-xs text-muted-foreground">Ex: 86000 = R$ 860,00</p>
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Preço Excedente (Centavos/GB)</label>
                                                <Input type="number" value={priceOveragePerGB} onChange={(e) => setPriceOveragePerGB(Number(e.target.value))} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 border p-4 rounded-md bg-blue-50/10 border-blue-200/20">
                                            <div className="flex justify-between items-center pb-2 border-b">
                                                <h5 className="font-medium text-sm flex items-center gap-2">
                                                    <Activity className="h-4 w-4" /> Configuração Por Uso
                                                </h5>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <label className="text-sm font-medium">Franquia Inicial (GB)</label>
                                                    <Input type="number" value={contractedStorageGB} onChange={(e) => setContractedStorageGB(Number(e.target.value))} />
                                                    <p className="text-xs text-muted-foreground">Geralmente 100GB</p>
                                                </div>
                                                <div className="grid gap-2">
                                                    <label className="text-sm font-medium">Preço por GB (Centavos)</label>
                                                    <Input type="number" value={priceOveragePerGB} onChange={(e) => setPriceOveragePerGB(Number(e.target.value))} />
                                                    <p className="text-xs text-muted-foreground">Padrão: 69 centavos</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Button onClick={handleCreate} disabled={!name || isCreating} className="w-full">
                                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Cadastrar
                            </Button>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex items-center mb-6">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar por nome ou documento..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : filteredCustomers?.length === 0 ? (
                    <div className="text-center p-8 border rounded-lg bg-muted/20">
                        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">Nenhum cliente encontrado</h3>
                        <p className="text-muted-foreground">Cadastre seu primeiro cliente para começar.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredCustomers?.map((customer) => (
                            <Card key={customer.id} className="hover:shadow-md transition-shadow cursor-pointer">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {customer.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg line-clamp-1">{customer.name}</h3>
                                                <p className="text-sm text-muted-foreground">{customer.document || "Sem documento"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4" />
                                            <span className="truncate">{customer.emailAdmin || customer.emailFinancial || "Sem email"}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" />
                                            <span>{customer.billingModel === 'fixed' ? 'Preço Fixo' : 'Por Uso (Hybrid)'}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
