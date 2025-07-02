import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthEmailLoginDto } from './dtos/auth-email-login.dto';
import { LoginResponseType } from './types/login-response.type';
import { AuthRegisterDto } from './dtos/auth-register.dto';
import { AuthConfirmEmailDto } from './dtos/auth-confirm-email.dto';
import { AuthGuard } from '@nestjs/passport';
import { NullableType } from 'src/domain/utils/types/nullable.type';
import { User } from 'src/domain/users/entities/user.entity';
import { AuthForgotPasswordDto } from './dtos/auth-forgot-password.dto';
import { AuthResetPasswordDto } from './dtos/auth-reset-password.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthChangePasswordDto } from './dtos/auth-change-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Se connecter" })
  login(@Body() loginDto: AuthEmailLoginDto): Promise<LoginResponseType> {
    return this.authService.validateLogin(loginDto);
  }

  // @Post('register')
  // @ApiOperation({ summary: "Création de compte" })
  // async register(
  //   @Body() createUserDto: AuthRegisterDto,
  // ): Promise<{ message: string }> {
  //   const message = await this.authService.registerUser(createUserDto);
  //   return { message };
  // }

  // @Post('confirm-email')
  // @ApiOperation({ summary: "Confirmer son adresse email" })
  // async confirmEmail(
  //   @Body() confirmEmailDto: AuthConfirmEmailDto,
  // ): Promise<{ message: string }> {
  //   const message = await this.authService.confirmEmail(confirmEmailDto.hash);
  //   return { message };
  // }

  @ApiBearerAuth()
  @Get('status')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Récupérer les informartions de l'utilisateur connecté" })
  public status(@Request() request): Promise<NullableType<User>> {
    return this.authService.status(request.user);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: "Demander la réinitialisation du mot de passe" })
  async forgotPassword(
    @Body() forgotPasswordDto: AuthForgotPasswordDto,
  ): Promise<{ message: string }> {
    const message = await this.authService.forgotPassword(
      forgotPasswordDto.email,
    );
    return { message };
  }

  @Post('reset-password')
  @ApiOperation({ summary: "Réinitialiser le mot de passe" })
  async resetPassword(
    @Body() resetPasswordDto: AuthResetPasswordDto,
  ): Promise<{ message: string }> {
    const message = await this.authService.resetPassword(
      resetPasswordDto.hash,
      resetPasswordDto.password,
    );
    return { message };
  }

  @ApiBearerAuth()
  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rafraîchir le token d'authentification" })
  public refresh(@Request() request): Promise<Omit<LoginResponseType, 'user'>> {
    return this.authService.refreshToken({
      sessionId: request.user.sessionId,
    });
  }

  @ApiBearerAuth()
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: "Se déconnecter" })
  public async logout(@Request() request): Promise<{ message: string }> {
    const message = await this.authService.logout({
      sessionId: request.user.sessionId,
    });
    return { message };
  }

  @ApiBearerAuth()
  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Changer le mot de passe de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Mot de passe changé avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async changePassword(
    @Request() request,
    @Body() changePasswordDto: AuthChangePasswordDto,
  ): Promise<{ message: string }> {
    const message = await this.authService.changePassword(
      request.user.id,
      changePasswordDto.password,
    );
    return { message };
  }
}