import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { User as UserDecorator } from './decorators/user.decorator';
import { User } from './entities/user.entity';
import * as jwt from 'jsonwebtoken';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Récupérer un utilisateur par ID' })
  @ApiResponse({ status: 200, description: 'Utilisateur trouvé' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async findOne(
    @Param('id') id: string,
    @UserDecorator() currentUser: JwtPayloadType,
  ): Promise<User> {
    const userId = +id;

    if (!currentUser?.id) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (currentUser.id !== userId) {
      throw new HttpException(
        'Vous ne pouvez accéder qu’à votre propre compte',
        HttpStatus.FORBIDDEN,
      );
    }

    const user = await this.usersService.findOneUser({ id: userId });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: "Mettre à jour le prénom et/ou nom d'un utilisateur",
  })
  @ApiResponse({ status: 200, description: 'Utilisateur mis à jour' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UserDecorator() currentUser: JwtPayloadType,
  ): Promise<Partial<User>> {
    const userId = +id;

    if (!currentUser?.id) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (currentUser.id !== userId) {
      throw new HttpException(
        'Vous ne pouvez modifier que votre propre compte',
        HttpStatus.FORBIDDEN,
      );
    }

    const user = await this.usersService.findOneUser({ id: userId });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const updatedUser = await this.usersService.updateUser(
      userId,
      updateUserDto,
    );
    return {
      id: updatedUser.id,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      updated_at: updatedUser.updated_at,
    };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Supprimer définitivement un utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur supprimé définitivement',
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiResponse({
    status: 403,
    description: 'Vous ne pouvez supprimer que votre propre compte',
  })
  async remove(
    @Param('id') id: string,
    @UserDecorator() currentUser: JwtPayloadType,
  ): Promise<{ message: string }> {
    const userId = +id;

    if (!currentUser?.id) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (currentUser.id !== userId) {
      throw new HttpException(
        'Vous ne pouvez supprimer que votre propre compte',
        HttpStatus.FORBIDDEN,
      );
    }

    const user = await this.usersService.findOneUser({ id: userId });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return this.usersService.deleteUser(userId);
  }

  @Get('/verify/:userId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Vérifier un utilisateur pour les appels inter-services' })
  @ApiResponse({ status: 200, description: 'Utilisateur vérifié' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Rôle invalide' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async verifyRestaurateur(@Param('userId') userId: string, @Request() req) {

    // Récupérer le token depuis l'en-tête Authorization
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      throw new HttpException('Token manquant', HttpStatus.UNAUTHORIZED);
    }

    try {
      // Valider le token avec la clé secrète
      let decoded: any = null;
      const secret = process.env.AUTH_JWT_SECRET;
      decoded = jwt.verify(token, secret);
      const authUserId = decoded.id?.toString();
      const authRole = decoded.role;

      if (!authUserId || !authRole) {
        throw new HttpException('ID ou rôle manquant dans le token', HttpStatus.UNAUTHORIZED);
      }

      if (authRole !== 'restaurateur') {
        throw new HttpException('Rôle invalide', HttpStatus.FORBIDDEN);
      }

      if (userId !== authUserId) {
        throw new HttpException('Utilisateur non autorisé', HttpStatus.FORBIDDEN);
      }

      const user = await this.usersService.findOneUser({ id: +userId });
      if (!user) {
        throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
      }

      return { message: 'Restaurateur vérifié' };
    } catch (err) {
      throw new HttpException('Erreur de validation du token', HttpStatus.UNAUTHORIZED);
    }
  }
}