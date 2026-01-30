import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, CheckCircle2, XCircle, Clock, ArrowUpRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UpgradeRequest {
    id: number;
    status: string | null;
    currentQuotaGB: number;
    requestedQuotaGB: number;
    createdAt: string;
    reason?: string | null;
    reviewNote?: string | null;
}

interface UpgradeRequestsCardProps {
    requests: UpgradeRequest[];
}

export function UpgradeRequestsCard({ requests }: UpgradeRequestsCardProps) {
    const getStatusIcon = (status: string | null) => {
        switch (status) {
            case 'approved': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
            default: return <Clock className="h-4 w-4 text-amber-500" />;
        }
    };

    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case 'approved': return <Badge variant="secondary" className="h-5 px-1.5 bg-green-100 text-green-700 border-green-200 hover:bg-green-200">Aprovado</Badge>;
            case 'rejected': return <Badge variant="destructive" className="h-5 px-1.5">Rejeitado</Badge>;
            default: return <Badge variant="secondary" className="h-5 px-1.5 bg-amber-100 text-amber-800 hover:bg-amber-200">Pendente</Badge>;
        }
    };

    return (
        <Card className="h-full border-none shadow-md bg-white dark:bg-card flex flex-col">
            <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="flex items-center gap-2 text-lg font-medium">
                    <History className="h-5 w-5 text-muted-foreground" />
                    <span>Solicitações Recentes</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-[160px]">
                {requests.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6">
                        <History className="h-8 w-8 mb-2 opacity-20" />
                        <span className="text-sm">Nenhuma solicitação recente.</span>
                    </div>
                ) : (
                    <ScrollArea className="h-full max-h-[220px]">
                        <div className="divide-y divide-border/40">
                            {requests.map((req) => (
                                <div key={req.id} className="p-4 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(req.status)}
                                            <span className="font-medium text-sm flex items-center gap-1">
                                                {req.currentQuotaGB} <ArrowUpRight className="h-3 w-3 text-muted-foreground" /> {req.requestedQuotaGB} GB
                                            </span>
                                        </div>
                                        {getStatusBadge(req.status)}
                                    </div>
                                    <div className="text-xs text-muted-foreground flex justify-between items-center mt-1">
                                        <span>{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '-'}</span>
                                        {req.reason && <span className="truncate max-w-[120px]" title={req.reason}>{req.reason}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}
