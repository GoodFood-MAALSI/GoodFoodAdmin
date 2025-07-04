import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { OrNeverType } from '../../utils/types/or-never.type';
import { JwtPayloadType } from './types/jwt-payload.type';
import { UsersService } from '../../users/users.service';
import { UserStatus } from 'src/domain/users/entities/user.entity';

@Injectable()
export class JwtChangePasswordStrategy extends PassportStrategy(Strategy, 'jwt-change-password') {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.AUTH_JWT_SECRET,
    });
  }

  async validate(
    payload: JwtPayloadType,
  ): Promise<OrNeverType<JwtPayloadType>> {
    if (!payload.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.usersService.findOneUser({ id: payload.id });
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (user.status === UserStatus.Suspended) {
      throw new UnauthorizedException(
        'Votre compte a été suspendu. Veuillez contacter le support.',
      );
    }

    // Pas de vérification de force_password_change ici
    return payload;
  }
}