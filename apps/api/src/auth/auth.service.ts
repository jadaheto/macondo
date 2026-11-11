import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { LoginResponse } from '@macondo/shared';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from './auth.types';

const BCRYPT_COST = 10;

// Hash ficticio para igualar tiempos cuando el usuario no existe.
const DUMMY_HASH = '$2a$10$t5YJ/W.YjvA1wTOmBxKFVecDgKtm./mkwDLcAndXGtM3L4I3ieKCG';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService, private readonly audit: AuditService) {}

  /** Cambia la contraseña del usuario autenticado tras verificar la actual. Queda en la auditoría (sin contraseñas). */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ ok: true }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const ok = await bcrypt.compare(currentPassword, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !user.active || !ok) throw new UnauthorizedException('La contraseña actual no es correcta');
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await this.audit.log(user.id, 'USER_PASSWORD_CHANGE', 'User', user.id, { email: user.email });
    return { ok: true };
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !user.active || !ok) throw new UnauthorizedException('Correo o contraseña incorrectos');
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwt.signAsync(payload);
    return { accessToken, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  }
}
