export type NotificationType =
    | "ADMINISTRACION"
    | "FINANZAS"
    | "RESERVAS"
    | "COMUNICACION"
    | "SEGURIDAD"
    | "GENERAL";

export type NotificationRole =
    | "ADMIN"
    | "PROPIETARIO"
    | "ARRENDATARIO"
    | "RESIDENTE"
    | "GUARDIA_SEGURIDAD"
    | "SUPERADMIN";

export interface Notification {
    id: string;
    titulo: string;
    mensaje: string;
    tipo: NotificationType;
    rolesDestinatarios: NotificationRole[];
    userId?: string | null;
    leida: boolean;
    metadata?: Record<string, any> | null;
    createdAt: string;
}

export interface NotificationsResponse {
    items: Notification[];
    meta: {
        totalItems: number;
        itemCount: number;
        itemsPerPage: number;
        totalPages: number;
        currentPage: number;
    };
}

export interface UnreadCountResponse {
    count: number;
}
