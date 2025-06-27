import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { MailerService } from 'src/domain/mailer/mailer.service';
import { MailData } from './types/mails.type';
import * as path from 'path';

@Injectable()
export class MailsService {
  constructor(private readonly mailerService: MailerService) {}

  async confirmRegisterUser(
    mailData: MailData<{ hash: string; user: string }>,
  ): Promise<void> {
    try {
      const frontendDomain = process.env.FRONTEND_DOMAIN;
      if (!frontendDomain) {
        throw new Error('FRONTEND_DOMAIN is not defined');
      }

      const templatePath = path.join(__dirname, 'templates', 'confirm.hbs');
      const imagePath = path.join(__dirname, 'img', 'logo_goodfood.jpg');

      await this.mailerService.sendMail({
        to: mailData.to,
        subject: 'Confirmer votre compte Goodfood',
        text: `${frontendDomain}/confirm-email/${mailData.data.hash}`,
        templatePath,
        context: {
          fullname: mailData.data.user,
          confirmationLink: `${frontendDomain}/confirm-email/${mailData.data.hash}`,
        },
        attachments: [
          {
            filename: 'logo_goodfood.jpg',
            path: imagePath,
            cid: 'logo_goodfood',
            encoding: 'base64',
          },
        ],
      });
    } catch (error) {
      throw new HttpException(
        `Échec de l'envoi de l'email: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async forgotPassword(
    mailData: MailData<{ hash: string; user: string }>,
  ): Promise<void> {
    try {
      const frontendDomain = process.env.FRONTEND_DOMAIN;
      if (!frontendDomain) {
        throw new Error('FRONTEND_DOMAIN is not defined');
      }

      const templatePath = path.join(
        __dirname,
        'templates',
        'reset-password.hbs',
      );
      const imagePath = path.join(__dirname, 'img', 'logo_goodfood.jpg');

      await this.mailerService.sendMail({
        to: mailData.to,
        subject: 'Réinitialisation de mot de passe',
        text: `${frontendDomain}/password-change/${mailData.data.hash}`,
        templatePath,
        context: {
          fullname: mailData.data.user,
          resetLink: `${frontendDomain}/password-change/${mailData.data.hash}`,
        },
        attachments: [
          {
            filename: 'logo_goodfood.jpg',
            path: imagePath,
            cid: 'logo_goodfood',
            encoding: 'base64',
          },
        ],
      });
    } catch (error) {
      throw new HttpException(
        `Échec de l'envoi de l'email: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendUserCredentials(
    mailData: MailData<{ user: string; password: string }>,
  ): Promise<void> {
    try {
      const frontendDomain = process.env.FRONTEND_DOMAIN;
      if (!frontendDomain) {
        throw new Error('FRONTEND_DOMAIN is not defined');
      }

      const templatePath = path.join(
        __dirname,
        'templates',
        'user-credentials.hbs',
      );
      const imagePath = path.join(__dirname, 'img', 'logo_goodfood.jpg');

      await this.mailerService.sendMail({
        to: mailData.to,
        subject: 'Vos identifiants de connexion Goodfood',
        text: `Vos identifiants ont été créés. Email: ${mailData.to}, Mot de passe: ${mailData.data.password}`,
        templatePath,
        context: {
          fullname: mailData.data.user,
          email: mailData.to,
          password: mailData.data.password,
          frontendDomain,
        },
        attachments: [
          {
            filename: 'logo_goodfood.jpg',
            path: imagePath,
            cid: 'logo_goodfood',
            encoding: 'base64',
          },
        ],
      });
    } catch (error) {
      throw new HttpException(
        `Échec de l'envoi de l'email: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}