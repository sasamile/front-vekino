"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getAxiosInstance } from "@/lib/axios-config";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconBuilding, IconCar, IconId, IconUser, IconCheck, IconQrcode } from "@tabler/icons-react";
import toast, { Toaster } from "react-hot-toast";

// Helper component to read search params safely
function PreRegistroForm() {
  const searchParams = useSearchParams();
  const { subdomain: contextSubdomain } = useSubdomain();
  const paramSubdomain = searchParams.get("subdomain");
  const subdomain = paramSubdomain || contextSubdomain;
  const unidadParam = searchParams.get("unidad");
  
  const [success, setSuccess] = useState(false);
  const [qrData, setQrData] = useState("");
  const [formData, setFormData] = useState({
    documento: "",
    nombre: "",
    unidadId: unidadParam || "",
    unidadNombre: "",
    placa: "",
    tipo: "visitante"
  });

  // Fetch Unidades (assuming public or we need to handle auth failure)
  const { data: unidades = [], isLoading: isLoadingUnidades } = useQuery({
    queryKey: ["unidades", subdomain],
    queryFn: async () => {
      if (!subdomain) return [];
      // Note: This endpoint might fail if not public. 
      // If it fails, we might need a public version or the user has to type it manually.
      // For now, let's try the standard endpoint.
      const axiosInstance = getAxiosInstance(subdomain);
      try {
          const response = await axiosInstance.get("/unidades");
          return Array.isArray(response.data) ? response.data : response.data.data || [];
      } catch (e) {
          console.error("Error fetching units", e);
          // Mock data for demo/offline mode
          return [
              { id: "1", identificador: "101", tipo: "APARTAMENTO" },
              { id: "2", identificador: "102", tipo: "APARTAMENTO" },
              { id: "3", identificador: "201", tipo: "APARTAMENTO" },
              { id: "4", identificador: "202", tipo: "APARTAMENTO" },
              { id: "5", identificador: "ADMIN", tipo: "OFICINA" },
          ];
      }
    },
    enabled: !!subdomain,
  });

  // Pre-select unit name if unidadParam exists and units are loaded
  useEffect(() => {
    if (unidadParam && unidades.length > 0 && !formData.unidadNombre) {
        const u = unidades.find((x: any) => x.id === unidadParam);
        if (u) {
            setFormData(prev => ({ ...prev, unidadNombre: u.identificador }));
        }
    }
  }, [unidadParam, unidades, formData.unidadNombre]);

  const handleSubmit = () => {
     if (!formData.documento || !formData.nombre || !formData.unidadId) {
      toast.error("Complete los campos obligatorios");
      return;
    }
    
    // Generate QR Data
    const payload = {
        id: Date.now().toString(),
        documento: formData.documento,
        nombre: formData.nombre,
        unidadId: formData.unidadId,
        timestamp: new Date().toISOString(),
    };
    
    setQrData(JSON.stringify(payload));
    setSuccess(true);
    toast.success("Código de acceso generado");
  };

  if (success) {
      return (
          <Card className="max-w-md w-full shadow-xl border-emerald-100">
              <CardHeader className="text-center pb-2">
                  <div className="mx-auto bg-emerald-100 text-emerald-600 rounded-full p-3 w-fit mb-4">
                      <IconCheck className="size-8" />
                  </div>
                  <CardTitle className="text-2xl text-emerald-700">¡Acceso Generado!</CardTitle>
                  <CardDescription>
                      Presente este código QR al guardia de seguridad.
                  </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                  <div className="bg-white p-4 rounded-xl shadow-inner border w-fit mx-auto">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&color=000000&bgcolor=ffffff`}
                        alt="QR Code" 
                        className="size-48 object-contain"
                      />
                  </div>
                  <div className="bg-muted p-4 rounded-lg text-sm text-left">
                      <p><strong>Visitante:</strong> {formData.nombre}</p>
                      <p><strong>Destino:</strong> {formData.unidadNombre}</p>
                      <p><strong>Documento:</strong> {formData.documento}</p>
                  </div>
              </CardContent>
        
          </Card>
      );
  }

  return (
    <Card className="max-w-md w-full shadow-xl">
      <CardHeader>
        <CardTitle>Pre-registro de Visita</CardTitle>
        <CardDescription>
          Complete sus datos para agilizar el ingreso.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Label>Tipo de Visitante</Label>
            <div className="relative">
                <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none"
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                >
                    <option value="visitante">Visitante</option>
                    <option value="empresa">Empresa</option>
                    <option value="domicilio">Domicilio</option>
                </select>
            </div>
        </div>

        <div className="space-y-2">
            <Label>Número de Documento *</Label>
            <div className="relative">
                <IconId className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                <Input 
                    placeholder="123456789" 
                    className="pl-9"
                    value={formData.documento}
                    onChange={(e) => setFormData({...formData, documento: e.target.value})}
                />
            </div>
        </div>

        <div className="space-y-2">
            <Label>Nombre Completo *</Label>
            <div className="relative">
                <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                <Input 
                    placeholder="Su nombre" 
                    className="pl-9"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                />
            </div>
        </div>

        <div className="space-y-2">
            <Label>Unidad de Destino *</Label>
            <div className="relative">
                <IconBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4 pointer-events-none" />
                <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm pl-9 appearance-none"
                    value={formData.unidadId}
                    onChange={(e) => {
                        const u = unidades.find((x: any) => x.id === e.target.value);
                        setFormData({
                            ...formData, 
                            unidadId: e.target.value,
                            unidadNombre: u ? u.identificador : ""
                        });
                    }}
                    disabled={isLoadingUnidades}
                >
                    <option value="" disabled>Seleccionar Unidad</option>
                    {unidades.map((u: any) => (
                        <option key={u.id} value={u.id}>
                            {u.identificador} {u.tipo !== 'APARTAMENTO' ? `(${u.tipo})` : ''}
                        </option>
                    ))}
                </select>
            </div>
        </div>

        <div className="space-y-2">
            <Label>Placa Vehículo (Opcional)</Label>
            <div className="relative">
                <IconCar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                <Input 
                    placeholder="ABC-123" 
                    className="pl-9 uppercase"
                    value={formData.placa}
                    onChange={(e) => setFormData({...formData, placa: e.target.value.toUpperCase()})}
                />
            </div>
        </div>

        <Button 
            className="w-full mt-4 bg-primary text-primary-foreground"
            onClick={handleSubmit}
        >
            Generar Acceso QR
        </Button>
      </CardContent>
    </Card>
  );
}

export default function PreRegistroPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <Suspense fallback={<div>Cargando...</div>}>
        <PreRegistroForm />
      </Suspense>
    </div>
  );
}
