import { Injectable, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from 'src/domain/users/users.service';

@Injectable()
export class AuthValidGuard extends AuthGuard('jwt') {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Vérifier d'abord l'authentification JWT
    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      return false;
    }

    // Récupérer l'utilisateur depuis la requête
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new HttpException('Utilisateur non authentifié', HttpStatus.UNAUTHORIZED);
    }

    // Vérifier le user
    const user = await this.usersService.findOneUser({ id: userId });
    if (!user) {
      throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
    }

    if (user.force_password_change) {
      throw new HttpException(
        'Vous devez changer votre mot de passe avant de continuer',
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}