"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CondominiosSidebar } from "@/components/dashboard/superadmin/administradores/condominios-sidebar";
import { UsuariosTable } from "@/components/dashboard/superadmin/administradores/usuarios-table";
import { ViewUsuarioDialog } from "@/components/dashboard/superadmin/administradores/view-usuario-dialog";
import { EditUsuarioDialog } from "@/components/dashboard/superadmin/administradores/edit-usuario-dialog";
import { CreateUsuarioDialog } from "@/components/dashboard/superadmin/administradores/create-usuario-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { IconMenu2 } from "@tabler/icons-react";
import { getAxiosInstance } from "@/lib/axios-config";
import axios from "axios";
import toast from "react-hot-toast";
import type { Usuario } from "@/types/users";

function AdministradoresPage() {
  const queryClient = useQueryClient();
  const [selectedCondominioId, setSelectedCondominioId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const isMobile = useIsMobile();

  const handleViewUsuario = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setViewModalOpen(true);
  };

  const handleEditUsuario = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setEditModalOpen(true);
  };

  const handleCreateUsuario = () => {
    if (!selectedCondominioId) {
      toast.error("Debes seleccionar un condominio primero");
      return;
    }
    setCreateModalOpen(true);
  };

  const handleSaveUsuario = async (formData: FormData) => {
    if (!selectedUsuario || !selectedCondominioId) return;

    try {
      const axiosInstance = getAxiosInstance(null);
      const baseURL = axiosInstance.defaults.baseURL || "/api";

      // Crear una instancia temporal de axios sin Content-Type por defecto para FormData
      const formDataAxiosInstance = axios.create({
        baseURL,
        withCredentials: true,
      });

      await formDataAxiosInstance.put(
        `/condominios/${selectedCondominioId}/users/${selectedUsuario.id}`,
        formData
      );

      // Invalidar y revalidar las queries para refrescar los datos
      await queryClient.invalidateQueries({
        queryKey: ["usuarios", selectedCondominioId],
      });

      toast.success("Usuario actualizado exitosamente", {
        duration: 3000,
      });

      setEditModalOpen(false);
      setSelectedUsuario(null);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Error al actualizar usuario";
      toast.error(errorMessage, {
        duration: 4000,
      });
      throw error;
    }
  };

  return (
    <div className="space-y-6 p-4 animate-in fade-in-50 duration-500">
      <div className="animate-in slide-in-from-top-2 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl max-sm:text-2xl font-bold">Administradores</h1>
            <p className="text-muted-foreground mt-2 text-base max-sm:text-[14.5px]">
              Gestiona los usuarios de cada condominio
            </p>
          </div>
          {/* Botón para abrir Sheet en móvil */}
          {isMobile && (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <IconMenu2 className="size-5" />
                  <span className="sr-only">Abrir menú de condominios</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Condominios</SheetTitle>
                </SheetHeader>
                <div className="h-full">
                  <CondominiosSidebar
                    selectedCondominioId={selectedCondominioId}
                    onSelectCondominio={(id) => {
                      setSelectedCondominioId(id);
                      setIsSheetOpen(false);
                    }}
                    withoutCard={true}
                  />
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-17rem)] overflow-hidden animate-in slide-in-from-bottom-2 duration-500">
        {/* Sidebar izquierdo con condominios - Solo visible en desktop */}
        {!isMobile && (
          <div className="w-full lg:w-70 shrink-0 overflow-hidden animate-in slide-in-from-left-4 duration-500">
            <CondominiosSidebar
              selectedCondominioId={selectedCondominioId}
              onSelectCondominio={setSelectedCondominioId}
            />
          </div>
        )}

        {/* Contenido principal con usuarios */}
        <div className="flex-1 min-w-0 w-full max-w-full overflow-hidden animate-in slide-in-from-bottom-2 duration-500">
          <UsuariosTable 
            condominioId={selectedCondominioId}
            onView={handleViewUsuario}
            onEdit={handleEditUsuario}
            onCreate={handleCreateUsuario}
          />
        </div>
      </div>

      {/* Modales */}
      <ViewUsuarioDialog
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        usuario={selectedUsuario}
      />

      <EditUsuarioDialog
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        usuario={selectedUsuario}
        onSave={handleSaveUsuario}
      />

      <CreateUsuarioDialog
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        condominioId={selectedCondominioId}
      />
    </div>
  );
}

export default AdministradoresPage;
