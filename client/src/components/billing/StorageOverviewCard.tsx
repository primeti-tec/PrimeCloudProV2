import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HardDrive, FileUp, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Badge } from "@/components/ui/badge";

interface StorageOverviewCardProps {
    usedGB: number;
    totalGB: number;
    onRequestQuota: () => void;
    isCritical?: boolean;
}

export function StorageOverviewCard({ usedGB, totalGB, onRequestQuota, isCritical }: StorageOverviewCardProps) {
    const availableGB = Math.max(0, totalGB - usedGB);
    const usagePercent = Math.min((usedGB / totalGB) * 100, 100);

    const data = [
        { name: "Usado", value: usedGB, color: isCritical ? "#ef4444" : "#3b82f6" }, // Red or Blue
        { name: "Disponível", value: availableGB, color: "#e2e8f0" }, // Slate-200
    ];

    return (
        <Card className="h-full overflow-hidden relative border-none shadow-md bg-white dark:bg-card">
            {/* Background Gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-lg font-medium">
                    <div className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5 text-primary" />
                        <span>Armazenamento</span>
                    </div>
                    {isCritical && (
                        <Badge variant="destructive" className="animate-pulse flex gap-1">
                            <AlertTriangle className="h-3 w-3" /> Crítico
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-full justify-between gap-4">
                <div className="flex-1 min-h-[160px] relative flex items-center justify-center">
                    {/* Chart */}
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={75}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number) => `${value.toFixed(2)} GB`}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold font-display">{usagePercent.toFixed(0)}%</span>
                        <span className="text-xs text-muted-foreground">Uso</span>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex flex-col">
                            <span className="text-muted-foreground">Usado</span>
                            <span className="font-semibold text-lg">{usedGB.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">GB</span></span>
                        </div>
                        <div className="w-px h-8 bg-border"></div>
                        <div className="flex flex-col items-end">
                            <span className="text-muted-foreground">Total</span>
                            <span className="font-semibold text-lg">{totalGB} <span className="text-xs font-normal text-muted-foreground">GB</span></span>
                        </div>
                    </div>

                    <Button onClick={onRequestQuota} variant={isCritical ? "destructive" : "default"} className="w-full">
                        <FileUp className="h-4 w-4 mr-2" />
                        Solicitar Mais Espaço
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
