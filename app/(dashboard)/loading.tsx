import { Skeleton } from "@/components/ui/skeleton";

/**
 * Se muestra mientras Next.js compila la ruta en dev.
 * Da feedback inmediato al cambiar de página en el dashboard.
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-72 w-full rounded-lg" />
    </div>
  );
}
