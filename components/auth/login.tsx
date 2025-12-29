"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, CreditCard } from "lucide-react";
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

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { subdomain } = useSubdomain();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);

    try {
      const axiosInstance = getAxiosInstance(subdomain);

      // Determinar el endpoint según si hay subdomain
      // Si no hay subdomain: usar /superadmin/login
      // Si hay subdomain: usar /api/condominios/login
      const endpoint = !subdomain ? "/superadmin/login" : "/condominios/login";

      const response = await axiosInstance.post(endpoint, {
        email: data.email,
        password: data.password,
      });

      toast.success("¡Login exitoso!", {
        duration: 3000,
      });
      router.push("/");
      // Opcional: redirigir o manejar el éxito
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

  const handleSmartCardLogin = () => {
    // TODO: Implementar login con SmartCard
    toast("Login con SmartCard próximamente", {
      icon: "ℹ️",
      duration: 3000,
    });
  };

  return (
    <AuthLayout
      title="Inicia sesión en tu cuenta"
      subtitle="Ingresa tus datos para iniciar sesión"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-zinc-700 dark:text-zinc-700">
                  Correo electrónico
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                      type="email"
                      placeholder="Ingresa tu correo electrónico"
                      className="pl-10 py-5"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password Field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-zinc-700 dark:text-zinc-700">
                  Contraseña
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                      type="password"
                      placeholder="Ingresa tu contraseña"
                      className="pl-10 py-5"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
        </form>
      </Form>

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
