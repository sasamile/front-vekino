import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAxiosInstance } from "@/lib/axios-config";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import { Notification, NotificationsResponse, UnreadCountResponse, NotificationType } from "@/types/notifications";

interface UseNotificationsOptions {
    page?: number;
    limit?: number;
    soloNoLeidas?: boolean;
    tipo?: NotificationType;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
    const { subdomain } = useSubdomain();

    return useQuery({
        queryKey: ["notifications", subdomain, options],
        queryFn: async () => {
            const axios = getAxiosInstance(subdomain);
            const params = new URLSearchParams();
            if (options.page) params.append("page", options.page.toString());
            if (options.limit) params.append("limit", options.limit.toString());
            if (options.soloNoLeidas) params.append("soloNoLeidas", "true");
            if (options.tipo) params.append("tipo", options.tipo);

            const { data } = await axios.get<NotificationsResponse>(`/notificaciones?${params.toString()}`);
            return data;
        },
        enabled: !!subdomain,
    });
}

export function useUnreadNotificationsCount() {
    const { subdomain } = useSubdomain();

    return useQuery({
        queryKey: ["notifications", "unread-count", subdomain],
        queryFn: async () => {
            const axios = getAxiosInstance(subdomain);
            const { data } = await axios.get<UnreadCountResponse>("/notificaciones/no-leidas/count");
            return data;
        },
        enabled: !!subdomain,
        refetchInterval: 30000, // Poll every 30 seconds
    });
}

export function useMarkNotificationAsRead() {
    const { subdomain } = useSubdomain();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notificationId: string) => {
            const axios = getAxiosInstance(subdomain);
            await axios.put(`/notificaciones/${notificationId}/marcar-leida`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}

export function useMarkAllNotificationsAsRead() {
    const { subdomain } = useSubdomain();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const axios = getAxiosInstance(subdomain);
            await axios.put("/notificaciones/marcar-todas-leidas");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}
