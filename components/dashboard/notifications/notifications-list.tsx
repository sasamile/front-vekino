import { useState } from "react";
import { NotificationItem } from "./notification-item";
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IconCheck, IconLoader2, IconInbox } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export function NotificationsList() {
    const [filter, setFilter] = useState<"all" | "unread">("all");

    const { data, isLoading, isError, refetch } = useNotifications({
        limit: 20,
        soloNoLeidas: filter === "unread"
    });

    const markAsReadMutation = useMarkNotificationAsRead();
    const markAllAsReadMutation = useMarkAllNotificationsAsRead();

    const handleMarkAsRead = (id: string) => {
        markAsReadMutation.mutate(id);
    };

    if (isError) {
        return (
            <div className="p-4 text-center text-sm text-red-500">
                Error al cargar notificaciones.
                <Button variant="link" onClick={() => refetch()} className="mx-auto block mt-2">Reintentar</Button>
            </div>
        );
    }

    const notifications = data?.items || [];
    const hasUnread = notifications.some(n => !n.leida);

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("h-7 px-2 text-xs", filter === "all" && "bg-background shadow-sm")}
                        onClick={() => setFilter("all")}
                    >
                        Todas
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("h-7 px-2 text-xs", filter === "unread" && "bg-background shadow-sm")}
                        onClick={() => setFilter("unread")}
                    >
                        No leídas
                    </Button>
                </div>

                {hasUnread && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => markAllAsReadMutation.mutate()}
                        disabled={markAllAsReadMutation.isPending}
                    >
                        {markAllAsReadMutation.isPending ? (
                            <IconLoader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                            <IconCheck className="h-3 w-3 mr-1" />
                        )}
                        Marcar todo
                    </Button>
                )}
            </div>

            <ScrollArea className="h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-8 space-y-2 text-muted-foreground">
                        <IconLoader2 className="h-8 w-8 animate-spin text-primary/50" />
                        <span className="text-xs">Cargando notificaciones...</span>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                            <IconInbox className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium">No hay notificaciones</p>
                            <p className="text-xs text-muted-foreground">
                                {filter === "unread" ? "No tienes notificaciones pendientes." : "Tu bandeja de entrada está vacía."}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={handleMarkAsRead}
                            />
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
