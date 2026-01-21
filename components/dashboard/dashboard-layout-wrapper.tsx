"use client";

import { TopNavigation } from "@/components/dashboard/top-navigation";
import type { UserRole } from "@/lib/middleware/types";
import { useCondominio } from "@/components/providers/condominio-provider";

interface DashboardLayoutWrapperProps {
  children: React.ReactNode;
  userRole: UserRole;
  userName?: string;
  userEmail?: string;
}

export function DashboardLayoutWrapper({
  children,
  userRole,
  userName,
  userEmail,
}: DashboardLayoutWrapperProps) {
  const { condominio } = useCondominio();

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
        condominioName={condominio?.name}
      />
      <main className="container mx-auto max-w-7xl pb-6 px-6 max-sm:px-2">{children}</main>
    </div>
  );
}
