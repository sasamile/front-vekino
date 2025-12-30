"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldSet,
} from "@/components/ui/field";
import { IconX, IconUpload } from "@tabler/icons-react";
import type { Usuario } from "@/types/users";

interface EditUsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario | null;
  onSave: (formData: FormData) => Promise<void>;
}

const ROLES = [
  { value: "ADMIN", label: "Administrador" },
  { value: "PROPIETARIO", label: "Propietario" },
  { value: "ARRENDATARIO", label: "Arrendatario" },
  { value: "RESIDENTE", label: "Residente" },
];

const TIPO_DOCUMENTO = [
  { value: "CC", label: "Cédula de Ciudadanía" },
  { value: "CE", label: "Cédula de Extranjería" },
  { value: "PASAPORTE", label: "Pasaporte" },
  { value: "TI", label: "Tarjeta de Identidad" },
];

const ROLES_REQUIREN_UNIDAD = ["PROPIETARIO", "ARRENDATARIO", "RESIDENTE"];

export function EditUsuarioDialog({
  open,
  onOpenChange,
  usuario,
  onSave,
}: EditUsuarioDialogProps) {
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [tipoDocumento, setTipoDocumento] = useState<string>("");
  const [numeroDocumento, setNumeroDocumento] = useState<string>("");
  const [unidadId, setUnidadId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (usuario) {
      // Dividir el nombre completo en firstName y lastName
      const nameParts = usuario.name.split(" ");
      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(" ") || "");
      setSelectedRole(usuario.role);
      setImagePreview(usuario.image || null);
      setRemoveImage(false);
      setImageFile(null);
      setTipoDocumento(usuario.tipoDocumento || "");
      setNumeroDocumento(usuario.numeroDocumento || usuario.identificationNumber || "");
      setUnidadId(usuario.unidadId || "");
      setEmail(usuario.email || "");
    }
  }, [usuario, open]);

  useEffect(() => {
    if (!open) {
      setImageFile(null);
      setImagePreview(null);
      setRemoveImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith("image/")) {
        return;
      }
      setImageFile(file);
      setRemoveImage(false);
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  if (!usuario) return null;

  const isRoleRequiringUnidad = ROLES_REQUIREN_UNIDAD.includes(selectedRole);
  const showUnidadFields = isRoleRequiringUnidad;

  // Validar campos requeridos según el rol
  const formIsValid = (() => {
    // Email y rol siempre son requeridos
    if (!email.trim() || !selectedRole) return false;

    if (selectedRole === "ADMIN") {
      // Para ADMIN: solo se requiere name (construido con firstName o firstName + lastName)
      // tipoDocumento y numeroDocumento son opcionales para ADMIN
      return firstName.trim().length > 0;
    } else {
      // Para otros roles: firstName, lastName, tipoDocumento, numeroDocumento, unidadId son requeridos
      return (
        firstName.trim().length > 0 &&
        lastName.trim().length > 0 &&
        tipoDocumento.trim().length > 0 &&
        numeroDocumento.trim().length > 0 &&
        unidadId.trim().length > 0
      );
    }
  })();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);

      // Asegurar que el email siempre esté incluido
      formData.set("email", email);

      // Construir el campo name con firstName y lastName
      const fullName = lastName ? `${firstName} ${lastName}`.trim() : firstName;
      formData.append("name", fullName);

      // Para ADMIN: incluir campos de documento pero no unidad
      if (selectedRole === "ADMIN") {
        // Para ADMIN, enviamos name, email, role, active, telefono, tipoDocumento, numeroDocumento
        // No incluimos firstName, lastName, unidadId
        formData.delete("firstName");
        formData.delete("lastName");
        formData.delete("unidadId");
        // Incluir documentos si tienen valor
        if (tipoDocumento) {
          formData.append("tipoDocumento", tipoDocumento);
        }
        if (numeroDocumento) {
          formData.append("numeroDocumento", numeroDocumento);
        }
      } else {
        // Para otros roles: incluir firstName, lastName, documentos y unidadId
        // Primero eliminar cualquier valor previo y luego agregar los nuevos
        formData.delete("firstName");
        formData.delete("lastName");
        formData.append("firstName", firstName);
        formData.append("lastName", lastName || "");
        formData.append("tipoDocumento", tipoDocumento);
        formData.append("numeroDocumento", numeroDocumento);
        formData.append("unidadId", unidadId);
      }

      // Manejar active (ya viene como string "true" o "false" del radio)
      const activeValue = formData.get("active");
      formData.set("active", activeValue === "true" ? "true" : "false");

      // El endpoint PUT no admite el campo password en la actualización
      // Eliminamos siempre el campo password del FormData
      formData.delete("password");

      // Manejar imagen
      if (imageFile) {
        formData.append("image", imageFile);
      }

      // Eliminar campos vacíos
      for (const [key, value] of formData.entries()) {
        if (value === "" || value === null) {
          formData.delete(key);
        }
      }

      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !loading && onOpenChange(open)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Modifica la información del usuario
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="firstName">
                  Nombre {showUnidadFields && "*"}
                </FieldLabel>
                <Input
                  id="firstName"
                  name="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required={showUnidadFields}
                  disabled={loading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="lastName">
                  Apellido {showUnidadFields && "*"}
                </FieldLabel>
                <Input
                  id="lastName"
                  name="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required={showUnidadFields}
                  disabled={loading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="telefono">Teléfono</FieldLabel>
                <Input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  defaultValue={usuario.telefono || ""}
                  disabled={loading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="tipoDocumento">
                  Tipo de Documento {showUnidadFields && "*"}
                </FieldLabel>
                <select
                  id="tipoDocumento"
                  name="tipoDocumento"
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  required={showUnidadFields}
                  disabled={loading}
                >
                  <option value="">Seleccionar...</option>
                  {TIPO_DOCUMENTO.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="numeroDocumento">
                  Número de Documento {showUnidadFields && "*"}
                </FieldLabel>
                <Input
                  id="numeroDocumento"
                  name="numeroDocumento"
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  required={showUnidadFields}
                  disabled={loading}
                />
              </Field>
              {showUnidadFields && (
                <Field>
                  <FieldLabel htmlFor="unidadId">Unidad ID *</FieldLabel>
                  <Input
                    id="unidadId"
                    name="unidadId"
                    value={unidadId}
                    onChange={(e) => setUnidadId(e.target.value)}
                    placeholder="UUID de la unidad"
                    required={showUnidadFields}
                    disabled={loading}
                  />
                  <FieldDescription>
                    ID de la unidad asignada al usuario
                  </FieldDescription>
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor="role">Rol</FieldLabel>
                <select
                  id="role"
                  name="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  disabled={loading}
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Campo de Imagen */}
            <Field>
              <FieldLabel>Foto de Perfil</FieldLabel>
              {imagePreview && !removeImage ? (
                <div className="space-y-2">
                  <div className="relative inline-block">
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="size-24 object-cover rounded-2xl border-2 border-input"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 rounded-full size-6"
                        onClick={handleRemoveImage}
                      >
                        <IconX className="size-3" />
                      </Button>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
             
                </div>
              ) : (
                <div
                  onClick={handleFileClick}
                  className="border-2 border-dashed border-input rounded-lg p-6 text-center cursor-pointer hover:bg-accent transition-colors"
                >
                  <IconUpload className="size-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Haz clic para subir una foto
                  </p>
                  <p className="text-xs text-muted-foreground">
                    o arrastra y suelta un archivo aquí
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}
              <FieldDescription>
                Opcional. Formatos soportados: JPG, PNG, GIF. Tamaño máximo: 5MB
              </FieldDescription>
            </Field>

            <FieldSet>
              <FieldLabel>Estado</FieldLabel>
              <FieldGroup className="flex flex-col gap-2">
                <Field orientation="horizontal">
                  <input
                    type="radio"
                    id="active-true"
                    name="active"
                    value="true"
                    defaultChecked={usuario.active}
                    className="size-4"
                    required
                    disabled={loading}
                  />
                  <FieldLabel htmlFor="active-true" className="font-normal">
                    Activo
                  </FieldLabel>
                </Field>
                <Field orientation="horizontal">
                  <input
                    type="radio"
                    id="active-false"
                    name="active"
                    value="false"
                    defaultChecked={!usuario.active}
                    className="size-4"
                    required
                    disabled={loading}
                  />
                  <FieldLabel htmlFor="active-false" className="font-normal">
                    Inactivo
                  </FieldLabel>
                </Field>
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formIsValid}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
