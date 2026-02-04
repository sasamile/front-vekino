import { NextRequest, NextResponse } from "next/server";
import { extractSubdomain, isLocalhost } from "@/lib/middleware/subdomain";

async function handler(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  const url = new URL(req.url);
  
  // Obtener el hostname de la request
  const hostname = req.headers.get('host') || '';
  const isLocal = isLocalhost(hostname);
  const subdomain = extractSubdomain(hostname);
  
  // Determinar la URL del backend según el subdominio
  let backendUrl: string;
  
  if (isLocal) {
    // En desarrollo, usar el subdominio correcto si existe
    if (subdomain) {
      backendUrl = `https://${subdomain}.vekino.site`;
    } else {
      backendUrl = "https://vekino.site";
    }
  } else {
    // En producción, usar el subdominio correcto
    if (subdomain) {
      backendUrl = `https://${subdomain}.vekino.site`;
    } else {
      backendUrl = "https://vekino.site";
    }
  }

  // arma la url destino en tu backend
  const target = `${backendUrl}/api/${path.join("/")}${url.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  
  // Asegurar que las cookies se envíen correctamente
  // Construir el header Cookie con todas las cookies
  const cookies: string[] = [];
  req.cookies.getAll().forEach((cookie) => {
    cookies.push(`${cookie.name}=${cookie.value}`);
  });
  if (cookies.length > 0) {
    headers.set('Cookie', cookies.join('; '));
  }

  const res = await fetch(target, {
    method: req.method,
    headers,
    body: ["GET", "HEAD"].includes(req.method)
      ? undefined
      : await req.arrayBuffer(),
    redirect: "manual",
  });

  const responseHeaders = new Headers(res.headers);

  // En respuestas 4xx, NO reenviar Set-Cookie que borre la sesión.
  // Si el backend devuelve 401/403 y además Set-Cookie para borrar la sesión,
  // el navegador borraría la cookie y el usuario quedaría deslogueado "de la nada".
  if (res.status >= 400 && res.status < 500) {
    const setCookieHeader = responseHeaders.get("set-cookie");
    if (setCookieHeader) {
      // Log para debugging (remover en producción si es necesario)
      console.log(`[Proxy] Bloqueando Set-Cookie en ${res.status} para ${path.join("/")}`);
      responseHeaders.delete("set-cookie");
    }
  }

  // Remover content-encoding: zstd ya que los navegadores no lo soportan
  const contentEncoding = responseHeaders.get('content-encoding');
  if (contentEncoding && contentEncoding.includes('zstd')) {
    responseHeaders.delete('content-encoding');
  }

  return new NextResponse(res.body, {
    status: res.status,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;