"use client";

import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAxiosInstance } from "@/lib/axios-config";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import { IconFileUpload, IconLoader2 } from "@tabler/icons-react";

const PERIODO_REGEX = /^\d{4}-\d{2}$/;

interface CreateFacturasBulkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFacturasBulkDialog({
  open,
  onOpenChange,
}: CreateFacturasBulkDialogProps) {
  const queryClient = useQueryClient();
  const { subdomain } = useSubdomain();
  const [loading, setLoading] = useState(false);
  const [periodo, setPeriodo] = useState("");
  const [periodoError, setPeriodoError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidPeriodo = periodo && PERIODO_REGEX.test(periodo);

  const handleClose = () => {
    if (loading) return;
    setPeriodo("");
    setPeriodoError("");
    setFile(null);
    setFileError("");
    onOpenChange(false);
  };

  const validate = (): boolean => {
    let ok = true;
    if (!periodo.trim()) {
      setPeriodoError("El período es requerido (formato YYYY-MM)");
      ok = false;
    } else if (!PERIODO_REGEX.test(periodo)) {
      setPeriodoError("El período debe tener el formato YYYY-MM (ej: 2026-01)");
      ok = false;
    } else {
      setPeriodoError("");
    }
    if (!file) {
      setFileError("Debes seleccionar un archivo PDF");
      ok = false;
    } else if (file.type !== "application/pdf") {
      setFileError("Solo se permiten archivos PDF");
      ok = false;
    } else {
      setFileError("");
    }
    return ok;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    setPeriodoError("");
    setFileError("");

    try {
      const axiosInstance = getAxiosInstance(subdomain);
      const formData = new FormData();
      formData.append("file", file!);
      formData.append("periodo", periodo.trim());

      const response = await axiosInstance.post(
        "/finanzas/facturas/importar-pdf",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
          timeout: 300000, // 5 minutos para PDFs grandes
        }
      );

      const total = response.data?.total ?? response.data?.importadas ?? 0;
      toast.success(
        total > 0
          ? `Se importaron ${total} facturas correctamente`
          : "Carga completada",
        { duration: 3000 }
      );
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      handleClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        error?.message ??
        "Error al importar facturas desde el PDF";
      toast.error(message, { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  // No permitir cerrar el modal mientras está cargando
  const handleOpenChange = (next: boolean) => {
    if (loading) return;
    if (!next) handleClose();
    else onOpenChange(true);
  };

  const preventCloseWhenLoading = (e: { preventDefault: () => void }) => {
    if (loading) e.preventDefault();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-md"
        onPointerDownOutside={preventCloseWhenLoading}
        onEscapeKeyDown={preventCloseWhenLoading}
        onInteractOutside={preventCloseWhenLoading}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconFileUpload className="size-5" />
            Cargar facturas desde PDF
          </DialogTitle>
          <DialogDescription>
            Sube un PDF de facturación para importar las facturas del período indicado. El proceso puede tardar varios minutos; no cierres esta ventana hasta que finalice.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="periodo">Período (YYYY-MM) *</Label>
            <Input
              id="periodo"
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              disabled={loading}
              placeholder="2026-01"
              className={periodoError ? "border-destructive" : ""}
            />
            {periodoError && (
              <p className="text-sm text-destructive">{periodoError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Archivo PDF *</Label>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              disabled={loading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                setFile(f ?? null);
                setFileError("");
              }}
              className={fileError ? "border-destructive" : ""}
            />
            {file && (
              <p className="text-sm text-muted-foreground truncate">
                {file.name}
              </p>
            )}
            {fileError && (
              <p className="text-sm text-destructive">{fileError}</p>
            )}
          </div>

          {loading && (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
              <IconLoader2 className="size-5 animate-spin shrink-0" />
              <span>Importando facturas desde el PDF. No cierres esta ventana.</span>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !file || !isValidPeriodo}>
              {loading ? (
                <>
                  <IconLoader2 className="size-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <IconFileUpload className="size-4" />
                  Importar PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
