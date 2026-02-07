import { Skeleton } from "@/components/ui/skeleton";

/**
 * Se muestra mientras Next.js compila la ruta en dev (o resuelve el segmento).
 * Evita pantalla en blanco al navegar a Finanzas, Residentes, Guardias, etc.
 */
export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}
