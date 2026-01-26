"use client";

import { useState, useCallback } from "react";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  IconCloudUpload,
  IconFileSpreadsheet,
  IconLoader2,
  IconX,
  IconCheck,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export function BulkUploadUsers() {
  const { subdomain } = useSubdomain();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (file: File) => {
    const isExcel =
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.name.endsWith(".xlsx");

    if (!isExcel) {
      toast.error("Por favor, selecciona un archivo Excel (.xlsx)");
      return;
    }

    setFile(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const loadingToast = toast.loading(
      "Subiendo archivo y procesando usuarios...",
    );

    try {
      const axiosInstance = getAxiosInstance(subdomain);
      const formData = new FormData();
      formData.append("file", file);

      const res = await axiosInstance.post(
        "/condominios/users/upload-excel",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("Cargue Masivo Response: ", res);
      toast.success("¡Usuarios cargados exitosamente!", { id: loadingToast });
      setFile(null);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        "Error al cargar el archivo. Verifica el formato.";
      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-12 transition-all flex flex-col items-center justify-center gap-4 text-center",
          isDragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-muted-foreground/25 hover:border-primary/50",
          file && "border-primary/50 bg-primary/5",
        )}
      >
        {!file ? (
          <>
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <IconCloudUpload className="size-8" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-foreground">
                Arrastra tu archivo aquí
              </p>
              <p className="text-sm text-muted-foreground">
                o haz clic para seleccionar uno desde tu ordenador
              </p>
            </div>
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </>
        ) : (
          <>
            <div className="size-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
              <IconFileSpreadsheet className="size-8" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-foreground truncate max-w-xs">
                {file.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-muted-foreground hover:text-destructive"
              onClick={() => setFile(null)}
              disabled={isUploading}
            >
              <IconX className="size-5" />
            </Button>
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          className="flex-1 gap-2 h-12 text-base"
          disabled={!file || isUploading}
          onClick={handleUpload}
        >
          {isUploading ? (
            <IconLoader2 className="size-5 animate-spin" />
          ) : (
            <IconCheck className="size-5" />
          )}
          {isUploading ? "Procesando Usuarios..." : "Comenzar Carga Masiva"}
        </Button>
        <Button variant="outline" className="gap-2 h-12 text-base px-8" asChild>
          <a href="/templates/Plantilla_Carga_Masiva_Usuarios.xlsx" download>
            <IconFileSpreadsheet className="size-5" />
            Descargar Plantilla
          </a>
        </Button>
      </div>
    </div>
  );
}
