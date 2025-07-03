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
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { User as UserDecorator } from './decorators/user.decorator';
import { User, UserStatus } from './entities/user.entity';
import * as jwt from 'jsonwebtoken';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { FilterUsersDto } from './dto/filter-users.dto';
import { Pagination } from '../utils/pagination';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Récupérer tous les utilisateurs' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  async findAll(
    @Query() filterUsersDto: FilterUsersDto,
    @Req() req: Request,
  ): Promise<{ users: User[]; links: any; meta: any }> {
    try {
      const { users, total } =
        await this.usersService.findAllUsers(filterUsersDto);
      const { links, meta } = Pagination.generatePaginationMetadata(
        req,
        filterUsersDto.page || 1,
        total,
        filterUsersDto.limit || 10,
      );

      return { users, links, meta };
    } catch (error) {
      throw new HttpException(
        {
          message: 'Échec de la récupération des utilisateurs',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(SuperAdminGuard)
  @ApiOperation({
    summary:
      'Créer un nouvel utilisateur et envoyer un email avec le mot de passe',
  })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({ status: 409, description: 'Utilisateur déjà existant' })
  async create(
    @Body() createUserDto: CreateAdminUserDto,
  ): Promise<{ message: string }> {
    const message =
      await this.usersService.createUserWithPasswordEmail(createUserDto);
    return { message };
  }

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

  @Patch(':id/suspend')
  @ApiBearerAuth()
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Suspendre un utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur suspendus avec succès' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiResponse({ status: 400, description: 'Utilisateur déjà suspendu' })
  async suspend(
    @Param('id') id: string,
    @UserDecorator() currentUser: JwtPayloadType,
  ): Promise<{ message: string }> {
    const userId = +id;

    const user = await this.usersService.findOneUser({ id: userId });
    if (!user) {
      throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
    }

    if (user.status === UserStatus.Suspended) {
      throw new HttpException(
        'L\'utilisateur est déjà suspendu',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (currentUser.id === userId) {
      throw new HttpException(
        'Vous ne pouvez pas suspendre votre propre compte',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.usersService.suspendUser(userId);
    return { message: 'Utilisateur suspendu avec succès' };
  }

  @Patch(':id/restore')
  @ApiBearerAuth()
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Réactiver un utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur réactivés avec succès' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiResponse({ status: 400, description: 'Utilisateur non suspendu' })
  async restore(
    @Param('id') id: string,
    @UserDecorator() currentUser: JwtPayloadType,
  ): Promise<{ message: string }> {
    const userId = +id;

    const user = await this.usersService.findOneUser({ id: userId });
    if (!user) {
      throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
    }

    if (user.status !== UserStatus.Suspended) {
      throw new HttpException(
        'L\'utilisateur n\'est pas suspendu',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (currentUser.id === userId) {
      throw new HttpException(
        'Vous ne pouvez pas réactivé votre propre compte',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.usersService.restoreUser(userId);
    return { message: 'Utilisateur réactivé avec succès' };
  }

  @Get('/verify/:userId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Vérifier un utilisateur pour les appels inter-services',
  })
  @ApiResponse({ status: 200, description: 'Utilisateur vérifié' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Rôle invalide' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async verifyAdministrateur(@Param('userId') userId: string, @Req() req) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      throw new HttpException('Token manquant', HttpStatus.UNAUTHORIZED);
    }

    try {
      let decoded: any = null;
      const secret = process.env.AUTH_JWT_SECRET;
      decoded = jwt.verify(token, secret);
      const authUserId = decoded.id?.toString();
      const authRole = decoded.role;

      if (!authUserId || !authRole) {
        throw new HttpException(
          'ID ou rôle manquant dans le token',
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (authRole !== 'administrateur') {
        throw new HttpException('Rôle invalide', HttpStatus.FORBIDDEN);
      }

      if (userId !== authUserId) {
        throw new HttpException(
          'Utilisateur non autorisé',
          HttpStatus.FORBIDDEN,
        );
      }

      const user = await this.usersService.findOneUser({ id: +userId });
      if (!user) {
        throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
      }

      return { message: 'Administrateur vérifié' };
    } catch (err) {
      throw new HttpException(
        'Erreur de validation du token',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
