'use client';

import { useState } from 'react';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Preparar headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Si hay session token, agregarlo al header Cookie
      if (sessionToken) {
        // Si el usuario pega el token completo con "better-auth.session_token=", extraer solo el valor
        const tokenValue = sessionToken.includes('better-auth.session_token=')
          ? sessionToken.split('better-auth.session_token=')[1]
          : sessionToken;
        
        headers['Cookie'] = `better-auth.session_token=${tokenValue}`;
      }

      // Detectar automáticamente el entorno
      // En desarrollo: usa /api (con rewrite si ENABLE_API_REWRITE=true)
      // En producción: usa la URL completa del backend
      const apiUrl = process.env.ENABLE_API_REWRITE === 'true'
        ? '/api/condominios/login'
        : 'https://api-condominio-las-flores.vekino.site/api/condominios/login';

      const response = await axios.post(
        apiUrl,
        {
          email,
          password,
        },
        {
          headers,
          withCredentials: true,
        }
      );

      setResponse(response.data);
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Error al hacer login'
      );
      console.error('Error en login:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-black dark:text-zinc-50">
        Login
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
   

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="nspes2022@gmail.com"
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="password123"
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors"
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-md">
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 rounded-md">
          <p className="text-green-700 dark:text-green-400 text-sm font-medium">
            ¡Login exitoso!
          </p>
          {response && (
            <pre className="mt-2 text-xs overflow-auto bg-white dark:bg-zinc-800 p-2 rounded">
              {JSON.stringify(response, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}



