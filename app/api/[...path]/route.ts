import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://vekino.site"!;
// ejemplo: http://localhost:4000  (tu backend local)
// o https://vekino.site          (si no tienes backend local)

async function handler(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  const url = new URL(req.url);

  // arma la url destino en tu backend
  const target = `${BACKEND}/api/${path.join("/")}${url.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");

  const res = await fetch(target, {
    method: req.method,
    headers,
    body: ["GET", "HEAD"].includes(req.method)
      ? undefined
      : await req.arrayBuffer(),
    redirect: "manual",
  });

  // IMPORTANTÍSIMO: pasar Set-Cookie tal cual (para que el browser la guarde en localhost)
  const responseHeaders = new Headers(res.headers);

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
