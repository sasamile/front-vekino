'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Reintentar 3 veces en caso de error
            retry: 3,
            // Tiempo de espera antes de reintentar (en ms)
            retryDelay: 1000,
            // Refetch cuando la ventana recupera el foco
            refetchOnWindowFocus: true,
            // Refetch cuando se reconecta la red
            refetchOnReconnect: true,
            // No refetch en montaje si los datos están frescos
            refetchOnMount: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

