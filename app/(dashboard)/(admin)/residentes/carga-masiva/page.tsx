"use client";

import {
  IconChevronLeft,
  IconFileText,
  IconLoader2,
  IconUpload,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { BulkUploadUsers } from "@/components/dashboard/admin/residentes/bulk-upload-users";

export default function CargaMasivaPage() {
  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/residentes">
            <IconChevronLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Carga Masiva de Usuarios</h1>
          <p className="text-muted-foreground mt-2">
            Importa múltiples usuarios a la vez utilizando un archivo Excel.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instrucciones</CardTitle>
          <CardDescription>
            Sigue estos pasos para asegurar un cargue exitoso:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            <li>
              Asegúrate de que el archivo sea formato <strong>.xlsx</strong>.
            </li>
            <li>No modifiques los encabezados de la plantilla.</li>
            <li>Los campos marcados con asterisco (*) son obligatorios.</li>
            <li>
              Verifica que los correos electrónicos sean válidos y únicos.
            </li>
          </ul>
        </CardContent>
      </Card>

      <BulkUploadUsers />
    </div>
  );
}
