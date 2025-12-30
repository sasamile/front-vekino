export interface Usuario {
  id: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string | null;
  name: string;
  identificationNumber: string | null;
  image: string | null;
  numeroDocumento: string | null;
  ownerId: string | null;
  role: string;
  telefono: string | null;
  tipoDocumento: string | null;
  unidadId: string | null;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

