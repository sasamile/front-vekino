"use client";

import { useState, useEffect } from "react";
import { IconBell } from "@tabler/icons-react";
import { useUnreadNotificationsCount } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationsList } from "./notifications-list";
import { cn } from "@/lib/utils";

export function NotificationsTrigger() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const { data: unreadData } = useUnreadNotificationsCount();

    // Prevenir errores de hidratación renderizando solo en el cliente
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const unreadCount = unreadData?.count || 0;
    const hasUnread = unreadCount > 0;

    // Renderizar un placeholder durante SSR para evitar diferencias de hidratación
    if (!isMounted) {
        return (
            <Button
                variant="ghost"
                size="icon"
                className="relative transition-all"
                aria-label="Notificaciones"
                suppressHydrationWarning
            >
                <IconBell className="h-5 w-5" />
            </Button>
        );
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "relative transition-all",
                        isOpen && "bg-accent text-accent-foreground"
                    )}
                    aria-label="Notificaciones"
                >
                    <IconBell className="h-5 w-5" />
                    {hasUnread && (
                        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-background flex items-center justify-center">
                            <span className="sr-only">{unreadCount} notificaciones no leídas</span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[380px] p-0 shadow-lg" sideOffset={8}>
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="font-semibold">Notificaciones</h3>
                    {hasUnread && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                            {unreadCount} nuevas
                        </span>
                    )}
                </div>
                <NotificationsList />
            </PopoverContent>
        </Popover>
    );
}
