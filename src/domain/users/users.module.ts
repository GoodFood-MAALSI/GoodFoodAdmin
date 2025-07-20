import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Session } from '../session/entities/session.entity';
import { MailsModule } from '../mails/mails.module';
import { HttpModule } from '@nestjs/axios';
import { InterserviceAuthGuard } from '../interservice/guards/interservice-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session]),
    MailsModule,
    HttpModule
  ],
  controllers: [UsersController],
  providers: [UsersService, InterserviceAuthGuard],
  exports: [
    TypeOrmModule.forFeature([User]),
    UsersService,
  ],
})
export class UsersModule {}