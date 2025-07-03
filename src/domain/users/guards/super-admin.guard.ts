import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from 'src/domain/users/users.service';
import { UserRole, UserStatus } from 'src/domain/users/entities/user.entity';

@Injectable()
export class SuperAdminGuard extends AuthGuard('jwt') {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Vérifier l'authentification JWT
    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      return false;
    }

    // Récupérer l'utilisateur depuis la requête
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Vérifier le rôle
    const user = await this.usersService.findOneUser({ id: userId });
    if (!user) {
      throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
    }

    if (user.status === UserStatus.Suspended) {
      throw new UnauthorizedException(
        'Votre compte a été suspendu. Veuillez contacter le support.',
      );
    }

    if (user.force_password_change) {
      throw new UnauthorizedException(
        'Vous devez changer votre mot de passe avant de continuer',
      );
    }

    if (user.role !== UserRole.SuperAdmin) {
      throw new UnauthorizedException(
        'Seul un super-admin peut accéder à cette route'
      );
    }

    return true;
  }
}
