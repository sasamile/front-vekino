import { headers } from "next/headers";
import { DashboardLayoutWrapper } from "@/components/dashboard/dashboard-layout-wrapper";
import type { UserRole } from "@/lib/middleware/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();

  // Obtener información del usuario desde los headers
  const userRole = (headersList.get("x-user-role") || "USER") as UserRole;
  const userName = headersList.get("x-user-name") || "Usuario";
  const userEmail = headersList.get("x-user-email") || "";

  return (
    <DashboardLayoutWrapper
      userRole={userRole}
      userName={userName}
      userEmail={userEmail}
    >
      {children}
    </DashboardLayoutWrapper>
  );
}
