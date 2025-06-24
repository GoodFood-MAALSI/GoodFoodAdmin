import { Module } from '@nestjs/common';
import { MailsService } from './mails.service';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from 'src/domain/mailer/mailer.module';

@Module({
  imports: [
    ConfigModule,
    MailerModule,
  ],
  providers: [MailsService],
  exports: [MailsService],
})
export class MailsModule {}