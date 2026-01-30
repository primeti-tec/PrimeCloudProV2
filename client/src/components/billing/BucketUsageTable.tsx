import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HardDrive, ShieldCheck, AlertTriangle } from "lucide-react";

interface BucketUsageTableProps {
    buckets: any[];
}

export function BucketUsageTable({ buckets }: BucketUsageTableProps) {
    return (
        <div className="border rounded-lg shadow-sm bg-card overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead>Bucket (Cliente)</TableHead>
                        <TableHead>Uso Armazenamento</TableHead>
                        <TableHead className="w-[150px]">Quota</TableHead>
                        <TableHead className="w-[180px]">Imperius Backup</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {buckets.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                Nenhum bucket encontrado.
                            </TableCell>
                        </TableRow>
                    ) : (
                        buckets.map((bucket, index) => {
                            const bucketLimit = bucket.storageLimitGB || 50;
                            const bucketSizeGB = Math.round(bucket.sizeBytes / (1024 * 1024 * 1024) * 100) / 100;
                            const bucketPercent = Math.min((bucketSizeGB / bucketLimit) * 100, 100);

                            const isOverLimit = bucketSizeGB > bucketLimit;
                            const isCritical = bucketSizeGB >= bucketLimit * 0.95;
                            const isWarning = bucketSizeGB >= bucketLimit * 0.80;

                            let progressColor = "bg-primary";
                            if (isOverLimit || isCritical) progressColor = "[&>div]:bg-destructive";
                            else if (isWarning) progressColor = "[&>div]:bg-amber-500";

                            return (
                                <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-muted rounded-md text-muted-foreground">
                                                <HardDrive className="h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">{bucket.name}</span>
                                                {/* If we had customer name, we'd put it here */}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1.5 w-full max-w-[200px]">
                                            <div className="flex justify-between text-xs">
                                                <span className="font-medium">{bucketSizeGB} GB</span>
                                                <span className="text-muted-foreground">{bucketPercent.toFixed(0)}%</span>
                                            </div>
                                            <Progress value={bucketPercent} className={`h-1.5 ${progressColor}`} />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-medium">{bucketLimit} GB</span>
                                    </TableCell>
                                    <TableCell>
                                        {bucket.isImperiusBackup ? (
                                            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium text-sm">
                                                <ShieldCheck className="h-4 w-4" />
                                                <span>Ativado</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-muted-foreground pl-6">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {isOverLimit && <Badge variant="destructive">Excedido</Badge>}
                                        {!isOverLimit && isCritical && <Badge variant="destructive">Crítico</Badge>}
                                        {!isOverLimit && !isCritical && isWarning && <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">Atenção</Badge>}
                                        {!isOverLimit && !isCritical && !isWarning && <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Normal</Badge>}
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
