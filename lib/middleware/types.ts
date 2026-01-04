// Tipos para la respuesta de autenticación
export type UserRole = 'PROPIETARIO' | 'ADMIN' | 'SUPERADMIN';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  image: string | null;
  [key: string]: any;
}

export interface AuthSession {
  id?: string;
  token: string;
  expiresAt: string;
  userId: string;
  [key: string]: any;
}

export interface AuthResponse {
  user: AuthUser;
  session: AuthSession;
}

