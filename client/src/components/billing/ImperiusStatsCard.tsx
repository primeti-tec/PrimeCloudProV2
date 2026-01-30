import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Database, HardDrive, CheckCircle2 } from "lucide-react";

interface ImperiusStatsCardProps {
    licenseCount: number;
    linkedBuckets: { name: string; isImperiusBackup?: boolean }[];
    pricePerLicenseCents: number;
}

export function ImperiusStatsCard({ licenseCount, linkedBuckets, pricePerLicenseCents }: ImperiusStatsCardProps) {
    const usedLicenses = linkedBuckets.filter(b => b.isImperiusBackup).length;
    const availableLicenses = Math.max(0, licenseCount - usedLicenses);
    const totalCost = (licenseCount * pricePerLicenseCents) / 100;

    return (
        <Card className="h-full border-indigo-100 dark:border-indigo-900 bg-gradient-to-br from-white to-indigo-50/30 dark:from-card dark:to-indigo-950/10">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-lg font-medium text-indigo-950 dark:text-indigo-100">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        <span>Licenças Imperius</span>
                    </div>
                    <Badge variant={licenseCount > 0 ? "secondary" : "outline"} className={licenseCount > 0 ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" : ""}>
                        {licenseCount > 0 ? "Ativo" : "Inativo"}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-white dark:bg-card rounded-lg border border-indigo-100 dark:border-indigo-800 shadow-sm">
                        <span className="text-xs text-muted-foreground block mb-1">Total Contratado</span>
                        <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{licenseCount}</span>
                    </div>
                    <div className="p-3 bg-white dark:bg-card rounded-lg border border-indigo-100 dark:border-indigo-800 shadow-sm">
                        <span className="text-xs text-muted-foreground block mb-1">Disponíveis</span>
                        <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{availableLicenses}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                            <Database className="h-3 w-3" /> Buckets Vinculados
                        </span>
                        <span className="font-medium">{usedLicenses} de {licenseCount}</span>
                    </div>

                    {/* Visual Bucket Pills - Removed to clean up UI, details in table */}
                    <div className="text-sm text-muted-foreground">
                        <p>Gerencie a vinculação de licenças no detalhes de armazenamento abaixo.</p>
                    </div>

                    <div className="pt-4 border-t border-indigo-100 dark:border-indigo-800 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Custo Mensal</span>
                        <span className="font-semibold text-indigo-700 dark:text-indigo-300">R$ {totalCost.toFixed(2).replace('.', ',')}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
