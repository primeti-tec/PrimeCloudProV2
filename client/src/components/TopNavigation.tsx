import { Link } from "wouter";
import { useMyAccounts } from "@/hooks/use-accounts";
import { NotificationsBell } from "./NotificationsBell";
import { Button } from "./ui-custom";
import { FileText, BookOpen, Database } from "lucide-react";

export function TopNavigation() {
    const { data: accounts } = useMyAccounts();
    const currentAccount = accounts?.[0];

    return (
        <div className="flex items-center gap-2">
            <Link href="/dashboard/storage">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" title="Buckets">
                    <Database className="h-5 w-5" />
                </Button>
            </Link>

            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" title="Documentação">
                <BookOpen className="h-5 w-5" />
            </Button>

            <Link href="/dashboard/audit-logs">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" title="Logs de Auditoria">
                    <FileText className="h-5 w-5" />
                </Button>
            </Link>

            <NotificationsBell accountId={currentAccount?.id} />
        </div>
    );
}
