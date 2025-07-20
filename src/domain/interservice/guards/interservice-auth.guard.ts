import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Type,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UsersService } from '../../users/users.service';

// Définir un type pour le payload JWT
type JwtPayload = {
  id: string;
  role: 'client' | 'restaurateur' | 'deliverer' | 'super-admin' | 'admin';
};

@Injectable()
export class InterserviceAuthGuard implements CanActivate {
  private allowedRoles: Array<
    'client' | 'restaurateur' | 'deliverer' | 'super-admin' | 'admin'
  >;

  constructor(
    @Inject(HttpService) private readonly httpService: HttpService,
    @Inject(UsersService) private readonly usersService: UsersService,
  ) {}

  setRoles(
    roles: Array<
      'client' | 'restaurateur' | 'deliverer' | 'super-admin' | 'admin'
    >,
  ) {
    this.allowedRoles = roles;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['authorization']?.split(' ')[1];

    if (!token) {
      throw new HttpException('Token manquant', HttpStatus.UNAUTHORIZED);
    }

    try {
      let decoded: JwtPayload | null = null;

      // Gérer super-admin et admin localement
      if (this.allowedRoles.includes('super-admin') || this.allowedRoles.includes('admin')) {
        const secret = process.env.AUTH_JWT_SECRET;
        if (!secret) {
          throw new HttpException(
            'Clé secrète JWT manquante',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
        decoded = jwt.verify(token, secret) as JwtPayload;

        // Vérifier si le rôle décodé est dans allowedRoles
        if (!this.allowedRoles.includes(decoded.role)) {
          throw new HttpException(
            'Rôle non autorisé pour cet endpoint',
            HttpStatus.FORBIDDEN,
          );
        }

        const userId = parseInt(decoded.id, 10);
        const user = await this.usersService.findOneUser({ id: userId });
        if (!user) {
          throw new HttpException(
            'Utilisateur super-admin ou admin non trouvé',
            HttpStatus.UNAUTHORIZED,
          );
        }
        request.user = { id: userId, role: decoded.role };
        return true;
      }

      // Vérification des rôles et association des secrets pour les autres rôles
      const secrets: Record<string, string | undefined> = {
        client: process.env.CLIENT_SECRET,
        restaurateur: process.env.RESTAURATEUR_SECRET,
        deliverer: process.env.DELIVERY_SECRET,
      };

      const roleToServiceMap: Record<string, string> = {
        client: 'client-service.client.svc.cluster.local:3001/users',
        restaurateur: 'restaurateur-service.restaurateur.svc.cluster.local:3002/users',
        deliverer: 'delivery-service.delivery.svc.cluster.local:3003/users',
      };

      for (const role of this.allowedRoles) {
        if (role === 'admin' || role === 'super-admin') continue;

        try {
          const secret = secrets[role];
          if (!secret) {
            throw new HttpException(
              `Clé secrète manquante pour le rôle ${role}`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
          decoded = jwt.verify(token, secret) as JwtPayload;
          if (decoded.role === role) {
            const response = await firstValueFrom(
              this.httpService.get(
                `http://${roleToServiceMap[role]}/verify/${decoded.id}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                },
              ),
            );

            if (response.status === 200) {
              request.user = { id: decoded.id, role: decoded.role };
              return true;
            }
          }
        } catch (err) {
          continue;
        }
      }

      throw new HttpException(
        'Rôle non autorisé, token invalide ou utilisateur inexistant',
        HttpStatus.FORBIDDEN,
      );
    } catch (err) {
      throw err instanceof HttpException
        ? err
        : new HttpException(
            "Erreur d'authentification",
            HttpStatus.UNAUTHORIZED,
          );
    }
  }
}

export const InterserviceAuthGuardFactory = (
  roles: Array<'client' | 'restaurateur' | 'deliverer' | 'super-admin' | 'admin'>,
): Type<CanActivate> => {
  @Injectable()
  class ConfiguredGuard extends InterserviceAuthGuard {
    constructor(httpService: HttpService, usersService: UsersService) {
      super(httpService, usersService);
      this.setRoles(roles);
    }
  }
  return ConfiguredGuard;
};