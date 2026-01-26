"use client";

import { ReactNode } from "react";
import Logo from "../common/logo";
import Image from "next/image";

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBranding?: boolean;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  showBranding = true,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex overflow-x-hidden">
      {/* Left Panel - Login Form (55%) */}
      <div className="w-full  flex flex-col gap-8 items-center justify-center bg-linear-to-b to-primary/50 from-70% from-white p-8 lg:p-12">
        <div className="w-full max-w-md space-y-6 bg-white backdrop-blur-sm rounded-2xl p-8">
          {/* Logo */}
          <Logo className="w-44" />

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

        {showBranding && (
          <div className="flex flex-col items-center gap-2">
            <Image
              src="/logos/logo-vekino.svg"
              alt="Logo"
              width={100}
              height={100}
            />
            <p className="text-xs text-black/60 font-medium">
              Powered by <span className="text-primary font-bold">Vekino</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
