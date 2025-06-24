import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import * as fs from 'node:fs/promises';

@Injectable()
export class MailerService {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAILER_HOST,
      port: parseInt(process.env.MAILER_PORT),
      ignoreTLS: process.env.MAILER_IGNORE_TLS === 'true',
      secure: process.env.MAILER_SECURE === 'true',
      requireTLS: process.env.MAILER_REQUIRE_TLS === 'true',
      auth: {
        user: process.env.MAILER_USER,
        pass: process.env.MAILER_PASSWORD,
      },
      debug: true,
    });
  }

  async sendMail({
    templatePath,
    context,
    ...mailOptions
  }: nodemailer.SendMailOptions & {
    templatePath: string;
    context: Record<string, unknown>;
  }): Promise<void> {
    let html: string | undefined;
    if (templatePath) {
      const template = await fs.readFile(templatePath, 'utf-8');
      html = Handlebars.compile(template, {
        strict: true,
      })(context);
    }

    await this.transporter.sendMail({
      ...mailOptions,
      from: mailOptions.from
        ? mailOptions.from
        : `"${process.env.MAILER_DEFAULT_NAME}" <${
            process.env.MAILER_DEFAULT_EMAIL
          }>`,
      html: mailOptions.html ? mailOptions.html : html,
    });
  }
}
