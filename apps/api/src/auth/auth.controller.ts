import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ChangePasswordSchema, LoginSchema, type ChangePasswordInput, type LoginResponse } from '@macondo/shared';
import type { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthService } from './auth.service';
import type { AuthUser } from './auth.types';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  login(@Body(new ZodValidationPipe(LoginSchema)) body: z.infer<typeof LoginSchema>): Promise<LoginResponse> {
    return this.auth.login(body.email, body.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  /** Cambio de contraseña del usuario autenticado. Limitado por el throttler como el login. */
  @Post('password')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  changePassword(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(ChangePasswordSchema)) body: ChangePasswordInput): Promise<{ ok: true }> {
    return this.auth.changePassword(user.id, body.currentPassword, body.newPassword);
  }
}
