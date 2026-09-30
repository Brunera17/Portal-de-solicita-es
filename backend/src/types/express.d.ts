import type { Perfil } from '@prisma/client';

export interface UsuarioAutenticado {
  id: number;
  nome: string;
  perfil: Perfil;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}
