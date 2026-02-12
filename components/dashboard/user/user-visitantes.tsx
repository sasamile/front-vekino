"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSubdomain } from "@/components/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  IconShare, 
  IconCar, 
  IconId, 
  IconUser,
  IconSearch,
  IconMail,
  IconBrandWhatsapp,
} from "@tabler/icons-react";
import toast from "react-hot-toast";

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

interface UsuarioInfo {
  id: string;
  name: string;
  email: string;
  unidadId?: string;
  unidad?: {
    id: string;
    identificador: string;
    torre?: string;
    piso?: string;
    numero?: string;
  };
}

export default function UserVisitantes() {
  const { subdomain } = useSubdomain();
  
  // Fetch User Info to get Unit
  const { data: userInfo, isLoading: isLoadingUser } = useQuery<UsuarioInfo>({
    queryKey: ["usuario-info-visitantes"],
    queryFn: async () => {
      const axiosInstance = getAxiosInstance(subdomain);
      const response = await axiosInstance.get("/usuario/dashboard");
      return response.data.user;
    },
    enabled: !!subdomain,
  });

  // Form State
  const [formData, setFormData] = useState({
    documento: "",
    nombre: "",
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
  
  // Share URL State
  const [shareUrl, setShareUrl] = useState("");

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

  // Update Share URL
  useEffect(() => {
    if (typeof window !== 'undefined' && userInfo?.unidadId) {
        setShareUrl(`${window.location.origin}/pre-registro?unidad=${userInfo.unidadId}`);
    }
  }, [userInfo?.unidadId]);

  // Save helper
  const saveVisitantes = (newVisitantes: Visitante[]) => {
    setVisitantes(newVisitantes);
    localStorage.setItem("vekino_visitantes", JSON.stringify(newVisitantes));
  };
  
  // Create Handler
  const handleCreateVisitante = async (nuevoVisitante: Partial<Visitante>, showQr = true) => {
      if (!userInfo?.unidadId) {
        toast.error("No se pudo identificar tu unidad");
        return;
      }

      const newV: Visitante = {
        id: nuevoVisitante.id || Date.now().toString(),
        documento: nuevoVisitante.documento!,
        nombre: nuevoVisitante.nombre!,
        unidad: userInfo.unidad?.identificador || "",
        unidadId: userInfo.unidadId,
        tipo: nuevoVisitante.tipo || "visitante",
        placa: nuevoVisitante.placa,
        // Si lo crea el usuario, podría ser PENDIENTE hasta que llegue a portería, 
        // pero para mantener consistencia con el guardia, lo dejaremos igual o ACTIVO.
        // Dado que es un "pre-registro" para que ingresen, ACTIVO o PENDIENTE funciona.
        // Asumiremos PENDIENTE si es pre-registro del usuario, o ACTIVO si queremos que ya aparezca autorizado.
        // El guardia usa ACTIVO para "Ya ingresó". PENDIENTE sería "Autorizado para ingresar".
        // Vamos a usar PENDIENTE para diferenciar que aun no ha ingresado fisicamente si quisieramos, 
        // pero el codigo del guardia usa ACTIVO para todo lo que entra. 
        // Si el usuario lo crea, es una AUTORIZACION.
        horaEntrada: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        horaSalida: undefined,
        estado: "PENDIENTE", 
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
        toast.success("Visitante autorizado y QR generado");
      } else {
         toast.success(`Ingreso autorizado: ${newV.nombre}`);
      }
      
      // Reset form
      setFormData({
        documento: "",
        nombre: "",
        tipo: "visitante",
        placa: "",
      });
  };

  // Update Handler
  const handleUpdateVisitante = async (id: string, data: Partial<Visitante>) => {
      const updatedList = visitantes.map(v => v.id === id ? { ...v, ...data } : v);
      saveVisitantes(updatedList);
      toast.success("Actualizado correctamente");
  };

  // Filter Logic - Only show visitors for THIS user's unit
  const filteredVisitantes = visitantes.filter(v => {
    // Filter by Unit
    if (v.unidadId !== userInfo?.unidadId) return false;

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

  const generarQR = () => {
    if (!formData.documento || !formData.nombre) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    if (!userInfo?.unidadId) {
        toast.error("No se ha cargado la información de tu unidad");
        return;
    }

    const nuevoVisitante = {
      documento: formData.documento,
      nombre: formData.nombre,
      tipo: formData.tipo,
      placa: formData.placa,
    };

    handleCreateVisitante(nuevoVisitante);
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

  if (isLoadingUser) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
        </div>
        
        {/* Tabs Skeleton */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-1/2 rounded-md" />
            <Skeleton className="h-10 w-1/2 rounded-md" />
          </div>
          
          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Card Skeleton */}
            <Card className="lg:col-span-1 border-primary/20 shadow-lg h-fit">
              <CardHeader className="bg-primary/5 border-b">
                <div className="flex items-center gap-2 pt-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-4 w-40 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full rounded-md mt-4" />
              </CardContent>
            </Card>
            
            {/* Table Card Skeleton */}
            <Card className="lg:col-span-2 h-full shadow-lg border-muted/60 flex flex-col">
              <CardHeader className="border-b bg-muted/5 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-48 rounded-md" />
                    <Skeleton className="h-9 w-32 rounded-md" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto h-[500px] p-4 space-y-3">
                  {/* Header skeleton */}
                  <div className="grid grid-cols-5 gap-4 pb-3 border-b">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-4 w-full" />
                    ))}
                  </div>
                  {/* Rows skeleton */}
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="grid grid-cols-5 gap-4 py-3 border-b">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-8 w-20 rounded-full mx-auto" />
                      <Skeleton className="h-8 w-8 rounded-md mx-auto" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!userInfo?.unidadId) {
    return (
        <div className="p-8 text-center">
            <h2 className="text-xl font-bold text-red-600">Error de Configuración</h2>
            <p>No tienes una unidad asignada. Contacta al administrador.</p>
        </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Mis Visitantes</h1>
          <p className="text-muted-foreground mt-1">Registra y gestiona el acceso a tu unidad {userInfo.unidad?.identificador}</p>
        </div>
      </div>

      <Tabs defaultValue="registro" className="w-full mb-8">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="registro" className="flex items-center gap-2">
                <IconUser className="size-4" />
                <span className="hidden sm:inline">Nuevo Visitante</span>
                <span className="sm:hidden">Registro</span>
            </TabsTrigger>
            <TabsTrigger value="compartir" className="flex items-center gap-2">
                <IconShare className="size-4" />
                <span className="hidden sm:inline">Enviar Pre-registro</span>
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
                    Autorizar Ingreso
                </CardTitle>
                <CardDescription>
                    Datos del visitante
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
                    Autorizar y Generar QR
                </Button>
                </CardContent>
            </Card>

            {/* Minuta Table */}
            <Card className="lg:col-span-2 h-full shadow-lg border-muted/60 flex flex-col">
                <CardHeader className="border-b bg-muted/5 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Historial de Visitas</CardTitle>
                      <CardDescription>Registro de accesos a tu unidad</CardDescription>
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
                        <div className="p-4">
                          {/* Header skeleton */}
                          <div className="grid grid-cols-5 gap-4 pb-3 border-b mb-3">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                          {/* Rows skeleton */}
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="grid grid-cols-5 gap-4 py-3 border-b">
                              <div className="space-y-1">
                                <Skeleton className="h-3 w-12" />
                                <Skeleton className="h-3 w-10" />
                              </div>
                              <div className="space-y-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                              <div className="space-y-1">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-3 w-16" />
                              </div>
                              <div className="flex items-center justify-start">
                                <Skeleton className="h-6 w-20 rounded-full" />
                              </div>
                              <div className="flex items-center justify-start">
                                <Skeleton className="h-7 w-7 rounded-md" />
                              </div>
                            </div>
                          ))}
                        </div>
                    ) : filteredVisitantes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No se encontraron registros</div>
                    ) : (
                    <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium">Hora</th>
                        <th className="text-left p-3 font-medium">Visitante</th>
                        <th className="text-left p-3 font-medium">Tipo</th>
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
                            <td className="p-3 text-xs">
                            <div className="capitalize">{v.tipo}</div>
                            {v.placa && <div className="font-mono text-muted-foreground">{v.placa}</div>}
                            </td>
                            <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                ${v.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 
                                  v.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-700' : 
                                  'bg-gray-100 text-gray-700'}`}>
                                {v.estado}
                            </span>
                            </td>
                            <td className="p-3">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7"
                                    onClick={() => handleViewQr(v)}
                                    title="Ver QR"
                                >
                                    <IconQrcode className="size-4" />
                                </Button>
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
                    {shareUrl || "Generando enlace..."}
                </code>
                <Button variant="outline" size="sm" onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Enlace copiado");
                }} disabled={!shareUrl}>
                    Copiar
                </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                <Button className="w-full bg-[#25D366] hover:bg-[#128C7E]" onClick={() => {
                     window.open(`https://wa.me/?text=${encodeURIComponent(`Hola, regístrate para tu visita a mi unidad ${userInfo?.unidad?.identificador} aquí: ${shareUrl}`)}`, '_blank');
                }} disabled={!shareUrl}>
                    <div className="flex items-center justify-center gap-2">
                        <IconBrandWhatsapp className="size-5" />
                        <span>Enviar por WhatsApp</span>
                    </div>
                </Button>
                
                <Button variant="outline" className="w-full" onClick={() => {
                    window.location.href = `mailto:?subject=Registro de Visita&body=${encodeURIComponent(`Hola, por favor regístrate para tu visita aquí: ${shareUrl}`)}`;
                }} disabled={!shareUrl}>
                    <IconMail className="size-4 mr-2" />
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
            <DialogTitle>Acceso Autorizado</DialogTitle>
            <DialogDescription>
              Comparte este código con tu visitante
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <div className="bg-white p-4 rounded-xl shadow-inner border">
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
            <Button onClick={() => {
                // Share functionality if supported, otherwise print/copy
                if (navigator.share) {
                    navigator.share({
                        title: 'Código de Acceso',
                        text: `Código de acceso para ${qrInfo?.nombre}`,
                        url: window.location.href
                    }).catch(console.error);
                } else {
                    window.print();
                }
            }}>
              Compartir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
