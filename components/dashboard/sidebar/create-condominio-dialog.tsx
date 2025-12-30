"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import toast from "react-hot-toast"
import { useQueryClient } from "@tanstack/react-query"
import { useDebounce } from "@/hooks/use-debounce"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import { getAxiosInstance } from "@/lib/axios-config"
import { useSubdomain } from "@/app/providers/subdomain-provider"
import { Upload, X } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

const condominioSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  nit: z.string().min(1, "El NIT es requerido"),
  address: z.string().min(1, "La dirección es requerida"),
  city: z.string().min(1, "La ciudad es requerida"),
  country: z.string().min(1, "El país es requerido"),
  timezone: z.string().min(1, "El timezone es requerido"),
  subdomain: z.string().min(1, "El subdominio es requerido"),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido (debe ser hexadecimal)"),
  subscriptionPlan: z.enum(["BASICO", "PRO", "ENTERPRISE"]),
  unitLimit: z.number().min(1, "El límite de unidades debe ser mayor a 0"),
  planExpiresAt: z.string().min(1, "La fecha de expiración es requerida"),
  activeModules: z.array(z.string()).min(1, "Selecciona al menos un módulo"),
  logo: z.instanceof(File, { message: "El logo es requerido" }),
})

type CondominioFormData = z.infer<typeof condominioSchema>

const TIMEZONES = [
  { value: "AMERICA_BOGOTA", label: "Bogotá (Colombia)" },
  { value: "AMERICA_MEXICO_CITY", label: "Ciudad de México" },
  { value: "AMERICA_LIMA", label: "Lima (Perú)" },
  { value: "AMERICA_SANTIAGO", label: "Santiago (Chile)" },
  { value: "AMERICA_BUENOS_AIRES", label: "Buenos Aires (Argentina)" },
  { value: "AMERICA_SAO_PAULO", label: "São Paulo (Brasil)" },
]

const MODULES = [
  { value: "reservas", label: "Reservas" },
  { value: "documentos", label: "Documentos" },
  { value: "pqrs", label: "PQRS" },
]

const SUBSCRIPTION_PLANS = [
  { value: "BASICO", label: "Básico" },
  { value: "PRO", label: "Pro" },
  { value: "ENTERPRISE", label: "Enterprise" },
]

