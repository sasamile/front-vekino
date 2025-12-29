"use client";

import { useState } from "react";
import { CondominiosSidebar } from "@/components/dashboard/superadmin/administradores/condominios-sidebar";
import { UsuariosTable } from "@/components/dashboard/superadmin/administradores/usuarios-table";

function AdministradoresPage() {
  const [selectedCondominioId, setSelectedCondominioId] = useState<string | null>(null);

  return (
    <div className="space-y-6 ">
      <div className="p-6">
        <h1 className="text-3xl font-bold">Administradores</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona los usuarios de cada condominio
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-17rem)]">
        {/* Sidebar izquierdo con condominios */}
        <div className="w-full lg:w-70 shrink-0">
          <CondominiosSidebar
            selectedCondominioId={selectedCondominioId}
            onSelectCondominio={setSelectedCondominioId}
          />
        </div>

        {/* Contenido principal con usuarios */}
        <div className="flex-1 min-w-0">
          <UsuariosTable condominioId={selectedCondominioId} />
        </div>
      </div>
    </div>
  );
}

export default AdministradoresPage;
