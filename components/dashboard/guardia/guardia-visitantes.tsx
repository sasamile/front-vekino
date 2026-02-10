"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  IconQrcode, 
  IconScan, 
  IconShare, 
  IconCar, 
  IconId, 
  IconUser,
  IconBuilding,
  IconCheck,
  IconSearch,
  IconFilter,
  IconBrandWhatsapp,
  IconMail,
} from "@tabler/icons-react";
import toast from "react-hot-toast";

// Interface for Unidad
interface Unidad {
  id: string;
  identificador: string;
  tipo: string;
}

// Interface for Visitante (Minuta)
interface Visitante {
  id: string;
  documento: string;
  nombre: string;
  unidad: string;
  unidadId: string;
  tipo: string;
  placa?: string;
  horaEntrada: string;
  horaSalida?: string;
  estado: "ACTIVO" | "FINALIZADO" | "PENDIENTE";
}

export default function GuardiaVisitantes() {
  const { subdomain } = useSubdomain();
  
  // Form State
  const [formData, setFormData] = useState({
    documento: "",
    nombre: "",
    unidadId: "",
    unidadNombre: "", // Store name for display
    tipo: "visitante",
    placa: "",
  });

  // QR State
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrData, setQrData] = useState("");
  const [qrInfo, setQrInfo] = useState<{nombre: string, unidad: string} | null>(null);

  // Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Local Storage State
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [isLoadingVisitantes, setIsLoadingVisitantes] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("vekino_visitantes");
    if (stored) {
      try {
        setVisitantes(JSON.parse(stored));
      } catch (e) {
        console.error("Error parsing local storage", e);
      }
    }
    setIsLoadingVisitantes(false);
  }, []);

  // Save helper
  const saveVisitantes = (newVisitantes: Visitante[]) => {
    setVisitantes(newVisitantes);
    localStorage.setItem("vekino_visitantes", JSON.stringify(newVisitantes));
  };
  
  // Fetch Unidades
  const { data: unidades = [], isLoading: isLoadingUnidades } = useQuery<Unidad[]>({
    queryKey: ["unidades", subdomain],
    queryFn: async () => {
      try {
        const axiosInstance = getAxiosInstance(subdomain);
        const response = await axiosInstance.get("/unidades");
        return Array.isArray(response.data) ? response.data : response.data.data || [];
      } catch (error) {
        console.error("Error fetching units", error);
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

  // Create Handler (replaces mutation)
  const handleCreateVisitante = async (nuevoVisitante: Partial<Visitante>, showQr = true) => {
      const newV: Visitante = {
        id: nuevoVisitante.id || Date.now().toString(),
        documento: nuevoVisitante.documento!,
        nombre: nuevoVisitante.nombre!,
        unidad: nuevoVisitante.unidad || "",
        unidadId: nuevoVisitante.unidadId || "",
        tipo: nuevoVisitante.tipo || "visitante",
        placa: nuevoVisitante.placa,
        horaEntrada: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        horaSalida: undefined,
        estado: "ACTIVO",
      };
      
      const updatedList = [newV, ...visitantes];
      saveVisitantes(updatedList);
      
      if (showQr) {
        // Generate QR Data
        const qrPayload = {
            id: newV.id,
            documento: newV.documento,
            nombre: newV.nombre,
            unidadId: newV.unidadId,
            timestamp: new Date().toISOString(),
        };
        
        setQrData(JSON.stringify(qrPayload));
        setQrInfo({ nombre: newV.nombre, unidad: newV.unidad });
        setQrDialogOpen(true);
        toast.success("Visitante registrado y QR generado");
      } else {
         toast.success(`Ingreso registrado: ${newV.nombre}`);
      }
      
      // Reset form
      setFormData({
        documento: "",
        nombre: "",
        unidadId: "",
        unidadNombre: "",
        tipo: "visitante",
        placa: "",
      });
  };

  // Update Handler (replaces mutation)
  const handleUpdateVisitante = async (id: string, data: Partial<Visitante>) => {
      const updatedList = visitantes.map(v => v.id === id ? { ...v, ...data } : v);
      saveVisitantes(updatedList);
      toast.success("Actualizado correctamente");
  };

  // Filter Logic
  const filteredVisitantes = visitantes.filter(v => {
    const matchesSearch = 
      v.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.documento.includes(searchTerm) ||
      (v.placa && v.placa.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "ALL" || v.estado === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUnidadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const selectedUnidad = unidades.find(u => u.id === value);
    setFormData((prev) => ({ 
      ...prev, 
      unidadId: value,
      unidadNombre: selectedUnidad ? `${selectedUnidad.identificador}` : ""
    }));
  };

  const generarQR = () => {
    if (!formData.documento || !formData.nombre || !formData.unidadId) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    const nuevoVisitante = {
      documento: formData.documento,
      nombre: formData.nombre,
      unidadId: formData.unidadId, 
      unidad: formData.unidadNombre,
      tipo: formData.tipo,
      placa: formData.placa,
    };

    handleCreateVisitante(nuevoVisitante);
  };

  const registrarSalida = (id: string) => {
    handleUpdateVisitante(id, {
        horaSalida: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        estado: "FINALIZADO"
    });
  };
  
  const handleScan = (result: any) => {
      if (result) {
          const rawValue = result?.[0]?.rawValue;
          if (rawValue) {
            try {
                const data = JSON.parse(rawValue);
                
                // Check if visitor already exists in current list
                const existing = visitantes.find(v => v.id === data.id || v.documento === data.documento);
                
                if (existing) {
                    if (existing.estado === 'ACTIVO') {
                         toast.error(`El visitante ${existing.nombre} ya tiene ingreso activo.`);
                    } else {
                         // Update to ACTIVO
                        handleUpdateVisitante(existing.id, {
                            horaEntrada: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            horaSalida: undefined,
                            estado: "ACTIVO"
                        });
                        toast.success(`Ingreso autorizado: ${existing.nombre}`);
                    }
                } else {
                    // New visitor from Pre-registro (QR)
                    // Find unit name
                    const u = unidades.find(u => u.id === data.unidadId);
                    
                    const nuevo = {
                        id: data.id, // Use QR ID
                        documento: data.documento,
                        nombre: data.nombre,
                        unidadId: data.unidadId,
                        unidad: u ? u.identificador : ("Unidad " + data.unidadId),
                        tipo: "visitante",
                        placa: "",
                        estado: "ACTIVO" as const
                    };
                    
                    handleCreateVisitante(nuevo, false); // Don't show QR again
                }
            } catch (e) {
                console.error(e);
                toast.error("Formato de QR inválido");
            }
          }
      }
  };

  const handleViewQr = (v: Visitante) => {
      const qrPayload = {
          id: v.id,
          documento: v.documento,
          nombre: v.nombre,
          unidadId: v.unidadId,
          timestamp: new Date().toISOString(),
      };
      setQrData(JSON.stringify(qrPayload));
      setQrInfo({ nombre: v.nombre, unidad: v.unidad });
      setQrDialogOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Control de Acceso</h1>
          <p className="text-muted-foreground mt-1">Gestión de visitantes y control de seguridad</p>
        </div>
      </div>

      <Tabs defaultValue="registro" className="w-full mb-8">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="registro" className="flex items-center gap-2">
                <IconUser className="size-4" />
                <span className="hidden sm:inline">Registro Manual</span>
                <span className="sm:hidden">Registro</span>
            </TabsTrigger>
            <TabsTrigger value="scan" className="flex items-center gap-2">
                <IconScan className="size-4" />
                <span className="hidden sm:inline">Escanear QR</span>
                <span className="sm:hidden">Scan</span>
            </TabsTrigger>
            <TabsTrigger value="compartir" className="flex items-center gap-2">
                <IconShare className="size-4" />
                <span className="hidden sm:inline">Pre-registro</span>
                <span className="sm:hidden">Enviar</span>
            </TabsTrigger>
        </TabsList>

        {/* REGISTRO MANUAL */}
        <TabsContent value="registro">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Formulario */}
            <Card className="lg:col-span-1 border-primary/20 shadow-lg h-fit pt-0">
                <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="flex items-center gap-2 pt-8">
                    <IconUser className="size-5 text-primary" />
                    Nuevo Visitante
                </CardTitle>
                <CardDescription>
                    Complete los datos para generar el acceso
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                    <Label htmlFor="documento">Número de Documento *</Label>
                    <div className="relative">
                    <IconId className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                    <Input 
                        id="documento" 
                        placeholder="123456789" 
                        className="pl-9"
                        value={formData.documento}
                        onChange={(e) => handleInputChange("documento", e.target.value)}
                    />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre y Apellido *</Label>
                    <Input 
                    id="nombre" 
                    placeholder="Ej. Pepito Pérez" 
                    value={formData.nombre}
                    onChange={(e) => handleInputChange("nombre", e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="unidad">Unidad de Destino *</Label>
                    <div className="relative">
                    <IconBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4 pointer-events-none" />
                    <select
                        id="unidad"
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9 appearance-none"
                        value={formData.unidadId}
                        onChange={handleUnidadChange}
                        disabled={isLoadingUnidades}
                    >
                        <option value="" disabled>
                            {isLoadingUnidades ? "Cargando unidades..." : "Seleccionar Unidad"}
                        </option>
                        {unidades.map((u) => (
                        <option key={u.id} value={u.id}>
                            {u.identificador} {u.tipo !== 'APARTAMENTO' ? `(${u.tipo})` : ''}
                        </option>
                        ))}
                    </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo</Label>
                    <select
                        id="tipo"
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.tipo}
                        onChange={(e) => handleInputChange("tipo", e.target.value)}
                    >
                        <option value="visitante">Visitante</option>
                        <option value="empresa">Empresa</option>
                        <option value="domicilio">Domicilio</option>
                    </select>
                    </div>

                    <div className="space-y-2">
                    <Label htmlFor="placa">Placa (Opcional)</Label>
                    <div className="relative">
                        <IconCar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                        <Input 
                        id="placa" 
                        placeholder="ABC-123" 
                        className="pl-9 uppercase"
                        value={formData.placa}
                        onChange={(e) => handleInputChange("placa", e.target.value.toUpperCase())}
                        />
                    </div>
                    </div>
                </div>

                <Button 
                    className="w-full mt-4 bg-primary hover:bg-primary/90" 
                    onClick={generarQR}
                >
                    <IconQrcode className="size-4 mr-2" />
                    Registrar y Generar QR
                </Button>
                </CardContent>
            </Card>

            {/* Minuta Table */}
            <Card className="lg:col-span-2 h-full shadow-lg border-muted/60 flex flex-col">
                <CardHeader className="border-b bg-muted/5 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Historial de Visitantes</CardTitle>
                      <CardDescription>Registro completo de accesos</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="relative w-full sm:w-48">
                          <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                          <Input 
                            placeholder="Buscar..." 
                            className="pl-8 h-9 text-sm" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                       </div>
                       <div className="relative w-32">
                          <select 
                            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                          >
                            <option value="ALL">Todos</option>
                            <option value="ACTIVO">Activos</option>
                            <option value="PENDIENTE">Pendientes</option>
                            <option value="FINALIZADO">Finalizados</option>
                          </select>
                       </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto h-[500px]">
                    {isLoadingVisitantes ? (
                        <div className="text-center py-8 text-muted-foreground">Cargando visitantes...</div>
                    ) : filteredVisitantes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No se encontraron registros</div>
                    ) : (
                    <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium">Hora</th>
                        <th className="text-left p-3 font-medium">Visitante</th>
                        <th className="text-left p-3 font-medium">Destino</th>
                        <th className="text-left p-3 font-medium">Detalles</th>
                        <th className="text-left p-3 font-medium">Estado</th>
                        <th className="text-left p-3 font-medium">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredVisitantes.map((v) => (
                        <tr key={v.id} className="border-b hover:bg-muted/10 transition-colors">
                            <td className="p-3 font-mono text-xs">
                            <div className="font-bold">{v.horaEntrada}</div>
                            {v.horaSalida && <div className="text-muted-foreground">{v.horaSalida}</div>}
                            </td>
                            <td className="p-3">
                            <div className="font-medium">{v.nombre}</div>
                            <div className="text-xs text-muted-foreground">{v.documento}</div>
                            </td>
                            <td className="p-3">
                            <span className="font-medium bg-secondary/30 px-2 py-1 rounded text-xs">
                                {v.unidad}
                            </span>
                            </td>
                            <td className="p-3 text-xs">
                            <div className="capitalize">{v.tipo}</div>
                            {v.placa && <div className="font-mono text-muted-foreground">{v.placa}</div>}
                            </td>
                            <td className="p-3">
                            <span className={`text-xs px-2 py-1 rounded-full border ${
                                v.estado === 'ACTIVO' 
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                : v.estado === 'PENDIENTE'
                                ? 'bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                            }`}>
                                {v.estado}
                            </span>
                            </td>
                            <td className="p-3">
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7"
                                    onClick={() => handleViewQr(v)}
                                    title="Ver QR"
                                >
                                    <IconQrcode className="size-4" />
                                </Button>
                                {v.estado === 'ACTIVO' && (
                                    <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-7 text-xs border-red-200 hover:bg-red-50 hover:text-red-600"
                                    onClick={() => registrarSalida(v.id)}
                                    >
                                    Salida
                                    </Button>
                                )}
                                {v.estado === 'PENDIENTE' && (
                                    <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-7 text-xs border-green-200 hover:bg-green-50 hover:text-green-600"
                                    onClick={() => {
                                        handleUpdateVisitante(v.id, {
                                            horaEntrada: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                            estado: "ACTIVO"
                                        });
                                    }}
                                    >
                                    Aprobar
                                    </Button>
                                )}
                            </div>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                    )}
                </div>
                </CardContent>
            </Card>
            </div>
        </TabsContent>

        {/* SCAN QR TAB */}
        <TabsContent value="scan">
            <Card className="max-w-md mx-auto text-center py-8 animate-in fade-in zoom-in-95 duration-300">
            <CardContent className="flex flex-col items-center gap-6">
                <div className="size-64 bg-black rounded-xl overflow-hidden relative border-4 border-muted">
                    <Scanner 
                        onScan={handleScan}
                        styles={{ container: { width: '100%', height: '100%' } }}
                    />
                    <div className="absolute inset-0 pointer-events-none border-2 border-white/30 rounded-xl">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-emerald-500 rounded-lg animate-pulse" />
                    </div>
                </div>
                
                <div className="space-y-2 w-full max-w-xs">
                <Label>O ingrese el código manualmente</Label>
                <div className="flex gap-2">
                    <Input placeholder="Código de acceso..." />
                    <Button><IconCheck className="size-4" /></Button>
                </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 text-left w-full">
                <p className="font-semibold mb-1">Nota:</p>
                <p>Al escanear un código válido, el visitante se registrará automáticamente en la minuta y se mostrarán sus datos para confirmación.</p>
                </div>
            </CardContent>
            </Card>
        </TabsContent>

        {/* SHARE TAB */}
        <TabsContent value="compartir">
            <Card className="max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-300">
            <CardHeader>
                <CardTitle>Enviar Formulario de Pre-registro</CardTitle>
                <CardDescription>
                Envía un enlace al visitante para que complete sus datos anticipadamente.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-2 p-4 bg-muted rounded-lg border">
                <code className="flex-1 text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                    {typeof window !== 'undefined' ? `${window.location.origin}/pre-registro?subdomain=${subdomain || 'demo'}` : ''}
                </code>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                        const url = `${window.location.origin}/pre-registro?subdomain=${subdomain || 'demo'}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Enlace copiado");
                    }}
                >
                    <IconShare className="size-4" />
                </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 hover:bg-green-50 hover:text-green-600 hover:border-green-200" onClick={() => {
                     const url = `${window.location.origin}/pre-registro?subdomain=${subdomain || 'demo'}`;
                     window.open(`https://wa.me/?text=${encodeURIComponent(`Hola, por favor regístrate para tu visita aquí: ${url}`)}`, '_blank');
                }}>
                    <IconBrandWhatsapp className="size-8" />
                    <span>Enviar por WhatsApp</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" onClick={() => {
                    const url = `${window.location.origin}/pre-registro?subdomain=${subdomain || 'demo'}`;
                    window.location.href = `mailto:?subject=Registro de Visita&body=${encodeURIComponent(`Hola, por favor regístrate para tu visita aquí: ${url}`)}`;
                }}>
                    <IconMail className="size-8" />
                    <span>Enviar por Email</span>
                </Button>
                </div>
            </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      {/* QR Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle>Acceso Generado</DialogTitle>
            <DialogDescription>
              Escanea este código o compártelo con el visitante
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <div className="bg-white p-4 rounded-xl shadow-inner border">
              {/* Using a reliable QR code API */}
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&color=000000&bgcolor=ffffff`}
                alt="QR Code" 
                className="size-48 object-contain"
              />
            </div>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Visitante:</strong> {qrInfo?.nombre}</p>
            <p><strong>Destino:</strong> {qrInfo?.unidad}</p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button variant="secondary" onClick={() => setQrDialogOpen(false)}>
              Cerrar
            </Button>
            <Button onClick={() => window.print()}>
              Imprimir / Compartir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}