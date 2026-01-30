
import {
    IconBuilding,
    IconCoin,
    IconCalendar,
    IconMessage,
    IconShield,
    IconBell,
    IconCheck,
} from "@tabler/icons-react";
import { Notification, NotificationType } from "@/types/notifications";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
}

const getIcon = (type: NotificationType) => {
    switch (type) {
        case "ADMINISTRACION":
            return IconBuilding;
        case "FINANZAS":
            return IconCoin;
        case "RESERVAS":
            return IconCalendar;
        case "COMUNICACION":
            return IconMessage;
        case "SEGURIDAD":
            return IconShield;
        case "GENERAL":
        default:
            return IconBell;
    }
};

const getIconColor = (type: NotificationType) => {
    switch (type) {
        case "ADMINISTRACION":
            return "text-blue-500 bg-blue-500/10";
        case "FINANZAS":
            return "text-green-500 bg-green-500/10";
        case "RESERVAS":
            return "text-purple-500 bg-purple-500/10";
        case "COMUNICACION":
            return "text-yellow-500 bg-yellow-500/10";
        case "SEGURIDAD":
            return "text-red-500 bg-red-500/10";
        default:
            return "text-gray-500 bg-gray-500/10";
    }
};

const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "hace unos segundos";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `hace ${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `hace ${diffInHours} h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `hace ${diffInDays} d`;

    return date.toLocaleDateString();
};

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
    const Icon = getIcon(notification.tipo);

    return (
        <div className={cn(
            "flex gap-3 p-3 text-sm transition-colors hover:bg-muted/50 border-b last:border-0 relative group",
            !notification.leida && "bg-primary/5"
        )}>
            <div className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full mt-0.5",
                getIconColor(notification.tipo)
            )}>
                <Icon className="h-5 w-5" />
            </div>

            <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start gap-2">
                    <p className={cn("font-medium", !notification.leida && "font-semibold")}>
                        {notification.titulo}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(notification.createdAt)}
                    </span>
                </div>

                <p className="text-muted-foreground line-clamp-2">
                    {notification.mensaje}
                </p>

                {!notification.leida && (
                    <div className="pt-1 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsRead(notification.id);
                            }}
                        >
                            <IconCheck className="h-3 w-3 mr-1" />
                            Marcar leída
                        </Button>
                    </div>
                )}
            </div>

            {!notification.leida && (
                <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary" />
            )}
        </div>
    );
}
