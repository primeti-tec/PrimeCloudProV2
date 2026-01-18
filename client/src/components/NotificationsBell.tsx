import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllRead,
} from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface NotificationsBellProps {
  accountId: number | undefined;
}

export function NotificationsBell({ accountId }: NotificationsBellProps) {
  const { data: notifications = [], isLoading } = useNotifications(accountId);
  const { data: unreadData } = useUnreadCount(accountId);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();

  const unreadCount = unreadData?.count ?? 0;

  const handleMarkRead = (notificationId: number) => {
    if (!accountId) return;
    markRead.mutate({ accountId, notificationId });
  };

  const handleMarkAllRead = () => {
    if (!accountId) return;
    markAllRead.mutate({ accountId });
  };

  const formatTimeAgo = (date: Date | string | null) => {
    if (!date) return "";
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs no-default-hover-elevate"
              data-testid="badge-unread-count"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" data-testid="popover-notifications">
        <div className="flex items-center justify-between gap-2 p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markAllRead.isPending}
              className="h-8 text-xs"
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground" data-testid="loading-notifications">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground" data-testid="empty-notifications">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover-elevate cursor-pointer",
                    !notification.isRead && "bg-primary/5"
                  )}
                  onClick={() => !notification.isRead && handleMarkRead(notification.id)}
                  data-testid={`notification-item-${notification.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm truncate",
                        !notification.isRead && "font-semibold"
                      )}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead(notification.id);
                        }}
                        disabled={markRead.isPending}
                        data-testid={`button-mark-read-${notification.id}`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
