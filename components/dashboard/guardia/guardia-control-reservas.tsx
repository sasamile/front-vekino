"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconCalendarCheck } from "@tabler/icons-react";
import toast from "react-hot-toast";

export default function GuardiaControlReservas() {
  const validarIngresoPiscina = () => {
    toast.success("Ingreso a zona húmeda validado. Se refleja en la Minuta.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reservas</h1>
        <p className="text-muted-foreground text-sm">Validación de ingreso/salida en zonas reservadas.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground mb-4">
            Al validar ingreso o salida aquí, se refleja en la Minuta Digital.
          </p>
          <Button onClick={validarIngresoPiscina} className="gap-2">
            <IconCalendarCheck className="size-4" />
            Validar Ingreso Piscina
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
