"use client";

import { ReactNode } from "react";
import Logo from "../common/logo";
import { useCondominio } from "@/components/providers/condominio-provider";

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-screen flex">
      {/* Left Panel - Login Form (55%) */}
      <div className="w-full  flex flex-col gap-8 items-center justify-center bg-linear-to-b to-primary/50 from-70% from-white p-8 lg:p-12">
        <Logo />

        <div className="w-full max-w-md space-y-6 bg-muted/90 backdrop-blur-sm rounded-2xl p-8">
          {/* Logo */}

          {/* Title */}
          {title && (
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-semibold text-black dark:text-zinc-900">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-zinc-600 dark:text-zinc-500">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Form Content */}
          {children}
        </div>
      </div>
    </div>
  );
}
