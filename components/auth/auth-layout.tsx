"use client";

import { ReactNode } from "react";
import Logo from "../common/logo";
import { useCondominio } from "@/app/providers/condominio-provider";

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {

  return (
    <div className="min-h-screen w-screen flex">
      {/* Left Panel - Login Form (55%) */}
      <div className="w-full lg:w-[55%] flex items-center justify-center bg-white dark:bg-zinc-50 p-8 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <Logo />

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

      {/* Right Panel - Image (45%) */}
      <div className="hidden lg:flex lg:w-[45%] relative h-screen">
        <img
          src="/img/auth.png"
          alt="Auth"
          className="absolute inset-0 w-full h-full object-cover rounded-bl-[7rem]"
        />
      </div>
    </div>
  );
}
