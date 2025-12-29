"use client";

import { useState } from "react";
import * as z from "zod";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useSubdomain } from "@/app/providers/subdomain-provider";
import { getAxiosInstance } from "@/lib/axios-config";
import { AuthLayout } from "./auth-layout";
import { useRouter } from "next/navigation";

const loginSchema = z.object({
  email: z
    .string()
    .email("Correo electrónico inválido")
    .min(1, "El correo es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export default function Login() {
  const { subdomain } = useSubdomain();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const router = useRouter();

  const validate = (): boolean => {
    try {
      loginSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.issues.forEach((issue) => {
          if (issue.path[0] === "email") {
            fieldErrors.email = issue.message;
          }
          if (issue.path[0] === "password") {
            fieldErrors.password = issue.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const axiosInstance = getAxiosInstance(subdomain);

      // Determinar el endpoint según si hay subdomain
      // Si no hay subdomain: usar /superadmin/login
      // Si hay subdomain: usar /condominios/login
      const endpoint = !subdomain ? "/superadmin/login" : "/condominios/login";

      const response = await axiosInstance.post(endpoint, {
        email,
        password,
      });

      toast.success("¡Login exitoso!", {
        duration: 2000,
      });
      
      // Usar window.location para forzar una recarga completa y que el middleware detecte la cookie
      // Pequeño delay para asegurar que la cookie se guarde
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
      
      console.log("Login response:", response.data);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Error al hacer login";

      toast.error(errorMessage, {
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Inicia sesión en tu cuenta"
      subtitle="Ingresa tus datos para iniciar sesión"
    >
      <form onSubmit={onSubmit}>
        <FieldGroup className="py-4">
          {/* Email Field */}
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="login-email" className="text-sm font-medium text-zinc-700 dark:text-zinc-700">
              Correo electrónico
            </FieldLabel>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                id="login-email"
                type="email"
                placeholder="Ingresa tu correo electrónico"
                className="pl-10 py-6"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors({ ...errors, email: undefined });
                  }
                }}
                required
              />
            </div>
            {errors.email && (
              <FieldError>{errors.email}</FieldError>
            )}
          </Field>

          {/* Password Field */}
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="login-password" className="text-sm font-medium text-zinc-700 dark:text-zinc-700">
              Contraseña
            </FieldLabel>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Ingresa tu contraseña"
                className="pl-10 pr-10 py-6"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors({ ...errors, password: undefined });
                  }
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <FieldError>{errors.password}</FieldError>
            )}
          </Field>

          {/* Forgot Password */}
          <div className="flex items-end justify-end">
            <a
              href="#"
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-600"
            >
              Olvidé mi contraseña
            </a>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5"
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
        </FieldGroup>
      </form>

      {/* Terms */}
      <p className="text-xs text-zinc-500 dark:text-zinc-500 text-center">
        Al iniciar sesión, aceptas nuestras{" "}
        <a
          href="#"
          className="underline hover:text-zinc-700 dark:hover:text-zinc-700"
        >
          Condiciones de uso
        </a>
      </p>
    </AuthLayout>
  );
}