interface CreateCondominioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCondominioDialog({
  open,
  onOpenChange,
}: CreateCondominioDialogProps) {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [subdomainStatus, setSubdomainStatus] = useState<{
    checking: boolean
    available: boolean | null
    suggested?: string
  }>({ checking: false, available: null })

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<CondominioFormData>({
    resolver: zodResolver(condominioSchema),
    defaultValues: {
      subscriptionPlan: "BASICO",
      primaryColor: "#238af0",
      activeModules: [],
      unitLimit: 100,
    },
  })

  const activeModules = watch("activeModules") || []
  const subdomainValue = watch("subdomain") || ""
  const primaryColorValue = watch("primaryColor")
  const debouncedSubdomain = useDebounce(subdomainValue, 500)

  // Validar subdominio en tiempo real
  useEffect(() => {
    if (!debouncedSubdomain || debouncedSubdomain.length < 2) {
      setSubdomainStatus({ checking: false, available: null })
      return
    }

    const validateSubdomain = async () => {
      setSubdomainStatus({ checking: true, available: null })
      try {
        const axiosInstance = getAxiosInstance(null)
        const response = await axiosInstance.get(
          `/condominios/validate-subdomain/${debouncedSubdomain}`
        )
        
        setSubdomainStatus({
          checking: false,
          available: response.data.available,
          suggested: response.data.subdomain,
        })

        if (!response.data.available && response.data.subdomain) {
          // El subdominio no está disponible, pero hay una sugerencia
          // No actualizamos automáticamente, solo mostramos el mensaje
        }
      } catch (err: any) {
        setSubdomainStatus({ checking: false, available: null })
      }
    }

    validateSubdomain()
  }, [debouncedSubdomain])

  // Resetear preview cuando se cierra el dialog
  useEffect(() => {
    if (!open) {
      setLogoPreview(null)
      setSubdomainStatus({ checking: false, available: null })
    }
  }, [open])

  const onSubmit = async (data: CondominioFormData) => {
    setLoading(true)

    try {
      const axiosInstance = getAxiosInstance(null) // Usar el backend principal para crear condominios

      const formData = new FormData()
      formData.append("name", data.name)
      formData.append("nit", data.nit)
      formData.append("address", data.address)
      formData.append("city", data.city)
      formData.append("country", data.country)
      formData.append("timezone", data.timezone)
      formData.append("subdomain", data.subdomain)
      formData.append("primaryColor", data.primaryColor)
      formData.append("subscriptionPlan", data.subscriptionPlan)
      formData.append("unitLimit", data.unitLimit.toString())
      formData.append("planExpiresAt", data.planExpiresAt)
      formData.append("activeModules", JSON.stringify(data.activeModules))
      formData.append("logo", data.logo)

      await axiosInstance.post("/condominios", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      toast.success("Condominio creado exitosamente", {
        duration: 3000,
      })

      // Invalidar y revalidar las queries para actualizar los datos
      await queryClient.invalidateQueries({ queryKey: ["condominios"] })
      await queryClient.invalidateQueries({ queryKey: ["domains"] })

      reset()
      setLogoPreview(null)
      setSubdomainStatus({ checking: false, available: null })
      onOpenChange(false)
      if(pathname.includes("/condominios")) {
        router.refresh()
      }else{
        router.push("/condominios")
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Error al crear condominio"

      toast.error(errorMessage, {
        duration: 4000,
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleModule = useCallback((module: string) => {
    const current = activeModules || []
    
    if (current.includes(module)) {
      setValue("activeModules", current.filter((m) => m !== module), { shouldValidate: true, shouldDirty: true })
    } else {
      setValue("activeModules", [...current, module], { shouldValidate: true, shouldDirty: true })
    }
  }, [activeModules, setValue])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor, selecciona solo archivos de imagen")
        e.target.value = ""
        return
      }

      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("El archivo es demasiado grande. Máximo 5MB")
        e.target.value = ""
        return
      }

      setValue("logo", file, { shouldValidate: true })

      // Crear preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setLogoPreview(null)
    // Resetear el input file
    const fileInput = document.getElementById("logo-input") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
    // Resetear el valor del formulario usando un File vacío temporalmente
    // y luego forzar la validación
    setValue("logo", undefined as any, { shouldValidate: false })
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !loading && onOpenChange(open)} >
      <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${loading ? "cursor-not-allowed" : ""}`} >
        <DialogHeader>
          <DialogTitle>Crear Nuevo Condominio</DialogTitle>
          <DialogDescription>
            Completa el formulario para crear un nuevo condominio en el sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className={loading ? "cursor-not-allowed" : ""} >
          <FieldGroup className="space-y-4">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Información Básica
              </h3>

              <Field data-invalid={!!errors.name}>
                <FieldLabel>Nombre del Condominio *</FieldLabel>
                <Input
                disabled={loading}
                  {...register("name")}
                  placeholder="Ej: Condominio Las Flores "
                />
                {errors.name && <FieldError>{errors.name.message}</FieldError>}
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field data-invalid={!!errors.nit}>
                  <FieldLabel>NIT *</FieldLabel>
                  <Input
                    disabled={loading}
                    {...register("nit")}
                    placeholder="123456789"
                  />
                  {errors.nit && <FieldError>{errors.nit.message}</FieldError>}
                </Field>

                <Field data-invalid={!!errors.subdomain || (subdomainStatus.available === false)}>
                  <FieldLabel>Subdominio *</FieldLabel>
                  <div className="space-y-2">
                    <Input
                      disabled={loading}
                      {...register("subdomain")}
                      placeholder="condominio"
                    />
                    {subdomainStatus.checking && (
                      <FieldDescription className="text-sm text-muted-foreground">
                        Verificando disponibilidad...
                      </FieldDescription>
                    )}
                    {!subdomainStatus.checking && subdomainStatus.available === false && (
                      <FieldError>
                        Este subdominio no está disponible.
                        {subdomainStatus.suggested && (
                          <span className="block mt-1">
                            Sugerencia: {subdomainStatus.suggested}
                          </span>
                        )}
                      </FieldError>
                    )}
                    {!subdomainStatus.checking && subdomainStatus.available === true && (
                      <FieldDescription className="text-sm text-green-600 dark:text-green-400">
                        ✓ Subdominio disponible
                      </FieldDescription>
                    )}
                    {errors.subdomain && (
                      <FieldError>{errors.subdomain.message}</FieldError>
                    )}
                  </div>
                </Field>
              </div>
            </div>

            {/* Ubicación */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Ubicación
              </h3>

              <Field data-invalid={!!errors.address}>
                <FieldLabel>Dirección *</FieldLabel>
                <Input 
                  disabled={loading}
                  {...register("address")}
                  placeholder="Calle 123 #45-67"
                />
                {errors.address && (
                  <FieldError>{errors.address.message}</FieldError>
                )}
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field data-invalid={!!errors.city}>
                  <FieldLabel>Ciudad *</FieldLabel>
                  <Input
                    disabled={loading}
                    {...register("city")}
                    placeholder="Bogotá"
                  />
                  {errors.city && <FieldError>{errors.city.message}</FieldError>}
                </Field>

                <Field data-invalid={!!errors.country}>
                  <FieldLabel>País *</FieldLabel>
                  <Input
                    disabled={loading}
                    {...register("country")}
                    placeholder="Colombia"
                  />
                  {errors.country && (
                    <FieldError>{errors.country.message}</FieldError>
                  )}
                </Field>
              </div>

              <Field data-invalid={!!errors.timezone}>
                <FieldLabel>Zona Horaria *</FieldLabel>
                <select
                  disabled={loading}
                  {...register("timezone")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecciona una zona horaria</option>
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                {errors.timezone && (
                  <FieldError>{errors.timezone.message}</FieldError>
                )}
              </Field>
            </div>

            {/* Configuración */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Configuración
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <Field data-invalid={!!errors.subscriptionPlan}>
                  <FieldLabel>Plan de Suscripción *</FieldLabel>
                  <select
                    disabled={loading}
                    {...register("subscriptionPlan")}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {SUBSCRIPTION_PLANS.map((plan) => (
                      <option key={plan.value} value={plan.value}>
                        {plan.label}
                      </option>
                    ))}
                  </select>
                  {errors.subscriptionPlan && (
                    <FieldError>{errors.subscriptionPlan.message}</FieldError>
                  )}
                </Field>

                <Field data-invalid={!!errors.unitLimit}>
                  <FieldLabel>Límite de Unidades *</FieldLabel>
                  <Input
                    disabled={loading}
                    type="number"
                    {...register("unitLimit", { valueAsNumber: true })}
                    placeholder="100"
                    min={1}
                  />
                  {errors.unitLimit && (
                    <FieldError>{errors.unitLimit.message}</FieldError>
                  )}
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field data-invalid={!!errors.primaryColor}>
                  <FieldLabel>Color Primario *</FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      disabled={loading}
                      type="color"
                      value={primaryColorValue || "#238af0"}
                      onChange={(e) => {
                        setValue("primaryColor", e.target.value, { shouldValidate: true })
                      }}
                      className="h-9 w-20 p-1 cursor-pointer"
                    />
                    <Input  
                      disabled={loading}
                      value={primaryColorValue || "#238af0"}
                      onChange={(e) => {
                        setValue("primaryColor", e.target.value, { shouldValidate: true })
                      }}
                      placeholder="#238af0"
                      className="flex-1"
                    />
                  </div>
                  {errors.primaryColor && (
                    <FieldError>{errors.primaryColor.message}</FieldError>
                  )}
                </Field>

                <Field data-invalid={!!errors.planExpiresAt}>
                  <FieldLabel>Fecha de Expiración del Plan *</FieldLabel>
                  <Input
                    disabled={loading}
                    type="datetime-local"
                    {...register("planExpiresAt")}
                  />
                  {errors.planExpiresAt && (
                    <FieldError>{errors.planExpiresAt.message}</FieldError>
                  )}
                </Field>
              </div>
            </div>

            {/* Módulos Activos */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Módulos Activos *
              </h3>
              <Field data-invalid={!!errors.activeModules}>
                <div className="flex flex-col gap-3">
                  {MODULES.map((module) => (
                    <div key={module.value} className="flex items-center gap-2">
                      <Checkbox
                        disabled={loading}
                        checked={activeModules.includes(module.value)}
                        onCheckedChange={() => toggleModule(module.value)}
                      />
                      <FieldLabel className="font-normal cursor-pointer" onClick={() => toggleModule(module.value)}>
                        {module.label}
                      </FieldLabel>
                    </div>
                  ))}
                </div>
                {errors.activeModules && (
                  <FieldError>{errors.activeModules.message}</FieldError>
                )}
              </Field>
            </div>

            {/* Logo */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Logo *
              </h3>
              <Field data-invalid={!!errors.logo}>
                <FieldLabel>Subir Logo (Solo una imagen)</FieldLabel>
                <div className="space-y-3">
                  {!logoPreview ? (
                    <label
                      htmlFor="logo-input"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-input rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="mb-2 text-sm text-foreground">
                          <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Solo una imagen (JPG, PNG, GIF) - Máximo 5MB
                        </p>
                      </div>
                      <input
                        id="logo-input"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative inline-block group">
                        <div className="relative">
                          <img
                            src={logoPreview}
                            alt="Preview del logo"
                            className="max-w-[200px] max-h-[200px] object-contain rounded-md border-2 border-input shadow-sm"
                          />
                          <Button
                            type="button" 
                            disabled={loading}
                            variant="destructive"
                            className="absolute -top-2 -right-2 rounded-full shadow-lg size-6 cursor-pointer"
                            onClick={handleRemoveLogo}
                          >
                            <X className="size-3" />
                            <span className="sr-only">Eliminar imagen</span>
                          </Button>
                        </div>
                      </div>
                    
                    </div>
                  )}
                  <FieldDescription>
                    Solo se puede subir una imagen. Formatos soportados: JPG, PNG, GIF. Tamaño máximo: 5MB
                  </FieldDescription>
                </div>
                {errors.logo && (
                  <FieldError>{errors.logo.message}</FieldError>
                )}
              </Field>
            </div>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                setLogoPreview(null)
                setSubdomainStatus({ checking: false, available: null })
                onOpenChange(false)
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Condominio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

