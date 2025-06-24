import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { UsersService } from "src/domain/users/users.service";
import { AuthEmailLoginDto } from "./dtos/auth-email-login.dto";
import { LoginResponseType } from "./types/login-response.type";
import * as crypto from "crypto";
import { User, UserStatus } from "src/domain/users/entities/user.entity";
import { SessionService } from "src/domain/session/session.service";
import { Session } from "src/domain/session/entities/session.entity";
import * as ms from "ms";
import { JwtService } from "@nestjs/jwt";
import { AuthRegisterDto } from "./dtos/auth-register.dto";
import { randomStringGenerator } from "@nestjs/common/utils/random-string-generator.util";
import { compareHash } from "src/domain/utils/helpers";
import { MailsService } from "src/domain/mails/mails.service";
import { JwtPayloadType } from "./strategies/types/jwt-payload.type";
import { NullableType } from "src/domain/utils/types/nullable.type";
import { ForgotPasswordService } from "src/domain/forgot-password/forgot-password.service";
import { JwtRefreshPayloadType } from "./strategies/types/jwt-refresh-payload.type";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly mailsService: MailsService,
    private readonly sessionService: SessionService,
    private readonly forgotPasswordService: ForgotPasswordService,
    private readonly jwtService: JwtService,
  ) {}

  async validateLogin(loginDto: AuthEmailLoginDto): Promise<LoginResponseType> {
    const user = await this.usersService.findOneUser({
      email: loginDto.email,
    });

    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: "Non trouvé",
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (user.status === "inactive") {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: "L'adresse email de l'utilisateur doit être vérifié",
        },
        HttpStatus.FORBIDDEN,
      );
    }

    const isValidPassword = await compareHash(loginDto.password, user.password);

    if (!isValidPassword) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            password: "Mot de passe incorrect",
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const session = await this.sessionService.create({
      user,
    });

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: user.id,
      sessionId: session.id,
      role: 'restaurateur', // Ajout du rôle
    });

    return {
      refreshToken,
      token,
      tokenExpires,
      user,
    };
  }

  async registerUser(registerDto: AuthRegisterDto): Promise<string> {
    const hash = crypto
      .createHash("sha256")
      .update(randomStringGenerator())
      .digest("hex");

    await this.usersService.createUser({
      ...registerDto,
      email: registerDto.email,
      status: UserStatus.Inactive,
      hash,
    });

    await this.mailsService.confirmRegisterUser({
      to: registerDto.email,
      data: {
        hash,
        user: registerDto.last_name + " " + registerDto.first_name,
      },
    });

    return "Un email de vérification a été envoyé. Veuillez vérifier votre boîte de réception.";
  }

  async status(userJwtPayload: JwtPayloadType): Promise<NullableType<User>> {
    return await this.usersService.findOneUser({
      id: userJwtPayload.id,
    });
  }

  async confirmEmail(hash: string): Promise<string> {
    const user = await this.usersService.findOneUser({
      hash,
    });

    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: "Non trouvé",
        },
        HttpStatus.NOT_FOUND,
      );
    }

    user.hash = null;
    user.status = UserStatus.Active;
    await this.usersService.saveUser(user);

    return "Votre compte a été vérifié avec succès !";
  }

  async forgotPassword(email: string): Promise<string> {
    const user = await this.usersService.findOneUser({
      email,
    });

    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: "L'email n'existe pas",
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const hash = crypto
      .createHash("sha256")
      .update(randomStringGenerator())
      .digest("hex");
    await this.forgotPasswordService.create({
      hash,
      user,
    });

    await this.mailsService.forgotPassword({
      to: email,
      data: {
        hash,
        user: user.last_name + " " + user.first_name,
      },
    });

    return "Si un utilisateur existe avec cette adresse email, un email lui a été envoyé.";
  }

  async resetPassword(hash: string, password: string): Promise<string> {
    const forgotReq = await this.forgotPasswordService.findOne({
      where: {
        hash,
      },
    });

    if (!forgotReq) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            hash: "Non trouvé",
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const user = forgotReq.user;
    user.password = password;

    await this.sessionService.delete({
      user: {
        id: user.id,
      },
    });
    await this.usersService.saveUser(user);
    await this.forgotPasswordService.delete(forgotReq.id);

    return "Votre mot de passe a été réinitialisé avec succès !";
  }

  async refreshToken(
    data: Pick<JwtRefreshPayloadType, "sessionId">,
  ): Promise<Omit<LoginResponseType, "user">> {
    const session = await this.sessionService.findOne({
      where: {
        id: data.sessionId,
      },
    });

    if (!session) {
      throw new UnauthorizedException();
    }

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: session.user.id,
      sessionId: session.id,
      role: 'restaurateur', // Ajout du rôle
    });

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }

  async logout(data: Pick<JwtRefreshPayloadType, "sessionId">): Promise<string> {
    await this.sessionService.delete({
      id: data.sessionId,
    });

    return "Déconnexion";
  }

  private async getTokensData(data: {
    id: User["id"];
    sessionId: Session["id"];
    role: string; // Ajout du rôle
  }) {
    const tokenExpiresIn = process.env.AUTH_JWT_TOKEN_EXPIRES_IN;
    const refreshExpiresIn = process.env.AUTH_REFRESH_TOKEN_EXPIRES_IN;

    const tokenExpires = Date.now() + ms(tokenExpiresIn);

    const [token, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          id: data.id,
          sessionId: data.sessionId,
          role: data.role, // Inclure le rôle dans le token
        },
        {
          secret: process.env.AUTH_JWT_SECRET,
          expiresIn: tokenExpiresIn,
        },
      ),
      this.jwtService.signAsync(
        {
          sessionId: data.sessionId,
        },
        {
          secret: process.env.AUTH_REFRESH_SECRET,
          expiresIn: refreshExpiresIn,
        },
      ),
    ]);

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }
}