import type { Role } from '@macondo/shared';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export type AuthedRequest = import('express').Request & { user?: AuthUser };
