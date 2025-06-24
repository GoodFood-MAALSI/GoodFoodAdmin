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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: AuthEmailLoginDto): Promise<LoginResponseType> {
    return this.authService.validateLogin(loginDto);
  }

  @Post('register')
  async register(
    @Body() createUserDto: AuthRegisterDto,
  ): Promise<{ message: string }> {
    const message = await this.authService.registerUser(createUserDto);
    return { message };
  }

  @Post('confirm-email')
  async confirmEmail(
    @Body() confirmEmailDto: AuthConfirmEmailDto,
  ): Promise<{ message: string }> {
    const message = await this.authService.confirmEmail(confirmEmailDto.hash);
    return { message };
  }

  @ApiBearerAuth()
  @Get('status')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  public status(@Request() request): Promise<NullableType<User>> {
    return this.authService.status(request.user);
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: AuthForgotPasswordDto,
  ): Promise<{ message: string }> {
    const message = await this.authService.forgotPassword(
      forgotPasswordDto.email,
    );
    return { message };
  }

  @Post('reset-password')
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
  public refresh(@Request() request): Promise<Omit<LoginResponseType, 'user'>> {
    return this.authService.refreshToken({
      sessionId: request.user.sessionId,
    });
  }

  @ApiBearerAuth()
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  public async logout(@Request() request): Promise<{ message: string }> {
    const message = await this.authService.logout({
      sessionId: request.user.sessionId,
    });
    return { message };
  }
}