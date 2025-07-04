import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtChangePasswordGuard extends AuthGuard('jwt-change-password') {}