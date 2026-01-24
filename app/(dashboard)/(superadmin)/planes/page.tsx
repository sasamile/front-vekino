"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import type {
  PlanPricing,
  CreatePlanPricingRequest,
  UpdatePlanPricingRequest,
} from "@/types/types";
import { PlanPricingTable } from "@/components/dashboard/superadmin/planes/planes-table";
import { CreateEditPlanDialog } from "@/components/dashboard/superadmin/planes/create-edit-plan-dialog";
import { ViewPlanDialog } from "@/components/dashboard/superadmin/planes/view-plan-dialog";
import { Button } from "@/components/ui/button";
import { IconCirclePlusFilled } from "@tabler/icons-react";
import toast from "react-hot-toast";

function PlanesPage() {
  const { subdomain } = useSubdomain();
  const queryClient = useQueryClient();
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanPricing | null>(null);

  const {
    data: plans,
    isLoading,
    error,
  } = useQuery<PlanPricing[]>({
    queryKey: ["plan-pricing"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/plan-pricing");
      return response.data;
    },
  });

  const handleView = (plan: PlanPricing) => {
    setSelectedPlan(plan);
    setViewModalOpen(true);
  };

  const handleEdit = (plan: PlanPricing) => {
    setSelectedPlan(plan);
    setEditModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedPlan(null);
    setEditModalOpen(true);
  };

  const handleSave = async (
    data: CreatePlanPricingRequest | UpdatePlanPricingRequest,
    isEdit: boolean
  ) => {
    const axiosInstance = getAxiosInstance(subdomain);

    if (isEdit && selectedPlan) {
      // Actualizar plan existente
      await axiosInstance.put(`/plan-pricing/${selectedPlan.plan}`, data);
    } else {
      // Crear nuevo plan
      await axiosInstance.post("/plan-pricing", data);
    }

    // Invalidar y revalidar las queries para refrescar los datos
    await queryClient.invalidateQueries({ queryKey: ["plan-pricing"] });
  };

  const handleDelete = async (plan: PlanPricing) => {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar el precio del plan ${plan.plan}? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      const axiosInstance = getAxiosInstance(subdomain);
      await axiosInstance.delete(`/plan-pricing/${plan.plan}`);

      // Invalidar y revalidar las queries para refrescar los datos
      await queryClient.invalidateQueries({ queryKey: ["plan-pricing"] });

      toast.success("Precio de plan eliminado correctamente", {
        duration: 2000,
      });
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al eliminar el precio del plan";
      toast.error(errorMessage, {
        duration: 3000,
      });
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between">
        <div>
          <h1 className="text-3xl max-sm:text-2xl font-bold">Gestión de Precios de Planes</h1>
          <p className="text-muted-foreground mt-2 text-base max-sm:text-[14.5px]">
            Configura y gestiona los precios de los planes de suscripción.{" "}
            <br className="max-sm:hidden" /> Los precios configurados se utilizan automáticamente para
            calcular el MRR.
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2 w-full sm:w-auto mt-4 sm:mt-0">
          <IconCirclePlusFilled className="size-4" />
          Crear Precio de Plan
        </Button>
      </div>

      <PlanPricingTable
        plans={plans || []}
        isLoading={isLoading}
        error={error as Error | null}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ViewPlanDialog
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        plan={selectedPlan}
      />

      <CreateEditPlanDialog
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        plan={selectedPlan}
        onSave={handleSave}
      />
    </div>
  );
}

export default PlanesPage;
